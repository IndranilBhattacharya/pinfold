import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { cursorMeta } from '@pinfold/core/meta';
import { Cursor } from './Cursor';
import { useCursor } from './useCursor';
import { defineCursor } from './define';

const HIDDEN = 'data-pinfold-cursor-hidden';
const move = (el: Element, x = 40, y = 50) => fireEvent.pointerMove(el, { pointerType: 'mouse', clientX: x, clientY: y });
const frame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe('Cursor', () => {
  it('is decoration: hidden from assistive technology, and nothing is hidden or drawn until the pointer moves', () => {
    const { container } = render(
      <Cursor>
        <button>Save</button>
      </Cursor>,
    );
    const cursor = container.querySelector('.pinfold-cursor')!;
    const area = container.querySelector('.pinfold-cursor__area')!;
    expect(cursor.getAttribute('aria-hidden')).toBe('true');
    expect(cursor.hasAttribute('data-visible')).toBe(false);
    expect(area.hasAttribute(HIDDEN)).toBe(false);
    move(area);
    expect(cursor.hasAttribute('data-visible')).toBe(true);
    expect(area.hasAttribute(HIDDEN)).toBe(true);
    expect((cursor.querySelector('[data-part="dot"]') as HTMLElement).style.transform).toBe('translate3d(40px, 50px, 0)');
  });

  it('takes a state from what it is over: pressable things, text fields, and anything marked data-cursor', () => {
    const onStateChange = vi.fn();
    const { container } = render(
      <Cursor onStateChange={onStateChange}>
        <p>Plain</p>
        <button>Save</button>
        <input aria-label="Name" />
        <figure data-cursor="zoom" data-cursor-label="View">
          <img alt="" />
        </figure>
      </Cursor>,
    );
    const cursor = container.querySelector('.pinfold-cursor')!;
    move(container.querySelector('.pinfold-cursor__area')!);
    fireEvent.pointerOver(screen.getByRole('button', { name: 'Save' }));
    expect(cursor.getAttribute('data-state')).toBe('pointer');
    expect(onStateChange).toHaveBeenLastCalledWith('pointer', screen.getByRole('button', { name: 'Save' }));
    fireEvent.pointerOver(screen.getByRole('textbox', { name: 'Name' }));
    expect(cursor.getAttribute('data-state')).toBe('text');
    fireEvent.pointerOver(container.querySelector('img')!);
    expect(cursor.getAttribute('data-state')).toBe('zoom');
    expect(cursor.querySelector('.pinfold-cursor__label')!.textContent).toBe('View');
    fireEvent.pointerOver(screen.getByText('Plain'));
    expect(cursor.getAttribute('data-state')).toBe('default');
    expect(cursor.querySelector('.pinfold-cursor__label')).toBeNull();
  });

  it('shows pressing, leaves with the pointer, and gives the system cursor back', () => {
    const onVisibleChange = vi.fn();
    const { container } = render(
      <Cursor onVisibleChange={onVisibleChange} label="You">
        <p>Area</p>
      </Cursor>,
    );
    const cursor = container.querySelector('.pinfold-cursor')!;
    const area = container.querySelector('.pinfold-cursor__area')!;
    move(area);
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    expect(cursor.querySelector('.pinfold-cursor__label')!.textContent).toBe('You');
    fireEvent.pointerDown(area);
    expect(cursor.hasAttribute('data-pressed')).toBe(true);
    fireEvent.pointerUp(window);
    expect(cursor.hasAttribute('data-pressed')).toBe(false);
    fireEvent.pointerLeave(area);
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    expect(area.hasAttribute(HIDDEN)).toBe(false);
  });

  it('without an area it covers the page; two cursors on the page share the hidden system cursor without fighting', () => {
    const one = render(<Cursor variant="ring" />);
    const two = render(<Cursor variant="dot" />);
    move(document.body);
    expect(document.documentElement.getAttribute(HIDDEN)).toBe('2');
    one.unmount();
    expect(document.documentElement.getAttribute(HIDDEN)).toBe('1');
    two.unmount();
    expect(document.documentElement.hasAttribute(HIDDEN)).toBe(false);
  });

  it('touch never wakes it; the spotlight keeps the system cursor; disabled does nothing', () => {
    const { container, rerender } = render(
      <Cursor variant="spotlight">
        <p>Area</p>
      </Cursor>,
    );
    const area = container.querySelector('.pinfold-cursor__area')!;
    fireEvent.pointerMove(area, { pointerType: 'touch', clientX: 5, clientY: 5 });
    expect(container.querySelector('.pinfold-cursor')!.hasAttribute('data-visible')).toBe(false);
    move(area);
    expect(container.querySelector('.pinfold-cursor')!.hasAttribute('data-visible')).toBe(true);
    expect(area.hasAttribute(HIDDEN)).toBe(false);
    rerender(
      <Cursor variant="spotlight" disabled>
        <p>Area</p>
      </Cursor>,
    );
    move(area);
    expect(container.querySelector('.pinfold-cursor')!.hasAttribute('data-visible')).toBe(false);
  });

  it('draws a trail and your own shape; the follower trails the pointer and the controller reports where it is', async () => {
    let api: ReturnType<typeof useCursor> | undefined;
    function App() {
      api = useCursor({ trail: 3, shape: '✦', smoothing: 0.5 });
      const Pointer = api;
      return (
        <Pointer>
          <p>Area</p>
        </Pointer>
      );
    }
    const { container } = render(<App />);
    expect(container.querySelectorAll('.pinfold-cursor__trail')).toHaveLength(3);
    expect(container.querySelector('.pinfold-cursor__shape')!.textContent).toBe('✦');
    expect(api!.getPosition()).toBeNull();
    move(container.querySelector('.pinfold-cursor__area')!, 100, 80);
    move(container.querySelector('.pinfold-cursor__area')!, 200, 80);
    await frame();
    expect(api!.getPosition()).toEqual({ x: 200, y: 80 });
    const follower = container.querySelector('[data-part="follower"]') as HTMLElement;
    const fx = Number(/translate3d\(([\d.]+)px/.exec(follower.style.transform)![1]);
    expect(fx).toBeGreaterThan(100);
    expect(fx).toBeLessThan(200);
  });
});

describePinfoldConformance({
  name: 'cursor',
  slots: ['root', 'area', 'dot', 'follower'],
  optionalSlots: ['trail', 'label'],
  cssFile: 'packages/css/src/cursor.css',
  meta: cursorMeta,
  preset: { define: defineCursor as any, props: { content: 'x' } },
  hook: { use: useCursor as any, config: { content: 'x' } },
  render: (config) => <Cursor content="x" {...config} />,
});
