/**
 * Time zones without a library: wall times ("2026-11-09T14:30", what a clock in some place shows)
 * to and from instants (a moment, the same everywhere), through the browser's own zone data (`Intl`).
 * Daylight-saving gaps and overlaps are handled the way calendars do: a time that does not exist
 * moves forward by the gap, a time that happens twice is the first one.
 */

/** A wall time: "2026-11-09T14:30" or "2026-11-09T14:30:15". No zone: it means what the clock shows. */
export type WallTime = string;

const WALL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const formatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    formatters.set(timeZone, f);
  }
  return f;
}
const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** The zone this browser (or server) runs in, e.g. "Europe/Paris". */
export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Whether `Intl` knows a zone name. */
export function isTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    partsFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** A wall time read as if it were UTC, in ms: the arithmetic every conversion is built on. */
function wallAsUtc(wall: WallTime): number {
  const m = WALL.exec(wall);
  if (!m) return NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0));
}

/** What a clock in `timeZone` shows at an instant, as the same UTC-arithmetic number. */
function clockAt(instant: number, timeZone: string): number {
  const p: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(new Date(instant))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** Minutes a zone is ahead of UTC at an instant (India: 330; New York in winter: -300). */
export function zoneOffset(instant: number | Date, timeZone: string): number {
  const t = Math.floor((typeof instant === 'number' ? instant : instant.getTime()) / 1000) * 1000;
  return Math.round((clockAt(t, timeZone) - t) / 60000);
}

/** The instant (epoch ms) at which a clock in `timeZone` shows `wall`. NaN when `wall` is not a date. */
export function wallToInstant(wall: WallTime, timeZone: string): number {
  const local = wallAsUtc(wall);
  if (Number.isNaN(local)) return NaN;
  // Guess with the offset at that moment as if UTC, then correct with the offset at the guess.
  const first = local - zoneOffset(local, timeZone) * 60000;
  const second = local - zoneOffset(first, timeZone) * 60000;
  if (first === second) return first;
  // Around a change the two disagree: a time that happens twice takes the earlier instant; one that never happens moves forward.
  const a = Math.min(first, second);
  const b = Math.max(first, second);
  return clockAt(a, timeZone) === local ? a : b;
}

/** What a clock in `timeZone` shows at an instant: "2026-11-09T14:30" (`seconds: true` adds ":15"). */
export function instantToWall(instant: number | Date | string, timeZone: string, options: { seconds?: boolean } = {}): WallTime {
  const t = typeof instant === 'number' ? instant : typeof instant === 'string' ? Date.parse(instant) : instant.getTime();
  if (Number.isNaN(t)) return '';
  const d = new Date(clockAt(t, timeZone));
  const base = `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return options.seconds ? `${base}:${pad(d.getUTCSeconds())}` : base;
}

/** The same moment on another clock: 14:30 in Kolkata is 10:00 in Paris. */
export function convertWallTime(wall: WallTime, from: string, to: string): WallTime {
  if (from === to) return wall;
  const t = wallToInstant(wall, from);
  return Number.isNaN(t) ? wall : instantToWall(t, to, { seconds: WALL.exec(wall)?.[6] !== undefined });
}

/** A value that names its own zone: it ends in "Z" or an offset ("+05:30"). */
export function hasZone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) && value.length > 10;
}

/** "+05:30" for 330, "Z" for 0 when `z`. */
export function formatOffset(minutes: number, z = false): string {
  if (z && minutes === 0) return 'Z';
  const abs = Math.abs(minutes);
  return `${minutes < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** How a date and time are stored: what the clock shows, the instant in UTC, or the clock with its offset. */
export type DateValueFormat = 'wall' | 'utc' | 'offset';

/**
 * A wall time in `timeZone` as the value to store:
 * `'wall'` "2026-11-09T14:30" (no zone: a birthday, a shop's opening hour),
 * `'utc'` "2026-11-09T09:00:00.000Z" (an instant: what a database and an API want),
 * `'offset'` "2026-11-09T14:30:00+05:30" (the instant, and the clock that chose it).
 */
export function wallToValue(wall: WallTime, timeZone: string, format: DateValueFormat = 'wall'): string {
  if (format === 'wall' || !WALL.exec(wall)?.[4]) return wall;
  const t = wallToInstant(wall, timeZone);
  if (Number.isNaN(t)) return wall;
  if (format === 'utc') return new Date(t).toISOString();
  const m = WALL.exec(wall)!;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}${formatOffset(zoneOffset(t, timeZone))}`;
}

/** Any stored value as the wall time a clock in `timeZone` shows. A wall time or a plain day passes through. */
export function valueToWall(value: string, timeZone: string): WallTime {
  if (!value || !hasZone(value)) return value;
  return instantToWall(value, timeZone);
}

/** Every zone `Intl` knows (a short list where the browser cannot say). */
export function timeZones(): string[] {
  try {
    const all = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
    if (all && all.length) return all.includes('UTC') ? all : ['UTC', ...all];
  } catch {
    // Older engines: the list below.
  }
  return ['UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow', 'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'];
}

/** A zone for a list: "(GMT+05:30) Asia/Kolkata", the offset as it is at `at` (default now). */
export function timeZoneLabel(timeZone: string, at: number | Date = Date.now()): string {
  try {
    return `(GMT${formatOffset(zoneOffset(at, timeZone))}) ${timeZone.replace(/_/g, ' ')}`;
  } catch {
    return timeZone;
  }
}
