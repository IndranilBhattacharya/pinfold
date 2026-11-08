import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { calendarMeta } from '@pinfold/core/meta';
import { Calendar } from './Calendar';
import { useCalendar } from './useCalendar';
import { defineCalendar } from './define';

const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const key = (k: string, extra: object = {}) => fireEvent.keyDown(document.activeElement!, { key: k, ...extra });

describe('Calendar', () => {
  it('a named group with a grid per month; days are buttons named by their full date; one tab stop', () => {
    render(<Calendar locale="en-GB" defaultValue="2026-11-08" />);
    screen.getByRole('group', { name: 'Calendar' });
    const grid = screen.getByRole('grid');
    expect(document.getElementById(grid.getAttribute('aria-labelledby')!)!.textContent).toBe('November 2026');
    const chosen = day('2026-11-08');
    expect(chosen.getAttribute('aria-label')).toMatch(/Sunday,? 8 November 2026/);
    expect(chosen.tabIndex).toBe(0);
    expect(chosen.closest('td')!.getAttribute('aria-selected')).toBe('true');
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    // en-GB weeks start on Monday.
    expect(screen.getAllByRole('columnheader')[0].getAttribute('abbr')).toBe('Monday');
  });

  it('keys move the focused day and turn the month; Enter chooses', () => {
    const onChange = vi.fn();
    const onMonthChange = vi.fn();
    render(<Calendar locale="en-US" defaultValue="2026-11-30" onChange={onChange} onMonthChange={onMonthChange} />);
    day('2026-11-30').focus();
    key('ArrowRight');
    expect(onMonthChange).toHaveBeenCalledWith('2026-12-01');
    expect(document.activeElement!.getAttribute('data-date')).toBe('2026-12-01');
    key('PageDown', { shiftKey: true });
    expect(document.activeElement!.getAttribute('data-date')).toBe('2027-12-01');
    key('Enter');
    expect(onChange).toHaveBeenCalledWith('2027-12-01');
  });

  it('min, max and disabled days: never chosen, still focusable; the month buttons stop', () => {
    const onChange = vi.fn();
    render(<Calendar locale="en-GB" defaultMonth="2026-11-01" min="2026-11-05" max="2026-11-20" isDateDisabled={(d) => d === '2026-11-10'} onChange={onChange} />);
    const tenth = day('2026-11-10');
    expect(tenth.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(tenth);
    fireEvent.click(day('2026-11-02'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Previous month' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Next month' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('range: two picks in any order make an ordered range; the days between are marked', () => {
    const onChange = vi.fn();
    const { container } = render(<Calendar mode="range" locale="en-GB" defaultMonth="2026-11-01" onChange={onChange} />);
    fireEvent.click(day('2026-11-13'));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(day('2026-11-09'));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-09', end: '2026-11-13' });
    expect(container.querySelectorAll('[data-in-range]')).toHaveLength(3);
    expect(container.querySelector('[data-range-start]')!.getAttribute('data-date')).toBe('2026-11-09');
  });

  it('multiple and two months; the server renders without "today"', () => {
    const onChange = vi.fn();
    render(<Calendar mode="multiple" months={2} locale="en-GB" defaultMonth="2026-11-01" defaultValue={['2026-11-02']} onChange={onChange} />);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    fireEvent.click(day('2026-12-01'));
    expect(onChange).toHaveBeenLastCalledWith(['2026-11-02', '2026-12-01']);
    const Picker = defineCalendar({ showToday: true });
    const html = renderToString(<Picker locale="en-GB" defaultValue="2026-11-08" />);
    expect(html).toContain('November 2026');
    expect(html).not.toContain('aria-current');
  });
});

describePinfoldConformance({
  name: 'calendar',
  variants: false,
  slots: ['root', 'header', 'title', 'previous', 'next', 'months', 'grid', 'weekday', 'day'],
  optionalSlots: ['footer', 'today'],
  cssFile: 'packages/css/src/calendar.css',
  meta: calendarMeta,
  preset: { define: defineCalendar as any, props: { defaultValue: '2026-11-08' } },
  hook: { use: useCalendar as any, config: { defaultValue: '2026-11-08' } },
  render: (config) => <Calendar defaultValue="2026-11-08" {...config} />,
});
