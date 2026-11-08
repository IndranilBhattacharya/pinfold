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

/** Options with no visible effect in the current config. */
export function inactiveCalendarOptions(config: { months?: number }): Record<string, string> {
  // Side by side, a month's outside days would repeat its neighbour's: they are never shown.
  return (config.months ?? 1) > 1 ? { showOutsideDays: 'months side by side never repeat their neighbours’ days.' } : {};
}

/** Every date picker option shows (the popup's calendar hides its own outside days when several months show). */
export function inactiveDatePickerOptions(_config: object): Record<string, string> {
  return {};
}
