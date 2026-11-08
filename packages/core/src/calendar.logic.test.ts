// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { addDays, addMonths, calendarKeyTarget, dateAllowed, daysInMonth, isoDate, localeWeekStart, monthGrid, orderRange, parseIso, parseTypedDate, todayIso, weekday } from './calendar.logic';

describe('calendar logic', () => {
  it('ISO dates: build, parse (real days only), roll over', () => {
    expect(isoDate(2026, 11, 8)).toBe('2026-11-08');
    expect(isoDate(2026, 12, 32)).toBe('2027-01-01');
    expect(parseIso('2026-02-29')).toBeNull();
    expect(parseIso('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseIso('8/11/2026')).toBeNull();
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(weekday('2026-11-08')).toBe(0);
  });

  it('adds days and months; a month later stays inside the month', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-15', -14)).toBe('2025-01-15');
  });

  it('a month grid is six weeks from the week start, always', () => {
    const mon = monthGrid('2026-11-08', 1);
    expect(mon).toHaveLength(6);
    expect(mon[0][0]).toBe('2026-10-26');
    expect(mon[0][6]).toBe('2026-11-01');
    const sun = monthGrid('2026-11-08', 0);
    expect(sun[0][0]).toBe('2026-11-01');
    expect(monthGrid('2026-02-01', 0).flat()).toHaveLength(42);
  });

  it('the week starts where the locale says', () => {
    expect(localeWeekStart('en-US')).toBe(0);
    expect(localeWeekStart('en-GB')).toBe(1);
    expect(localeWeekStart('fr-FR')).toBe(1);
    expect(localeWeekStart('ar-EG')).toBe(6);
  });

  it('allowed days, ranges in order, keys', () => {
    expect(dateAllowed('2026-11-08', '2026-11-01', '2026-11-30')).toBe(true);
    expect(dateAllowed('2026-12-01', undefined, '2026-11-30')).toBe(false);
    expect(dateAllowed('2026-11-08', undefined, undefined, (d) => weekday(d) === 0)).toBe(false);
    expect(orderRange('2026-11-09', '2026-11-02')).toEqual({ start: '2026-11-02', end: '2026-11-09' });
    expect(calendarKeyTarget('2026-11-08', 'ArrowRight')).toBe('2026-11-09');
    expect(calendarKeyTarget('2026-11-08', 'ArrowRight', { rtl: true })).toBe('2026-11-07');
    expect(calendarKeyTarget('2026-11-08', 'PageDown', { shift: true })).toBe('2027-11-08');
    expect(calendarKeyTarget('2026-11-11', 'Home', { weekStart: 1 })).toBe('2026-11-09');
    expect(calendarKeyTarget('2026-11-11', 'End', { weekStart: 1 })).toBe('2026-11-15');
    expect(calendarKeyTarget('2026-11-11', 'Enter')).toBeNull();
  });

  it('reads typed dates in the locale order; today in a time zone', () => {
    expect(parseTypedDate('8/11/2026', 'en-GB')).toBe('2026-11-08');
    expect(parseTypedDate('11/8/2026', 'en-US')).toBe('2026-11-08');
    expect(parseTypedDate('2026-11-08', 'de-DE')).toBe('2026-11-08');
    expect(parseTypedDate('8.11.26', 'de-DE')).toBe('2026-11-08');
    expect(parseTypedDate('31/2/2026', 'en-GB')).toBeNull();
    expect(parseTypedDate('soon', 'en-GB')).toBeNull();
    expect(todayIso('UTC', new Date(Date.UTC(2026, 10, 8, 23, 30)))).toBe('2026-11-08');
    expect(todayIso('Asia/Tokyo', new Date(Date.UTC(2026, 10, 8, 23, 30)))).toBe('2026-11-09');
  });
});
