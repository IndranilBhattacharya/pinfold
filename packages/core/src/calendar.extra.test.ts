// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inactiveCalendarOptions, inactiveDatePickerOptions, isoWeek, parseTime, presetRange, rangeDays, rangeEndRule, splitDateTime, yearMonths, yearPage } from './calendar.logic';

describe('calendar: weeks, presets, range rules, times', () => {
  it('ISO week numbers across year edges', () => {
    expect(isoWeek('2026-01-01')).toBe(1); // a Thursday
    expect(isoWeek('2027-01-01')).toBe(53); // a Friday: still week 53 of 2026
    expect(isoWeek('2024-12-30')).toBe(1); // a Monday in 2025's week 1
    expect(isoWeek('2026-11-09')).toBe(46);
  });

  it('presets count from today and the week start', () => {
    expect(presetRange('last7', '2026-11-09')).toEqual({ start: '2026-11-03', end: '2026-11-09' });
    expect(presetRange('thisMonth', '2026-11-09')).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(presetRange('lastMonth', '2026-03-15')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(presetRange('thisWeek', '2026-11-11', 1)).toEqual({ start: '2026-11-09', end: '2026-11-15' });
    expect(presetRange('thisWeek', '2026-11-11', 0)).toEqual({ start: '2026-11-08', end: '2026-11-14' });
    expect(presetRange('lastYear', '2026-11-09')).toEqual({ start: '2025-01-01', end: '2025-12-31' });
  });

  it('a range end respects min and max days and never jumps a blocked day', () => {
    expect(rangeDays('2026-11-09', '2026-11-09')).toBe(1);
    expect(rangeDays('2026-11-09', '2026-11-15')).toBe(7);
    const booked = new Set(['2026-11-14']);
    const end = rangeEndRule('2026-11-10', { minDays: 3, maxDays: 10, allowed: (d) => !booked.has(d) });
    expect(end('2026-11-11')).toBe(false); // 2 days
    expect(end('2026-11-12')).toBe(true);
    expect(end('2026-11-13')).toBe(true);
    expect(end('2026-11-15')).toBe(false); // past the booked night
    expect(end('2026-11-07')).toBe(true); // backwards, 4 days
    const spanning = rangeEndRule('2026-11-10', { allowed: (d) => !booked.has(d), spanDisabled: true });
    expect(spanning('2026-11-20')).toBe(true);
  });

  it('typed times in 24 and 12 hours', () => {
    expect(parseTime('14:30')).toBe('14:30');
    expect(parseTime('2:30 pm')).toBe('14:30');
    expect(parseTime('12am')).toBe('00:00');
    expect(parseTime('9:05:30')).toBe('09:05:30');
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('13 pm')).toBeNull();
    expect(splitDateTime('2026-11-09T14:30')).toEqual({ date: '2026-11-09', time: '14:30' });
    expect(splitDateTime('2026-11-09')).toEqual({ date: '2026-11-09', time: '' });
  });

  it('month and year pages; options that show nothing are named', () => {
    expect(yearMonths(2026)[10]).toBe('2026-11-01');
    expect(yearPage(2026)).toEqual([2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]);
    expect(Object.keys(inactiveCalendarOptions({ mode: 'single' }))).toEqual(['minDays', 'maxDays', 'allowDisabledInRange']);
    expect(inactiveCalendarOptions({ mode: 'range', granularity: 'month' }).showWeekNumbers).toBeDefined();
    expect(inactiveDatePickerOptions({ mode: 'range', granularity: 'year', time: true }).time).toBeDefined();
    expect(inactiveDatePickerOptions({ mode: 'range' }).hourCycle).toBeDefined();
  });
});
