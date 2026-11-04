import * as React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { dialogMeta } from '@pinfold/core/meta';
import { Dialog } from './Dialog';
import { useDialog } from './useDialog';
import { defineDialog } from './define';
import type { DialogComponent } from './types';

// jsdom has no showModal: record the calls and set the attribute as the browser does.
const shown = vi.fn();
beforeAll(() => {
  const proto = window.HTMLDialogElement.prototype;
  proto.showModal = function (this: HTMLDialogElement) {
    shown('modal');
    this.setAttribute('open', '');
  };
  proto.show = function (this: HTMLDialogElement) {
    shown('plain');
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});
afterEach(() => shown.mockClear());

const root = (c: HTMLElement) => c.querySelector('dialog') as HTMLDialogElement;

describe('Dialog', () => {
  it('opens with showModal from the trigger, named and described, with content only while open', () => {
    const { container } = render(<Dialog title="Settings" description="Your account" content="Body" trigger={{ label: 'Open' }} />);
    expect(root(container).hasAttribute('open')).toBe(false);
    expect(root(container).textContent).toBe('');
    const button = screen.getByRole('button', { name: 'Open', hidden: true });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(button);
    expect(shown).toHaveBeenCalledWith('modal');
    expect(root(container).hasAttribute('open')).toBe(true);
    const title = container.querySelector('h2')!;
    expect(root(container).getAttribute('aria-labelledby')).toBe(title.id);
    expect(root(container).getAttribute('aria-describedby')).toBeTruthy();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('Escape and the backdrop close it; the scroll lock is released', () => {
    const { container } = render(<Dialog title="x" trigger={{ label: 'Open' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(root(container).hasAttribute('open')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.pointerDown(container.querySelector('.pinfold-dialog__panel')!);
    expect(root(container).hasAttribute('open')).toBe(true);
    fireEvent.pointerDown(root(container));
    expect(root(container).hasAttribute('open')).toBe(false);
  });

  it('an alert dialog stays on a backdrop press, has no close button, and focuses the first action', () => {
    const { container } = render(<Dialog role="alertdialog" title="Delete?" defaultOpen actions={[{ label: 'Cancel' }, { label: 'Delete', tone: 'danger' }]} />);
    fireEvent.pointerDown(root(container));
    expect(root(container).hasAttribute('open')).toBe(true);
    expect(root(container).getAttribute('role')).toBe('alertdialog');
    expect(container.querySelector('.pinfold-dialog__close')).toBeNull();
    expect((document.activeElement as HTMLElement).textContent).toContain('Cancel');
    const buttons = container.querySelectorAll('.pinfold-dialog__actions .pinfold-button');
    expect(buttons[0].getAttribute('data-variant')).toBe('ghost');
    expect(buttons[1].getAttribute('data-variant')).toBe('solid');
  });

  it('actions close it unless they return false', () => {
    const { container } = render(<Dialog title="x" defaultOpen actions={[{ label: 'Keep', onClick: () => false }, { label: 'Save' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(root(container).hasAttribute('open')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(root(container).hasAttribute('open')).toBe(false);
  });

  it('a non-modal dialog does not lock scroll or treat outside presses as closing', () => {
    const { container } = render(<Dialog title="x" modal={false} defaultOpen />);
    expect(shown).toHaveBeenCalledWith('plain');
    expect(document.documentElement.style.overflow).toBe('');
    fireEvent.pointerDown(document.body);
    expect(root(container).hasAttribute('open')).toBe(true);
  });

  it('has a controller, and reports changes', () => {
    const onOpenChange = vi.fn();
    let ctrl!: DialogComponent;
    function Host() {
      const D = useDialog({ title: 'x', onOpenChange });
      ctrl = D;
      return <D />;
    }
    const { container } = render(<Host />);
    act(() => ctrl.open());
    expect(ctrl.isOpen).toBe(true);
    expect(root(container).hasAttribute('open')).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    act(() => ctrl.close());
    expect(root(container).hasAttribute('open')).toBe(false);
  });

  it('renders closed on the server, without an open attribute or content', () => {
    const Confirm = defineDialog({ size: 'sm' });
    const html = renderToString(<Confirm title="Secret title" defaultOpen />);
    expect(html).toContain('<dialog');
    expect(html).not.toMatch(/<dialog[^>]* open/);
  });
});

describePinfoldConformance({
  name: 'dialog',
  inherits: [],
  variants: false,
  slots: ['root', 'panel', 'title', 'description', 'content', 'actions', 'close'],
  dimension: { key: 'width', value: 400 },
  cssFile: 'packages/css/src/dialog.css',
  meta: dialogMeta,
  preset: { define: defineDialog as any, props: { title: 'x', defaultOpen: true }, probe: { key: 'size', values: ['sm', 'lg', 'xl'] } },
  hook: { use: useDialog as any, config: { title: 'x' } },
  render: (config) => <Dialog title="Settings" description="Account" content="Body" actions={[{ label: 'Save' }]} defaultOpen {...config} />,
});
