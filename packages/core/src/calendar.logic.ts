/**
 * Calendar rules, framework-free. Dates are ISO strings ("2026-11-08"): plain data that survives
 * JSON, server rendering and time zones, compared as strings. Math runs on UTC so a day is a day.
 */

export type IsoDate = string;

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** "2026-11-08" from a year, month (1-12) and day; out-of-range parts roll over. */
export function isoDate(year: number, month: number, day: number): IsoDate {
  const d = new Date(Date.UTC(year, month - 1, day));
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** The parts of an ISO date, or null when it is not one (or not a real day: "2026-02-30"). */
export function parseIso(value: string | null | undefined): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return isoDate(year, month, day) === value ? { year, month, day } : null;
}

/** Today in the given time zone (the device's without one), as an ISO date. */
export function todayIso(timeZone?: string, now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return isoDate(get('year'), get('month'), get('day'));
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const p = parseIso(date)!;
  return isoDate(p.year, p.month, p.day + days);
}

/** The same day `months` later, kept inside the month: Jan 31 + 1 month is Feb 28 (or 29). */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const p = parseIso(date)!;
  const first = isoDate(p.year, p.month + months, 1);
  const f = parseIso(first)!;
  return isoDate(f.year, f.month, Math.min(p.day, daysInMonth(f.year, f.month)));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: IsoDate): number {
  const p = parseIso(date)!;
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

/** The first of the month a date is in. */
export function monthStart(date: IsoDate): IsoDate {
  const p = parseIso(date)!;
  return isoDate(p.year, p.month, 1);
}

/**
 * The days of a month view: six weeks of seven, starting on `weekStart` (0 Sunday … 6 Saturday).
 * Always six rows, so the grid never jumps in height between months.
 */
export function monthGrid(month: IsoDate, weekStart = 1): IsoDate[][] {
  const first = monthStart(month);
  const lead = (weekday(first) - weekStart + 7) % 7;
  const start = addDays(first, -lead);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}

/** Monday-first regions are the default; these start on Sunday or Saturday (CLDR). */
const SUNDAY = new Set(['AG', 'AS', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CN', 'CO', 'DM', 'DO', 'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'JM', 'JP', 'KE', 'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA', 'PE', 'PH', 'PK', 'PR', 'PT', 'PY', 'SA', 'SG', 'SV', 'TH', 'TT', 'TW', 'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW']);
const SATURDAY = new Set(['AE', 'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY']);

/** The first day of the week for a locale (0 Sunday … 6 Saturday), from Intl where it says, else CLDR regions. */
export function localeWeekStart(locale?: string): number {
  try {
    const loc = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
    const region = loc.maximize().region ?? '';
    return SUNDAY.has(region) ? 0 : SATURDAY.has(region) ? 6 : 1;
  } catch {
    return 1;
  }
}

/** Whether a day can be chosen: inside `min`..`max` and not ruled out. */
export function dateAllowed(date: IsoDate, min?: IsoDate, max?: IsoDate, disabled?: (date: IsoDate) => boolean): boolean {
  if (min && date < min) return false;
  if (max && date > max) return false;
  return !disabled?.(date);
}

/** A range from two picks, in order. */
/** A day ruled out by data: a listed day, a listed span, or its weekday (0 Sunday … 6 Saturday). */
export function dateBlocked(date: IsoDate, dates?: ReadonlyArray<IsoDate | { start: IsoDate; end: IsoDate }>, weekdays?: readonly number[]): boolean {
  if (weekdays && weekdays.length && weekdays.includes(weekday(date))) return true;
  if (!dates) return false;
  for (const d of dates) if (typeof d === 'string' ? d === date : date >= d.start && date <= d.end) return true;
  return false;
}

export function orderRange(a: IsoDate, b: IsoDate): { start: IsoDate; end: IsoDate } {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/** Where a key moves the focused day, or null when the key is not ours. Left and right follow the reading direction. */
export function calendarKeyTarget(date: IsoDate, key: string, opts: { shift?: boolean; rtl?: boolean; weekStart?: number } = {}): IsoDate | null {
  const sign = opts.rtl ? -1 : 1;
  switch (key) {
    case 'ArrowRight':
      return addDays(date, sign);
    case 'ArrowLeft':
      return addDays(date, -sign);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'PageDown':
      return addMonths(date, opts.shift ? 12 : 1);
    case 'PageUp':
      return addMonths(date, opts.shift ? -12 : -1);
    case 'Home':
      return addDays(date, -((weekday(date) - (opts.weekStart ?? 1) + 7) % 7));
    case 'End':
      return addDays(date, 6 - ((weekday(date) - (opts.weekStart ?? 1) + 7) % 7));
    default:
      return null;
  }
}

/**
 * Read a typed date in the locale's numeric order ("8/11/2026" in en-GB, "11/8/2026" in en-US,
 * "2026-11-08" anywhere). Two-digit years are 2000s. Null when it is not a real day.
 */
export function parseTypedDate(text: string, locale?: string): IsoDate | null {
  const t = text.trim();
  if (parseIso(t)) return t;
  const nums = t.split(/[^\d]+/).filter(Boolean).map(Number);
  if (nums.length !== 3) return null;
  const order = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date(Date.UTC(2026, 10, 22)))
    .map((p) => p.type)
    .filter((type) => type === 'year' || type === 'month' || type === 'day');
  const at = (type: string) => nums[order.indexOf(type as 'year')];
  let year = at('year');
  if (year < 100) year += 2000;
  const iso = isoDate(year, at('month'), at('day'));
  return parseIso(iso) && iso.endsWith(`-${pad(at('month'))}-${pad(at('day'))}`) ? iso : null;
}

/** ISO 8601 week number: weeks start on Monday, week 1 holds the year's first Thursday. */
export function isoWeek(date: IsoDate): number {
  const p = parseIso(date)!;
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // the Thursday of this week
  return Math.ceil(((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
}

/** Named spans a range picker offers in one word. */
export type CalendarPresetName = 'today' | 'yesterday' | 'last7' | 'last30' | 'last90' | 'next7' | 'next30' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

/** The span a preset name stands for, counted from `today`. */
export function presetRange(name: CalendarPresetName, today: IsoDate, weekStart = 1): { start: IsoDate; end: IsoDate } {
  const p = parseIso(today)!;
  const weekFirst = addDays(today, -((weekday(today) - weekStart + 7) % 7));
  switch (name) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday':
      return { start: addDays(today, -1), end: addDays(today, -1) };
    case 'last7':
      return { start: addDays(today, -6), end: today };
    case 'last30':
      return { start: addDays(today, -29), end: today };
    case 'last90':
      return { start: addDays(today, -89), end: today };
    case 'next7':
      return { start: today, end: addDays(today, 6) };
    case 'next30':
      return { start: today, end: addDays(today, 29) };
    case 'thisWeek':
      return { start: weekFirst, end: addDays(weekFirst, 6) };
    case 'lastWeek':
      return { start: addDays(weekFirst, -7), end: addDays(weekFirst, -1) };
    case 'thisMonth':
      return { start: monthStart(today), end: addDays(addMonths(monthStart(today), 1), -1) };
    case 'lastMonth':
      return { start: addMonths(monthStart(today), -1), end: addDays(monthStart(today), -1) };
    case 'thisYear':
      return { start: isoDate(p.year, 1, 1), end: isoDate(p.year, 12, 31) };
    default:
      return { start: isoDate(p.year - 1, 1, 1), end: isoDate(p.year - 1, 12, 31) };
  }
}

/** English labels for the preset names (pass your own `label` to translate). */
export const PRESET_LABELS: Record<CalendarPresetName, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  last90: 'Last 90 days',
  next7: 'Next 7 days',
  next30: 'Next 30 days',
  thisWeek: 'This week',
  lastWeek: 'Last week',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisYear: 'This year',
  lastYear: 'Last year',
};

/** Days a range covers, both ends included. */
export function rangeDays(start: IsoDate, end: IsoDate): number {
  const a = parseIso(start)!;
  const b = parseIso(end)!;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000) + 1;
}

/**
 * Where a range that starts on `start` may end: within `minDays`..`maxDays`, and (unless disabled days
 * may sit inside a range) not past the nearest day that cannot be chosen. Returns a test for the end.
 */
export function rangeEndRule(start: IsoDate, opts: { minDays?: number; maxDays?: number; allowed: (d: IsoDate) => boolean; spanDisabled?: boolean }): (end: IsoDate) => boolean {
  const limit = opts.maxDays ?? 731;
  let lo = '';
  let hi = '￿';
  if (!opts.spanDisabled) {
    for (let i = 1; i < limit; i++) {
      const d = addDays(start, -i);
      if (!opts.allowed(d)) {
        lo = d;
        break;
      }
    }
    for (let i = 1; i < limit; i++) {
      const d = addDays(start, i);
      if (!opts.allowed(d)) {
        hi = d;
        break;
      }
    }
  }
  return (end) => {
    if (end <= lo || end >= hi) return false;
    const n = rangeDays(end < start ? end : start, end < start ? start : end);
    return n >= (opts.minDays ?? 1) && (opts.maxDays === undefined || n <= opts.maxDays);
  };
}

const TIME = /^\s*(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([ap])\.?\s*m?\.?\s*$/i;
const TIME24 = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/;
/** A typed time ("14:30", "2:30 pm", "2pm", "9:05:30") as "HH:mm" or "HH:mm:ss". Null when it is not one. */
export function parseTime(text: string): string | null {
  const m = TIME24.exec(text) ?? TIME.exec(text);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const sec = m[3] === undefined ? undefined : Number(m[3]);
  const half = m[4]?.toLowerCase();
  if (half) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (half === 'p' ? 12 : 0);
  }
  if (h > 23 || min > 59 || (sec !== undefined && sec > 59)) return null;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(h)}:${two(min)}${sec === undefined ? '' : ':' + two(sec)}`;
}

/** Split "2026-11-09T14:30" into its day and time ("" when there is none). */
export function splitDateTime(value: string): { date: IsoDate; time: string } {
  const [date, time = ''] = value.split('T');
  return { date, time: time.slice(0, 8) };
}

/** The months of a year (their first days) and the twelve years of the page holding `year`. */
export function yearMonths(year: number): IsoDate[] {
  return Array.from({ length: 12 }, (_, i) => isoDate(year, i + 1, 1));
}
export function yearPage(year: number): number[] {
  const first = year - (((year % 12) + 12) % 12);
  return Array.from({ length: 12 }, (_, i) => first + i);
}

interface CalendarRules {
  mode?: string;
  months?: number;
  granularity?: string;
  presets?: readonly unknown[];
}

/** Options with no visible effect in the current config (calendar). */
export function inactiveCalendarOptions(config: CalendarRules): Record<string, string> {
  const out: Record<string, string> = {};
  const days = (config.granularity ?? 'day') === 'day';
  // Side by side, a month's outside days would repeat its neighbour's: they are never shown.
  if ((config.months ?? 1) > 1) out.showOutsideDays = 'months side by side never repeat their neighbours’ days.';
  if (!days) {
    const why = "only for picking days (`granularity: 'day'`).";
    Object.assign(out, { showOutsideDays: why, showWeekNumbers: why, dayContent: why, months: why, weekStart: why });
  }
  if (config.mode !== 'range') {
    const why = "only for a range (`mode: 'range'`).";
    Object.assign(out, { minDays: why, maxDays: why, allowDisabledInRange: why });
  }
  return out;
}

/** Options with no visible effect in the current config (date picker). */
export function inactiveDatePickerOptions(config: CalendarRules & { time?: unknown }): Record<string, string> {
  const out = inactiveCalendarOptions(config);
  delete out.weekStart;
  if ((config.granularity ?? 'day') !== 'day') out.time = "a time goes with a day (`granularity: 'day'`).";
  if (!config.time) {
    const why = 'only with `time`.';
    Object.assign(out, { hourCycle: why, timeStep: why, minTime: why, maxTime: why, timeZone: why, defaultTimeZone: why, onTimeZoneChange: why, showTimeZone: why, timeZones: why, valueFormat: why });
  } else if (!(config as { showTimeZone?: boolean }).showTimeZone) {
    const why = 'only with `showTimeZone`.';
    Object.assign(out, { timeZones: why, defaultTimeZone: why, onTimeZoneChange: why });
  }
  return out;
}
