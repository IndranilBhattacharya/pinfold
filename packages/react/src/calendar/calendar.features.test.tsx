import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Calendar } from './Calendar';
import { DatePicker } from '../datepicker/DatePicker';

const cell = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe('Calendar: jumping, months and years, presets, range rules', () => {
  it('month and year dropdowns turn the page', () => {
    const onMonthChange = vi.fn();
    render(<Calendar locale="en-GB" defaultMonth="2026-11-01" captionLayout="dropdown" yearRange={[2020, 2030]} onMonthChange={onMonthChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Year' }), { target: { value: '2028' } });
    expect(onMonthChange).toHaveBeenLastCalledWith('2028-11-01');
    fireEvent.change(screen.getByRole('combobox', { name: 'Month' }), { target: { value: '2028-02-01' } });
    expect(onMonthChange).toHaveBeenLastCalledWith('2028-02-01');
    expect(cell('2028-02-29')).toBeTruthy();
  });

  it('granularity month picks a month (its first day); arrows move three to a row', () => {
    const onChange = vi.fn();
    render(<Calendar locale="en-GB" granularity="month" defaultValue="2026-11-20" onChange={onChange} />);
    expect(cell('2026-11-01').getAttribute('data-selected')).toBe('');
    fireEvent.click(cell('2026-03-01'));
    expect(onChange).toHaveBeenLastCalledWith('2026-03-01');
    fireEvent.keyDown(cell('2026-03-01'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cell('2026-06-01'));
    fireEvent.click(screen.getByRole('button', { name: 'Next year' }));
    expect(cell('2027-01-01')).toBeTruthy();
  });

  it('granularity year picks a year from a page of twelve', () => {
    const onChange = vi.fn();
    render(<Calendar granularity="year" defaultValue="2026-05-05" onChange={onChange} />);
    fireEvent.click(cell('2019-01-01'));
    expect(onChange).toHaveBeenLastCalledWith('2019-01-01');
  });

  it('a range ends within minDays..maxDays and never across a booked night; the start is reported', () => {
    const onChange = vi.fn();
    const onRangeStart = vi.fn();
    const booked = new Set(['2026-11-14']);
    render(<Calendar mode="range" defaultMonth="2026-11-01" minDays={3} maxDays={10} isDateDisabled={(d) => booked.has(d)} onRangeStart={onRangeStart} onChange={onChange} />);
    fireEvent.click(cell('2026-11-10'));
    expect(onRangeStart).toHaveBeenCalledWith('2026-11-10');
    expect(cell('2026-11-11').getAttribute('aria-disabled')).toBe('true');
    expect(cell('2026-11-16').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(cell('2026-11-11'));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(cell('2026-11-13'));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-11-10', end: '2026-11-13' });
  });

  it('isDateDisabled knows the start of a range being picked', () => {
    const seen: Array<string | null> = [];
    render(<Calendar mode="range" defaultMonth="2026-11-01" isDateDisabled={(_d, c) => (seen.push(c.start), false)} />);
    fireEvent.click(cell('2026-11-10'));
    expect(seen.at(-1)).toBe('2026-11-10');
  });

  it('presets set the value and mark the one in use; week numbers and day content show', () => {
    const onChange = vi.fn();
    render(
      <Calendar
        mode="range"
        defaultMonth="2026-11-01"
        presets={[{ label: 'Black Friday week', value: { start: '2026-11-23', end: '2026-11-29' } }]}
        showWeekNumbers
        dayContent={(d) => (d === '2026-11-20' ? '$120' : null)}
        onChange={onChange}
      />,
    );
    const preset = screen.getByRole('button', { name: 'Black Friday week' });
    fireEvent.click(preset);
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-11-23', end: '2026-11-29' });
    expect(preset.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('columnheader', { name: 'Wk' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: '46' })).toBeTruthy();
    expect(cell('2026-11-20').textContent).toBe('20$120');
  });
});

describe('DatePicker: time, months, presets', () => {
  it('a day with a time: picking keeps the time, the time field sets it, typed text with a time parses', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Meeting" locale="en-GB" time hourCycle={24} defaultValue="2026-11-09T09:30" defaultOpen onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Meeting' }) as HTMLInputElement;
    expect(input.value).toBe('9 Nov 2026, 09:30');
    fireEvent.click(cell('2026-11-12'));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-12T09:30');
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '15:45' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-12T15:45');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.change(input, { target: { value: '24/12/2026 18:00' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('2026-12-24T18:00');
  });

  it('a month field shows and types months', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Billing month" locale="en-GB" granularity="month" defaultValue="2026-11-01" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Billing month' }) as HTMLInputElement;
    expect(input.value).toBe('November 2026');
    fireEvent.change(input, { target: { value: 'feb 2027' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('2027-02-01');
    fireEvent.change(input, { target: { value: '03/2027' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('2027-03-01');
  });

  it('a range with presets in the popup', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Stay" mode="range" defaultOpen presets={[{ label: 'Long weekend', value: { start: '2026-11-20', end: '2026-11-23' } }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Long weekend' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-11-20', end: '2026-11-23' });
  });
});
