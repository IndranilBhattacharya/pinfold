import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { popoverMeta } from '@pinfold/core/meta';
import { Popover } from './Popover';
import { usePopover } from './usePopover';
import { definePopover } from './define';

afterEach(() => vi.useRealTimers());

describe('Popover', () => {
  it('opens on click, wires the trigger and moves focus into a named panel', () => {
    render(<Popover title="Share" description="Copy the link" content="Body" trigger={{ label: 'Open' }} />);
    const button = screen.getByRole('button', { name: 'Open' });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    const panel = screen.getByRole('dialog', { name: 'Share' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.activeElement).toBe(panel);
  });

  it('Escape closes and returns focus to the trigger', () => {
    render(<Popover title="Share" trigger={{ label: 'Open' }} />);
    const button = screen.getByRole('button', { name: 'Open' });
    act(() => button.focus());
    fireEvent.click(button);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('an outside press closes it, unless turned off; the trigger still toggles', () => {
    const { rerender } = render(<Popover title="Share" trigger={{ label: 'Open' }} />);
    const button = screen.getByRole('button', { name: 'Open' });
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Popover title="Share" trigger={{ label: 'Open' }} closeOnOutside={false} />);
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.pointerDown(button);
    fireEvent.click(button);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('an action closes it, unless it returns false; a promise closes when it resolves', async () => {
    let resolve!: () => void;
    const slow = () => new Promise<void>((r) => (resolve = r));
    render(<Popover title="Share" trigger={{ label: 'Open' }} actions={[{ label: 'Keep', onClick: () => false }, { label: 'Slow', onClick: slow }, { label: 'Done' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Slow' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await act(async () => resolve());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a hover card opens on hover and leaves focus alone', () => {
    vi.useFakeTimers();
    render(<Popover openOn="hover" title="Ada" delay={50} trigger={<a href="/ada">Ada</a>} />);
    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    act(() => void vi.advanceTimersByTime(50));
    expect(screen.getByRole('dialog', { name: 'Ada' })).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });

  it('does not take focus when open from the first render', () => {
    render(<Popover title="Share" defaultOpen trigger={{ label: 'Open' }} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });

  it('content can be a function of { close, isOpen }; the tag takes children too', () => {
    render(<Popover title="Pick" defaultOpen trigger={{ label: 'Open' }} content={({ close, isOpen }) => <button onClick={close}>{isOpen ? 'Apply' : 'x'}</button>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    render(<Popover title="Kids" defaultOpen>{'From children'}</Popover>);
    expect(screen.getByRole('dialog', { name: 'Kids' }).textContent).toContain('From children');
  });

  it('renders header and footer content, and a close button that reports its reason', () => {
    const onClose = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover title="T" header={<span>Badge</span>} footer={({ close }) => <a href="#x" onClick={close}>Help</a>} actions={[{ label: 'OK' }]} closeButton closeLabel="Dismiss" trigger={{ label: 'Open' }} onClose={onClose} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true, 'trigger');
    expect(container.querySelector('.pinfold-popover__header')!.textContent).toContain('Badge');
    expect(container.querySelector('.pinfold-popover__footer')!.textContent).toContain('Help');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalledWith('closeButton');
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'closeButton');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(onClose).toHaveBeenLastCalledWith('escape');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenLastCalledWith('outside');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onClose).toHaveBeenLastCalledWith('action');
  });

  it('calls onOpen, and reports reasons from the controller', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    let ctrl!: ReturnType<typeof usePopover>;
    function Host() {
      const P = usePopover({ title: 'x', onOpen, onClose, openOn: 'manual' });
      ctrl = P;
      return <P />;
    }
    render(<Host />);
    act(() => ctrl.open());
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() => ctrl.close());
    expect(onClose).toHaveBeenCalledWith('api');
  });

  it('openOn manual: the trigger is wired but does not toggle', () => {
    render(<Popover openOn="manual" title="x" trigger={{ label: 'Open' }} />);
    const button = screen.getByRole('button', { name: 'Open' });
    fireEvent.click(button);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('openOn focus: open while the trigger or the panel has focus, closed on blur out', () => {
    const onClose = vi.fn();
    render(
      <>
        <Popover openOn="focus" title="Hint" content={<button>Inside</button>} trigger={<input aria-label="Name" />} onClose={onClose} />
        <button>Elsewhere</button>
      </>,
    );
    const field = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.focus(field);
    expect(screen.getByRole('dialog', { name: 'Hint' })).toBeTruthy();
    // Focus stays on the field.
    expect(document.activeElement).not.toBe(screen.getByRole('dialog'));
    const inside = screen.getByRole('button', { name: 'Inside' });
    fireEvent.blur(field, { relatedTarget: inside });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.blur(inside, { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledWith('blur');
  });

  it('modal: aria-modal, first control focused, and Tab cycles inside', () => {
    render(<Popover modal title="Rename" content={<><input aria-label="Name" /><button>Save</button></>} trigger={{ label: 'Open' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const panel = screen.getByRole('dialog', { name: 'Rename' });
    expect(panel.getAttribute('aria-modal')).toBe('true');
    const name = screen.getByRole('textbox', { name: 'Name' });
    expect(document.activeElement).toBe(name);
    fireEvent.keyDown(name, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(name);
    fireEvent.keyDown(name, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
  });

  it('closeOnScroll closes on a page scroll, not on a scroll inside the panel', () => {
    const onClose = vi.fn();
    render(<Popover closeOnScroll title="x" content="Body" defaultOpen onClose={onClose} />);
    fireEvent.scroll(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.scroll(window);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledWith('scroll');
  });

  it('closeOnOutsidePress: false keeps it open; the deprecated closeOnOutside still works', () => {
    const { rerender } = render(<Popover title="x" defaultOpen closeOnOutsidePress={false} />);
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('dialog')).toBeTruthy();
    rerender(<Popover title="x" defaultOpen closeOnOutside={false} />);
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('nested popovers close one at a time on Escape, and an inside press closes only the inner one', () => {
    render(<Popover title="Outer" trigger={{ label: 'Outer' }} content={<Popover title="Inner" trigger={{ label: 'Inner' }} content="Deep" />} />);
    fireEvent.click(screen.getByRole('button', { name: 'Outer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inner' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Outer' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Inner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inner' }));
    fireEvent.pointerDown(screen.getByRole('dialog', { name: 'Outer' }));
    expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Outer' })).toBeTruthy();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('reflects size, state and the trigger width; dimensions reach custom properties', () => {
    render(<Popover title="x" size="lg" matchTriggerWidth dimensions={{ maxHeight: 200, maxWidth: 400 }} trigger={{ label: 'Open' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const panel = screen.getByRole('dialog');
    expect(panel.getAttribute('data-size')).toBe('lg');
    expect(panel.getAttribute('data-state')).toBe('open');
    expect(panel.hasAttribute('data-match-trigger-width')).toBe(true);
    expect(panel.style.getPropertyValue('--pinfold-overlay-anchor-width')).toMatch(/px$/);
    expect(panel.style.getPropertyValue('--pinfold-popover-max-height')).toBe('200px');
    expect(panel.style.getPropertyValue('--pinfold-popover-max-width')).toBe('400px');
  });

  it('renders no panel on the server', () => {
    const Details = definePopover({ placement: 'top' });
    const html = renderToString(<Details title="Share" defaultOpen trigger={{ label: 'Open' }} />);
    expect(html).toContain('Open');
    expect(html).not.toContain('role="dialog"');
  });
});

describePinfoldConformance({
  name: 'popover',
  inherits: [],
  variants: false,
  slots: ['root', 'header', 'title', 'description', 'content', 'footer', 'actions', 'close', 'arrow'],
  dimension: { key: 'width', value: 300 },
  cssFile: 'packages/css/src/popover.css',
  meta: popoverMeta,
  preset: { define: definePopover as any, props: { title: 'Share', defaultOpen: true }, probe: { key: 'placement', values: ['top', 'bottom', 'end'] } },
  hook: { use: usePopover as any, config: { title: 'Share', defaultOpen: true } },
  render: (config) => <Popover title="Share" description="Copy" content="Body" arrow closeButton actions={[{ label: 'Done' }]} defaultOpen trigger={{ label: 'Open' }} {...config} />,
});
