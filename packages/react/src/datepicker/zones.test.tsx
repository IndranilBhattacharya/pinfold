import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Calendar } from '../calendar/Calendar';
import { useCalendar } from '../calendar/useCalendar';
import { DatePicker } from './DatePicker';

const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLElement;

describe('Calendar: a day, a month and a year in one calendar', () => {
  it('the caption\'s month opens the months, its year the years; choosing comes back to days', () => {
    const onChange = vi.fn();
    const onMonthChange = vi.fn();
    render(<Calendar locale="en-US" defaultValue="2026-11-09" onChange={onChange} onMonthChange={onMonthChange} />);
    const root = screen.getByRole('group', { name: 'Calendar' });
    expect(root.getAttribute('data-view')).toBe('day');
    fireEvent.click(screen.getByRole('button', { name: 'November: choose a month' }));
    expect(root.getAttribute('data-view')).toBe('month');
    // The month that holds the chosen day is marked; nothing is chosen by opening a month.
    expect(day('2026-11-01').hasAttribute('data-selected')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '2026: choose a year' }));
    expect(root.getAttribute('data-view')).toBe('year');
    fireEvent.click(day('2027-01-01'));
    expect(root.getAttribute('data-view')).toBe('month');
    fireEvent.click(day('2027-03-01'));
    expect(root.getAttribute('data-view')).toBe('day');
    expect(onMonthChange).toHaveBeenLastCalledWith('2027-03-01');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(day('2027-03-14'));
    expect(onChange).toHaveBeenCalledWith('2027-03-14');
  });

  it('zoomed out, the keyboard moves by month, Enter opens, Escape goes back; months out of range cannot open', () => {
    render(<Calendar locale="en-US" defaultValue="2026-11-09" min="2026-10-15" max="2027-02-10" />);
    fireEvent.click(screen.getByRole('button', { name: 'November: choose a month' }));
    expect(day('2026-09-01').getAttribute('aria-disabled')).toBe('true');
    // October holds allowed days though its first day is before `min`.
    expect(day('2026-10-01').getAttribute('aria-disabled')).toBeNull();
    const months = document.querySelector('.pinfold-calendar__months') as HTMLElement;
    fireEvent.keyDown(months, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-12-01');
    fireEvent.keyDown(months, { key: 'Enter' });
    expect(screen.getByRole('group', { name: 'Calendar' }).getAttribute('data-view')).toBe('day');
    expect(screen.getByRole('button', { name: 'December: choose a month' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2026: choose a year' }));
    fireEvent.keyDown(months, { key: 'Escape' });
    expect(screen.getByRole('group', { name: 'Calendar' }).getAttribute('data-view')).toBe('day');
  });

  it('captionLayout label keeps plain text; granularity month never zooms closer than months', () => {
    const { unmount } = render(<Calendar locale="en-US" defaultValue="2026-11-09" captionLayout="label" />);
    expect(screen.queryByRole('button', { name: /choose a month/ })).toBeNull();
    expect(document.querySelector('.pinfold-calendar__title')!.textContent).toBe('November 2026');
    unmount();
    let api: ReturnType<typeof useCalendar> | undefined;
    function Months() {
      api = useCalendar({ granularity: 'month', defaultValue: '2026-11-01', locale: 'en-US' });
      const C = api;
      return <C />;
    }
    render(<Months />);
    expect(api!.view).toBe('month');
    React.act(() => api!.setView('day'));
    expect(api!.view).toBe('month');
    React.act(() => api!.setView('year'));
    expect(api!.view).toBe('year');
  });

  it('rules days out as data: listed days, spans and weekdays, with your own function', () => {
    render(<Calendar locale="en-US" defaultValue="2026-11-09" disabledWeekdays={[0, 6]} disabledDates={['2026-11-11', { start: '2026-11-24', end: '2026-11-26' }]} isDateDisabled={(d) => d === '2026-11-02'} />);
    for (const d of ['2026-11-07', '2026-11-08', '2026-11-11', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-02']) expect(`${d}:${day(d).getAttribute('aria-disabled')}`).toBe(`${d}:true`);
    for (const d of ['2026-11-10', '2026-11-23', '2026-11-27']) expect(`${d}:${day(d).getAttribute('aria-disabled')}`).toBe(`${d}:null`);
  });
});

describe('DatePicker: time zones and stored formats', () => {
  it('reads an instant in the chosen zone and hands back an instant', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Meeting" locale="en-US" time timeZone="Asia/Kolkata" valueFormat="utc" value="2026-11-09T09:00:00.000Z" onChange={onChange} defaultOpen />);
    expect((screen.getByRole('textbox', { name: 'Meeting' }) as HTMLInputElement).value).toMatch(/Nov 9, 2026, 2:30\sPM/);
    fireEvent.click(day('2026-11-10'));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-10T09:00:00.000Z');
    fireEvent.change(document.querySelector('input[type="time"]')!, { target: { value: '18:00' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-09T12:30:00.000Z');
  });

  it('offset format keeps the clock and its offset; a zone change keeps the moment', () => {
    const onChange = vi.fn();
    const onTimeZoneChange = vi.fn();
    render(<DatePicker label="Call" locale="en-US" time showTimeZone timeZones={['Asia/Kolkata', 'Europe/Paris']} defaultTimeZone="Asia/Kolkata" valueFormat="offset" defaultValue="2026-11-09T14:30:00+05:30" onChange={onChange} onTimeZoneChange={onTimeZoneChange} defaultOpen />);
    const zone = screen.getByRole('combobox', { name: 'Time zone' }) as HTMLSelectElement;
    expect(zone.value).toBe('Asia/Kolkata');
    expect(within(zone).getAllByRole('option').map((o) => o.textContent)).toEqual(['(GMT+05:30) Asia/Kolkata', expect.stringMatching(/^\(GMT\+0[12]:00\) Europe\/Paris$/)]);
    fireEvent.change(zone, { target: { value: 'Europe/Paris' } });
    expect(onTimeZoneChange).toHaveBeenCalledWith('Europe/Paris');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-09T10:00:00+01:00');
    expect((screen.getByRole('textbox', { name: 'Call' }) as HTMLInputElement).value).toMatch(/Nov 9, 2026, 10:00\sAM/);
  });

  it('wall format stays what the clock shows; times are held inside minTime and maxTime; a plain day is never shifted', () => {
    const onChange = vi.fn();
    const { unmount } = render(<DatePicker label="Opens" locale="en-US" time timeZone="America/New_York" defaultValue="2026-11-09T10:00" minTime="09:00" maxTime="17:00" onChange={onChange} defaultOpen />);
    fireEvent.change(document.querySelector('input[type="time"]')!, { target: { value: '20:15' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-09T17:00');
    unmount();
    render(<DatePicker label="Due" locale="en-US" timeZone="Pacific/Auckland" valueFormat="utc" defaultValue="2026-11-09" onChange={onChange} defaultOpen />);
    fireEvent.click(day('2026-11-12'));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-12');
  });
});
