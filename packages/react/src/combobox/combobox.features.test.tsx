import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Combobox } from './Combobox';
import { Select } from '../select/Select';

const cities = ['Amsterdam', 'Berlin', 'Copenhagen', 'Dublin', 'Edinburgh'];

describe('Combobox: async rows, chosen rows in the list, chips under the field, long lists', () => {
  it('loadItems: waits for typing to pause, cancels stale requests, caches per query, labels survive new results', async () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const aborted: string[] = [];
    const loadItems = vi.fn((q: string, { signal }: { signal: AbortSignal }) => {
      seen.push(q);
      signal.addEventListener('abort', () => aborted.push(q));
      return Promise.resolve(cities.filter((c) => c.toLowerCase().startsWith(q.toLowerCase())).map((c) => ({ value: c.slice(0, 3).toUpperCase(), label: c })));
    });
    const onChange = vi.fn();
    render(<Combobox label="City" multiple loadItems={loadItems} debounce={200} onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'City' });
    fireEvent.change(input, { target: { value: 'b' } });
    fireEvent.change(input, { target: { value: 'be' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    // 'b' never ran: the second keystroke came first.
    expect(seen).toEqual(['be']);
    expect(screen.getByRole('option', { name: 'Berlin' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'Berlin' }));
    expect(onChange).toHaveBeenLastCalledWith(['BER'], expect.anything());
    fireEvent.change(input, { target: { value: 'd' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    // The chip keeps its label though Berlin is no longer in the results.
    expect(screen.getByText('Berlin')).toBeTruthy();
    fireEvent.change(input, { target: { value: 'be' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(seen.filter((q) => q === 'be')).toHaveLength(1); // cached
    vi.useRealTimers();
  });

  it('a failed load says so', async () => {
    render(<Combobox label="City" defaultOpen loadItems={() => Promise.reject(new Error('down'))} labels={{ error: 'Search is down' }} />);
    expect(await screen.findByText('Search is down')).toBeTruthy();
  });

  it('chosen rows: checked, disabled, or gone from the list', () => {
    const { rerender } = render(<Combobox label="Tags" multiple items={cities} defaultValue={['Berlin']} defaultOpen selectedInList="disable" />);
    expect(screen.getByRole('option', { name: 'Berlin' }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('option', { name: 'Berlin' }));
    expect(screen.getAllByText('Berlin')).toHaveLength(2); // the chip and the row: still chosen
    rerender(<Combobox label="Tags" multiple items={cities} defaultValue={['Berlin']} defaultOpen selectedInList="hide" />);
    expect(screen.queryByRole('option', { name: 'Berlin' })).toBeNull();
  });

  it('chips under the field are a tag group with real remove buttons, every chip shown', () => {
    const onChange = vi.fn();
    render(<Combobox label="Tags" multiple items={cities} defaultValue={['Amsterdam', 'Berlin', 'Copenhagen', 'Dublin']} chipsPlacement="below" onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Tags: 4' });
    expect(group.textContent).toContain('Dublin');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Copenhagen' }));
    expect(onChange).toHaveBeenLastCalledWith(['Amsterdam', 'Berlin', 'Dublin'], expect.anything());
  });

  it('a long list draws only a window of rows, with the full count for assistive tech', () => {
    const many = Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`);
    render(<Combobox label="Item" items={many} defaultOpen />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBeLessThan(80);
    expect(options[0].getAttribute('aria-setsize')).toBe('5000');
    expect(options[0].getAttribute('aria-posinset')).toBe('1');
    render(<Select label="Big" items={many} defaultOpen />);
    expect(screen.getAllByRole('option').length).toBeLessThan(160);
  });
});
