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
  slots: ['root', 'title', 'description', 'content', 'actions', 'arrow'],
  dimension: { key: 'width', value: 300 },
  cssFile: 'packages/css/src/popover.css',
  meta: popoverMeta,
  preset: { define: definePopover as any, props: { title: 'Share', defaultOpen: true }, probe: { key: 'placement', values: ['top', 'bottom', 'end'] } },
  hook: { use: usePopover as any, config: { title: 'Share', defaultOpen: true } },
  render: (config) => <Popover title="Share" description="Copy" content="Body" arrow actions={[{ label: 'Done' }]} defaultOpen trigger={{ label: 'Open' }} {...config} />,
});
