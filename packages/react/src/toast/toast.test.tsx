import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { toastMeta } from '@pinfold/core/meta';
import { createToastStore } from '@pinfold/core';
import { Toast } from './Toast';
import { useToast } from './useToast';
import { defineToast } from './define';
import type { ToastComponent, ToastMessage } from './types';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(config = {}) {
  let ctrl!: ToastComponent;
  function Host() {
    const T = useToast(config);
    ctrl = T;
    return <T />;
  }
  render(<Host />);
  return ctrl;
}

/** What is on screen to read: a toast on its way out is hidden from screen readers already. */
const shown = (region: Element) => Array.from(region.querySelectorAll('.pinfold-toast__item:not([data-leaving])')).map((el) => el.textContent).join('');

describe('Toast', () => {
  it('has a named polite region from the first render, and shows a message', () => {
    const toasts = setup();
    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region.getAttribute('aria-live')).toBe('polite');
    act(() => void toasts.show({ title: 'Saved', description: 'All good', tone: 'success' }));
    expect(region.textContent).toContain('Saved');
    expect(region.querySelector('[data-tone="success"]')!.getAttribute('role')).toBeNull();
  });

  it('leaves after its duration; an error is an alert and stays', () => {
    const toasts = setup({ duration: 1000 });
    act(() => void toasts.show({ title: 'Saved' }));
    act(() => void toasts.show({ title: 'Failed', tone: 'danger' }));
    expect(screen.getByRole('alert').textContent).toContain('Failed');
    act(() => void vi.advanceTimersByTime(1000));
    const region = screen.getByRole('region');
    expect(shown(region)).not.toContain('Saved');
    expect(shown(region)).toContain('Failed');
  });

  it('pauses while the pointer is inside', () => {
    const toasts = setup({ duration: 1000 });
    act(() => void toasts.show({ title: 'Saved' }));
    const region = screen.getByRole('region');
    fireEvent.pointerEnter(region);
    act(() => void vi.advanceTimersByTime(5000));
    expect(region.textContent).toContain('Saved');
    fireEvent.pointerLeave(region);
    act(() => void vi.advanceTimersByTime(1000));
    expect(shown(region)).not.toContain('Saved');
  });

  it('a swipe toward the edge dismisses it; one against the edge springs back; swipe: false turns it off', () => {
    const onDismiss = vi.fn();
    const toasts = setup();
    act(() => void toasts.show({ title: 'A', onDismiss, duration: 0 }));
    const item = () => document.querySelector('.pinfold-toast__item:not([data-leaving])') as HTMLElement;
    const drag = (el: HTMLElement, to: number) => {
      fireEvent.pointerDown(el, { button: 0, clientX: 100, pointerId: 1 });
      fireEvent.pointerMove(el, { clientX: 100 + to, pointerId: 1 });
      fireEvent.pointerUp(el, { clientX: 100 + to, pointerId: 1 });
    };
    drag(item(), -200);
    expect(onDismiss).not.toHaveBeenCalled();
    drag(item(), 200);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region').hasAttribute('data-swipe')).toBe(true);
  });

  it('the dismiss button and Escape remove it, calling onDismiss', () => {
    const onDismiss = vi.fn();
    const toasts = setup();
    act(() => void toasts.show({ title: 'A', onDismiss, duration: 0 }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    act(() => void toasts.show({ title: 'B', duration: 0 }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dismiss' }), { key: 'Escape' });
    expect(shown(screen.getByRole('region'))).toBe('');
  });

  it('an action runs and closes it; the toast stays until then', () => {
    const retry = vi.fn();
    const toasts = setup({ duration: 100 });
    act(() => void toasts.show({ title: 'Failed', action: { label: 'Retry', onClick: retry } }));
    act(() => void vi.advanceTimersByTime(5000));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalled();
    expect(shown(screen.getByRole('region'))).toBe('');
  });

  it('a leaving toast stays hidden for its exit, then goes', () => {
    const toasts = setup();
    act(() => void toasts.show({ id: 'a', title: 'A', duration: 0 }));
    act(() => toasts.dismiss('a'));
    const region = screen.getByRole('region');
    const leaving = region.querySelector('[data-leaving]')!;
    expect(leaving.getAttribute('aria-hidden')).toBe('true');
    expect(leaving.getAttribute('role')).toBeNull();
    act(() => void vi.advanceTimersByTime(300));
    expect(region.querySelector('.pinfold-toast__item')).toBeNull();
  });

  it('piles them newest first and fans them out on hover or focus', () => {
    const toasts = setup();
    act(() => {
      toasts.show({ title: 'Old', duration: 0 });
      toasts.show({ title: 'New', duration: 0 });
    });
    const region = screen.getByRole('region');
    const items = region.querySelectorAll('.pinfold-toast__item');
    expect(items[0].textContent).toContain('New');
    expect(items[0].getAttribute('data-index')).toBe('0');
    expect(items[1].hasAttribute('data-behind')).toBe(true);
    expect(region.hasAttribute('data-stack')).toBe(true);
    expect(region.hasAttribute('data-expanded')).toBe(false);
    fireEvent.pointerEnter(region);
    expect(region.hasAttribute('data-expanded')).toBe(true);
    fireEvent.pointerLeave(region);
    expect(region.hasAttribute('data-expanded')).toBe(false);
    act(() => void screen.getAllByRole('button', { name: 'Dismiss' })[0].focus());
    expect(region.hasAttribute('data-expanded')).toBe(true);
  });

  it('with stack off, they are always laid out', () => {
    setup({ stack: false });
    const region = screen.getByRole('region');
    expect(region.hasAttribute('data-stack')).toBe(false);
    expect(region.hasAttribute('data-expanded')).toBe(true);
  });

  it('updates in place by id', () => {
    const toasts = setup();
    act(() => void toasts.show({ id: 's', title: 'Saving', duration: 0 }));
    act(() => void toasts.show({ id: 's', title: 'Saved', duration: 0 }));
    const region = screen.getByRole('region');
    expect(region.querySelectorAll('.pinfold-toast__item')).toHaveLength(1);
    expect(region.textContent).toContain('Saved');
  });

  it('a preset shows toasts from outside React, and its store can be shared', () => {
    const Toasts = defineToast({ placement: 'top' });
    render(<Toasts />);
    act(() => void Toasts.show({ title: 'From anywhere', duration: 0 }));
    const region = screen.getByRole('region');
    expect(region.getAttribute('data-placement')).toBe('top');
    expect(region.textContent).toContain('From anywhere');
    act(() => Toasts.clear());
    expect(shown(region)).toBe('');
  });

  it('renders an empty region on the server', () => {
    const store = createToastStore<ToastMessage>();
    store.show({ title: 'Client only', duration: 0 });
    const html = renderToString(<Toast store={store} />);
    expect(html).toContain('role="region"');
    expect(html).not.toContain('Client only');
  });
});

const seeded = createToastStore<ToastMessage>();
seeded.show({ id: 'seed', title: 'Saved', description: 'Live', tone: 'success', duration: 0, action: { label: 'Undo' } });

describePinfoldConformance({
  name: 'toast',
  inherits: [],
  variants: false,
  slots: ['root', 'list', 'item', 'icon', 'content', 'title', 'description', 'action', 'dismiss'],
  dimension: { key: 'width', value: 300 },
  cssFile: 'packages/css/src/toast.css',
  meta: toastMeta,
  preset: { define: defineToast as any, props: {}, probe: { key: 'placement', values: ['top', 'top-end', 'bottom'] } },
  hook: { use: useToast as any, config: {} },
  render: (config) => <Toast store={seeded} {...config} />,
});
