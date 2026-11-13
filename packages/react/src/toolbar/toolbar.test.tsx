import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { resetWarnings } from '@pinfold/core';
import { Toolbar } from './Toolbar';
import { useToolbar } from './useToolbar';
import type { ToolbarConfig } from './types';

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnings();
});

const grouped: ToolbarConfig['items'] = [
  { label: 'Undo' },
  { label: 'Redo' },
  { type: 'separator' },
  { label: 'Bold', value: 'b' },
  { label: 'Italic', value: 'i' },
];

describe('Toolbar: groups, custom items, overflow, selected tone', () => {
  it('a separator divides groups: role separator, crossing the row; group edges are marked; arrows skip it', () => {
    const { container } = render(<Toolbar label="Editor" items={grouped} />);
    const sep = screen.getByRole('separator');
    expect(sep.getAttribute('aria-orientation')).toBe('vertical');
    expect(sep.className).toBe('pinfold-toolbar__separator');
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => [b.hasAttribute('data-group-start'), b.hasAttribute('data-group-end')])).toEqual([
      [true, false],
      [false, true],
      [true, false],
      [false, true],
    ]);
    buttons[1].focus();
    fireEvent.keyDown(buttons[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it('vertical: separators run across', () => {
    render(<Toolbar label="Side" orientation="vertical" items={grouped} />);
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('custom content: a node renders as is; a function gets the roving props and joins the arrow keys', () => {
    render(
      <Toolbar
        label="Editor"
        items={[
          { label: 'Undo' },
          { content: ({ props }) => <select {...props} aria-label="Style"><option>Body</option></select> },
          { content: <span>Saved</span> },
          { label: 'Bold' },
        ]}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Style' });
    expect(select.tabIndex).toBe(-1);
    expect(screen.getByText('Saved').parentElement!.className).toBe('pinfold-toolbar__custom');
    const [undo, bold] = screen.getAllByRole('button');
    undo.focus();
    fireEvent.keyDown(undo, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(select);
    expect(select.tabIndex).toBe(0);
    // Inside a select the arrow keys stay with the control.
    fireEvent.keyDown(select, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(select);
    bold.focus();
    fireEvent.keyDown(bold, { key: 'Home' });
    expect(document.activeElement).toBe(undo);
  });

  it('a pressed button takes selectedTone (primary by default); an item tone wins', () => {
    const { rerender } = render(<Toolbar label="Format" selection="multiple" defaultValue={['b']} items={grouped} />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold.getAttribute('data-tone')).toBe('primary');
    expect(screen.getByRole('button', { name: 'Italic' }).getAttribute('data-tone')).toBe('neutral');
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(screen.getByRole('button', { name: 'Italic' }).getAttribute('data-tone')).toBe('primary');
    rerender(<Toolbar label="Format" selection="multiple" selectedTone="success" defaultValue={['b']} items={[{ label: 'Bold', value: 'b' }, { label: 'Strike', value: 's', tone: 'danger' }]} />);
    expect(screen.getByRole('button', { name: 'Bold' }).getAttribute('data-tone')).toBe('success');
    fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    expect(screen.getByRole('button', { name: 'Strike' }).getAttribute('data-tone')).toBe('danger');
  });

  it('overflow: wrap by default; scroll watches the edges and cleans up on unmount', () => {
    const { rerender, unmount } = render(<Toolbar label="Editor" items={grouped} />);
    const bar = screen.getByRole('toolbar');
    expect(bar.getAttribute('data-overflow')).toBe('wrap');
    rerender(<Toolbar label="Editor" items={grouped} overflow="scroll" />);
    expect(bar.getAttribute('data-overflow')).toBe('scroll');
    // jsdom has no layout: nothing is hidden, so no edge is marked.
    expect(bar.hasAttribute('data-overflow-end')).toBe(false);
    Object.defineProperty(bar, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(bar, 'clientWidth', { value: 200, configurable: true });
    act(() => {
      bar.dispatchEvent(new Event('scroll'));
    });
    return vi.waitFor(() => expect(bar.hasAttribute('data-overflow-end')).toBe(true)).then(() => {
      const remove = vi.spyOn(bar, 'removeEventListener');
      unmount();
      expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  it('the controller focuses the tab stop', () => {
    let api!: ReturnType<typeof useToolbar>;
    function Hook() {
      const T = useToolbar({ label: 'Editor', items: [{ type: 'separator' }, { label: 'Undo' }, { label: 'Redo' }] });
      api = T;
      return <T />;
    }
    render(<Hook />);
    act(() => api.focus());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Undo' }));
  });

  it('warns about a button item without a label and about selectedTone without selection', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Toolbar label="Editor" selectedTone="success" items={[{ icon: <svg /> } as never]} />);
    await vi.waitFor(() => {
      const text = warn.mock.calls.map((c) => String(c[0])).join('\n');
      expect(text).toContain('every button item needs a `label`');
      expect(text).toContain('`selectedTone` has no visible effect');
    });
  });
});
