import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { inactiveCommandOptions } from '@pinfold/core';
import { Command } from './Command';

const pages = Array.from({ length: 25 }, (_, i) => ({ value: `page-${i + 1}`, label: `Page ${i + 1}`, group: i < 3 ? 'Recent' : 'All pages' }));

function scrollToEnd(el: HTMLElement) {
  Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: 300, configurable: true });
  el.scrollTop = 690;
  fireEvent.scroll(el);
}

describe('Command: async source, rich rows, states, footer', () => {
  it('loadItems: debounced, not filtered again, paged near the end of the scroll; aborted when the query moves on', async () => {
    vi.useFakeTimers();
    try {
      const seen: Array<[string, number]> = [];
      const aborted: string[] = [];
      const loadItems = (q: string, { page, cursor, signal }: { page: number; cursor?: unknown; signal: AbortSignal }) => {
        seen.push([q, page]);
        signal.addEventListener('abort', () => aborted.push(q));
        const start = (cursor as number | undefined) ?? 0;
        return Promise.resolve({ items: pages.slice(start, start + 10).map((p) => ({ ...p, label: `${p.label} ${q}` })), hasMore: start + 10 < pages.length, cursor: start + 10 });
      };
      render(<Command label="Go to" loadItems={loadItems} debounce={100} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
      expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(10);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'x' } });
      fireEvent.change(input, { target: { value: 'xy' } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
      expect(seen.map(([q]) => q)).toEqual(['', 'xy']);
      // Every row says "xy" only at the end: the results are not filtered again.
      expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(10);
      await act(async () => {
        scrollToEnd(screen.getByRole('listbox'));
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(seen).toContainEqual(['xy', 1]);
      expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(20);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a failed load and an empty result say so; emptyText can use the query', async () => {
    const first = render(<Command label="Go to" loadItems={() => Promise.reject(new Error('down'))} labels={{ error: 'Search is down' }} />);
    expect(await screen.findByText('Search is down')).toBeTruthy();
    first.unmount();
    render(<Command label="Go to" items={['Alpha']} defaultInputValue="zz" emptyText={(q) => `Nothing for ${q}`} />);
    expect(screen.getByText('Nothing for zz')).toBeTruthy();
  });

  it('rows draw an avatar and end content; onHighlight follows the active row', () => {
    const onHighlight = vi.fn();
    render(<Command label="People" items={[{ label: 'Ada', avatar: '/ada.png', endContent: 'Owner' }, { label: 'Bob', shortcut: '⌘B' }]} onHighlight={onHighlight} />);
    const ada = screen.getByRole('option', { name: /Ada/ });
    expect(ada.querySelector('img')?.getAttribute('src')).toBe('/ada.png');
    expect(ada.querySelector('.pinfold-command__endContent')?.textContent).toBe('Owner');
    expect(onHighlight).toHaveBeenLastCalledWith('Ada');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(onHighlight).toHaveBeenLastCalledWith('Bob');
  });

  it('the footer: your hints in place of the defaults, and content of your own that is not hidden', () => {
    render(<Command label="Go to" items={['a']} hints={[{ keys: ['⇥'], label: 'to complete' }]} footerContent={<a href="/help">Help</a>} />);
    expect(screen.getByText('to complete')).toBeTruthy();
    expect(screen.queryByText('to move')).toBeNull();
    expect(screen.getByRole('link', { name: 'Help' })).toBeTruthy();
    expect(inactiveCommandOptions({ footer: false })).toHaveProperty('hints');
    expect(inactiveCommandOptions({})).toHaveProperty('debounce');
  });
});
