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
    expect(onOpenChange).toHaveBeenCalledWith(true, 'api');
    act(() => ctrl.close());
    expect(root(container).hasAttribute('open')).toBe(false);
  });

  it('free content (a function of { close }), header and footer content, and children on the tag', () => {
    const { container } = render(
      <Dialog title="T" defaultOpen header={<span>Badge</span>} footer={({ close }) => <button onClick={close}>Later</button>} content={({ isOpen }) => <p>{isOpen ? 'Body' : 'x'}</p>} actions={[{ label: 'OK' }]} />,
    );
    expect(container.querySelector('.pinfold-dialog__header')!.textContent).toContain('Badge');
    expect(container.querySelector('.pinfold-dialog__content')!.textContent).toBe('Body');
    expect(container.querySelector('.pinfold-dialog__footer')!.textContent).toContain('Later');
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(root(container).hasAttribute('open')).toBe(false);
    const view = render(<Dialog title="Kids" defaultOpen>{'From children'}</Dialog>);
    expect(view.container.querySelector('.pinfold-dialog__content')!.textContent).toBe('From children');
  });

  it('reports why it opened and closed', () => {
    const onClose = vi.fn();
    const onOpen = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(<Dialog title="x" trigger={{ label: 'Open' }} actions={[{ label: 'Save' }]} onClose={onClose} onOpen={onOpen} onOpenChange={onOpenChange} />);
    const open = () => fireEvent.click(screen.getByRole('button', { name: 'Open', hidden: true }));
    open();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true, 'trigger');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenLastCalledWith('escape');
    open();
    fireEvent.pointerDown(root(container));
    expect(onClose).toHaveBeenLastCalledWith('outside');
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenLastCalledWith('closeButton');
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClose).toHaveBeenLastCalledWith('action');
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'action');
  });

  it('closeOnOutsidePress and closeOnEscape can be turned off; the deprecated closeOnOutside still works', () => {
    const { container, rerender } = render(<Dialog title="x" defaultOpen closeOnOutsidePress={false} closeOnEscape={false} />);
    fireEvent.pointerDown(root(container));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(root(container).hasAttribute('open')).toBe(true);
    rerender(<Dialog title="x" defaultOpen closeOnOutside={false} />);
    fireEvent.pointerDown(root(container));
    expect(root(container).hasAttribute('open')).toBe(true);
  });

  it('dismissible: false has no close button and ignores Escape and the backdrop', () => {
    const { container } = render(<Dialog title="x" defaultOpen dismissible={false} actions={[{ label: 'Done' }]} />);
    expect(container.querySelector('.pinfold-dialog__close')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent.pointerDown(root(container));
    expect(root(container).hasAttribute('open')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(root(container).hasAttribute('open')).toBe(false);
  });

  it('reflects size, placement, scroll behaviour and backdrop; dimensions reach custom properties', () => {
    const { container } = render(<Dialog title="x" defaultOpen size="full" placement="bottom" backdrop="blur" scrollBehavior="outside" dimensions={{ maxHeight: 500 }} />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('full');
    expect(el.getAttribute('data-placement')).toBe('bottom');
    expect(el.getAttribute('data-backdrop')).toBe('blur');
    // A sheet always scrolls inside.
    expect(el.getAttribute('data-scroll-behavior')).toBe('inside');
    expect(el.getAttribute('data-state')).toBe('open');
    expect(el.style.getPropertyValue('--pinfold-dialog-max-height')).toBe('500px');
    const center = render(<Dialog title="y" defaultOpen scrollBehavior="outside" />);
    expect(root(center.container).getAttribute('data-scroll-behavior')).toBe('outside');
  });

  it('initialFocus: the panel, a selector or a ref', () => {
    const { container } = render(<Dialog title="x" defaultOpen initialFocus="panel" content={<input aria-label="A" />} />);
    expect(document.activeElement).toBe(container.querySelector('.pinfold-dialog__panel'));
    render(<Dialog title="y" defaultOpen initialFocus="[name=b]" content={<><input aria-label="A2" /><input name="b" aria-label="B" /></>} />);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'B' }));
    function WithRef() {
      const ref = React.useRef<HTMLInputElement>(null);
      return <Dialog title="z" defaultOpen initialFocus={ref} content={<><input aria-label="C1" /><input ref={ref} aria-label="C2" /></>} />;
    }
    render(<WithRef />);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'C2' }));
  });

  it('an async action shows loading and closes when it resolves', async () => {
    let resolve!: () => void;
    const { container } = render(<Dialog title="x" defaultOpen actions={[{ label: 'Cancel' }, { label: 'Delete', onClick: () => new Promise<void>((r) => (resolve = r)) }]} />);
    const del = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(del);
    expect(del.getAttribute('aria-busy')).toBe('true');
    expect(root(container).hasAttribute('open')).toBe(true);
    await act(async () => resolve());
    expect(root(container).hasAttribute('open')).toBe(false);
  });

  it('nested dialogs close one at a time on Escape', () => {
    const { container } = render(<Dialog title="Outer" defaultOpen content={<Dialog title="Inner" trigger={{ label: 'More' }} />} />);
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    const dialogs = container.querySelectorAll('dialog');
    expect(dialogs[1].hasAttribute('open')).toBe(true);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(dialogs[1].hasAttribute('open')).toBe(false);
    expect(dialogs[0].hasAttribute('open')).toBe(true);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(dialogs[0].hasAttribute('open')).toBe(false);
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
  slots: ['root', 'panel', 'header', 'title', 'description', 'content', 'footer', 'actions', 'close'],
  dimension: { key: 'width', value: 400 },
  cssFile: 'packages/css/src/dialog.css',
  meta: dialogMeta,
  preset: { define: defineDialog as any, props: { title: 'x', defaultOpen: true }, probe: { key: 'size', values: ['sm', 'lg', 'xl'] } },
  hook: { use: useDialog as any, config: { title: 'x' } },
  render: (config) => <Dialog title="Settings" description="Account" content="Body" actions={[{ label: 'Save' }]} defaultOpen {...config} />,
});
