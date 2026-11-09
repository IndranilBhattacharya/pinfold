/**
 * Data grid engine, framework-free: values by path, typed filters, multi-key sorting, grouping and
 * totals, all over row indices (the rows are never copied); a virtual window that keeps a billion
 * rows scrollable; column widths and pinned offsets; CSV.
 *
 * Built for size: filtering is one pass, sorting turns each key into numbers once (text becomes its
 * rank among the distinct values, so the comparison is numeric) and sorts an index array.
 */
import { foldText } from './listbox.logic';
import type { TableSort } from './table.logic';

export type GridColumnType = 'text' | 'number' | 'date' | 'boolean' | 'enum';

// ---------------------------------------------------------------------------------------------
// Values

const paths = new Map<string, string[]>();
/** A value by path: `'customer.name'`, `'tags.0'`. A key with no dot is read directly. */
export function getPath(row: unknown, path: string): unknown {
  if (row == null) return undefined;
  const direct = (row as Record<string, unknown>)[path];
  if (direct !== undefined || !path.includes('.')) return direct;
  let parts = paths.get(path);
  if (!parts) paths.set(path, (parts = path.split('.')));
  let v: unknown = row;
  for (const p of parts) {
    if (v == null) return undefined;
    v = (v as Record<string, unknown>)[p];
  }
  return v;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
/** A date value as epoch milliseconds: a Date, an ISO string, or a number already. NaN when none. */
export function toTime(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && ISO_DAY.test(v)) return Date.parse(v.length === 10 ? v + 'T00:00:00Z' : v);
  return NaN;
}

/** A number value: numbers, numeric strings ("1,200.5" too). NaN when none. */
export function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(/[,\s_]/g, ''));
    return n;
  }
  return NaN;
}

const empty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/** The text a value searches and exports as. Objects use their `label`, `name` or `title`, else JSON. */
export function toText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(toText).join(', ');
  const o = v as Record<string, unknown>;
  for (const k of ['label', 'name', 'title', 'value']) if (typeof o[k] === 'string' || typeof o[k] === 'number') return String(o[k]);
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

/** A column's type from its values: the first few that are not empty decide. */
export function inferColumnType(values: Iterable<unknown>): GridColumnType {
  let seen = 0;
  for (const v of values) {
    if (empty(v)) continue;
    if (typeof v === 'number' || typeof v === 'bigint') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (v instanceof Date || (typeof v === 'string' && ISO_DAY.test(v) && !Number.isNaN(toTime(v)))) return 'date';
    if (++seen >= 1) return 'text';
  }
  return 'text';
}

// ---------------------------------------------------------------------------------------------
// Filters

export type GridFilterOp =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between'
  | 'in'
  | 'notIn'
  | 'empty'
  | 'notEmpty';

/** One filter: a column key (or path), an operator, and a value (`[from, to]` for `between`, a list for `in`). */
export interface GridFilter {
  key: string;
  /** Default: `contains` for text, `equals` for the rest, `in` when the value is a list. */
  op?: GridFilterOp;
  value?: unknown;
}

/** The operators that make sense for each type, first one the default. */
export const GRID_FILTER_OPS: Record<GridColumnType, readonly GridFilterOp[]> = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'endsWith', 'empty', 'notEmpty'],
  number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty'],
  date: ['equals', 'gt', 'lt', 'between', 'empty', 'notEmpty'],
  boolean: ['equals'],
  enum: ['in', 'notIn', 'empty', 'notEmpty'],
};

/** A filter that filters nothing: no value, and not an emptiness test. */
export function filterIsBlank(f: GridFilter): boolean {
  if (f.op === 'empty' || f.op === 'notEmpty') return false;
  const v = f.value;
  if (v === undefined || v === null || v === '') return true;
  if (Array.isArray(v)) return f.op === 'between' ? v.every((x) => x === undefined || x === null || x === '') : v.length === 0;
  return false;
}

/** The predicate for one filter over one value. `type` says how to compare. */
export function filterMatcher(f: GridFilter, type: GridColumnType): (value: unknown) => boolean {
  const op = f.op ?? (Array.isArray(f.value) && type !== 'number' && type !== 'date' ? 'in' : type === 'text' ? 'contains' : 'equals');
  if (op === 'empty') return empty;
  if (op === 'notEmpty') return (v) => !empty(v);
  if (type === 'number' || type === 'date') {
    const conv = type === 'number' ? toNumber : toTime;
    // A date compares by day when the filter value is a day ("2026-11-09").
    const day = type === 'date' && typeof f.value === 'string' && f.value.length === 10;
    const norm = (v: unknown) => {
      const n = conv(v);
      return day && !Number.isNaN(n) ? Math.floor(n / 86400000) * 86400000 : n;
    };
    if (op === 'between') {
      const [a, b] = (Array.isArray(f.value) ? f.value : []) as unknown[];
      const lo = empty(a) ? -Infinity : conv(a);
      const hi = empty(b) ? Infinity : conv(b);
      return (v) => {
        const n = norm(v);
        return n >= lo && n <= hi;
      };
    }
    if (op === 'in' || op === 'notIn') {
      const set = new Set((Array.isArray(f.value) ? f.value : [f.value]).map(conv));
      return op === 'in' ? (v) => set.has(norm(v)) : (v) => !set.has(norm(v));
    }
    const target = conv(f.value);
    switch (op) {
      case 'notEquals':
        return (v) => norm(v) !== target;
      case 'gt':
        return (v) => norm(v) > target;
      case 'gte':
        return (v) => norm(v) >= target;
      case 'lt':
        return (v) => norm(v) < target;
      case 'lte':
        return (v) => norm(v) <= target;
      default:
        return (v) => norm(v) === target;
    }
  }
  if (type === 'boolean') {
    const want = f.value === true || f.value === 'true';
    return op === 'notEquals' ? (v) => !!v !== want : (v) => !!v === want;
  }
  if (op === 'in' || op === 'notIn') {
    const set = new Set((Array.isArray(f.value) ? f.value : [f.value]).map((x) => foldText(toText(x))));
    const has = (v: unknown) => (Array.isArray(v) ? v.some((x) => set.has(foldText(toText(x)))) : set.has(foldText(toText(v))));
    return op === 'in' ? has : (v) => !has(v);
  }
  const q = foldText(toText(f.value));
  switch (op) {
    case 'notContains':
      return (v) => !foldText(toText(v)).includes(q);
    case 'equals':
      return (v) => foldText(toText(v)) === q;
    case 'notEquals':
      return (v) => foldText(toText(v)) !== q;
    case 'startsWith':
      return (v) => foldText(toText(v)).startsWith(q);
    case 'endsWith':
      return (v) => foldText(toText(v)).endsWith(q);
    default:
      return (v) => foldText(toText(v)).includes(q);
  }
}

/** How the grid reads one column: its value and type, and optional own rules. */
export interface GridColumnRule<T = unknown> {
  key: string;
  type: GridColumnType;
  /** Default `getPath(row, key)`. */
  value?: (row: T) => unknown;
  /** Your own order (ascending). */
  compare?: (a: T, b: T) => number;
  /** Your own filter for this column: `(row, filter) => boolean`. */
  filterFn?: (row: T, filter: GridFilter) => boolean;
  /** Searched by the quick search. @default true */
  searchable?: boolean;
}

const valueOf = <T,>(col: GridColumnRule<T> | undefined, key: string) => (col?.value ? col.value : (row: T) => getPath(row, key));

/**
 * The positions of the rows that pass: every filter (or any, with `logic: 'or'`) and the quick search
 * (every word somewhere in the searchable columns). One pass; returns all positions when nothing filters.
 */
export function filterRowIndices<T>(
  rows: readonly T[],
  options: { filters?: readonly GridFilter[]; logic?: 'and' | 'or'; search?: string; columns: readonly GridColumnRule<T>[] },
): number[] {
  const byKey = new Map(options.columns.map((c) => [c.key, c]));
  const tests = (options.filters ?? [])
    .filter((f) => !filterIsBlank(f))
    .map((f) => {
      const col = byKey.get(f.key);
      if (col?.filterFn) {
        const own = col.filterFn;
        return (row: T) => own(row, f);
      }
      const read = valueOf(col, f.key);
      const match = filterMatcher(f, col?.type ?? 'text');
      return (row: T) => match(read(row));
    });
  const words = foldText(options.search ?? '')
    .split(/\s+/)
    .filter(Boolean);
  const searched = options.columns.filter((c) => c.searchable !== false).map((c) => valueOf(c, c.key));
  const or = options.logic === 'or';
  const out: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (tests.length) {
      let pass = !or;
      for (const t of tests) {
        if (t(row) === or) {
          pass = or;
          break;
        }
      }
      if (!pass) continue;
    }
    if (words.length) {
      let text = '';
      for (const read of searched) text += foldText(toText(read(row))) + '\u0000';
      if (!words.every((w) => text.includes(w))) continue;
    }
    out.push(i);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Sorting

const collator = typeof Intl !== 'undefined' ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
const compareText = (a: string, b: string) => (collator ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0);

/** One sort key as numbers, one per row position: empties become NaN (always last). */
function sortKeys<T>(rows: readonly T[], indices: readonly number[], col: GridColumnRule<T> | undefined, key: string): Float64Array {
  const read = valueOf(col, key);
  const type = col?.type ?? 'text';
  const keys = new Float64Array(rows.length).fill(NaN);
  if (type === 'number' || type === 'date' || type === 'boolean') {
    const conv = type === 'number' ? toNumber : type === 'date' ? toTime : (v: unknown) => (empty(v) ? NaN : v ? 1 : 0);
    for (const i of indices) keys[i] = conv(read(rows[i]));
    return keys;
  }
  // Text: rank the distinct values once, then the sort compares ranks.
  const texts = new Map<string, number>();
  const raw: Array<string | null> = new Array(rows.length);
  for (const i of indices) {
    const v = read(rows[i]);
    const t = empty(v) ? null : toText(v);
    raw[i] = t;
    if (t !== null) texts.set(t, 0);
  }
  const order = [...texts.keys()].sort(compareText);
  // Values the collator calls equal ("a" and "A") share a rank, so the sort stays stable on them.
  let rank = 0;
  for (let n = 0; n < order.length; n++) {
    if (n > 0 && compareText(order[n - 1], order[n]) !== 0) rank++;
    texts.set(order[n], rank);
  }
  for (const i of indices) keys[i] = raw[i] === null ? NaN : texts.get(raw[i]!)!;
  return keys;
}

/**
 * The positions sorted by several keys in turn (the first decides, ties go to the next), stable,
 * empties last whatever the direction. A column's own `compare` is used as is.
 */
export function sortRowIndices<T>(rows: readonly T[], indices: readonly number[], sorts: readonly TableSort[], columns: readonly GridColumnRule<T>[]): number[] {
  const out = [...indices];
  if (!sorts.length) return out;
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const plans = sorts.map((s) => {
    const col = byKey.get(s.key);
    const sign = s.direction === 'descending' ? -1 : 1;
    if (col?.compare) {
      const own = col.compare;
      return (a: number, b: number) => own(rows[a], rows[b]) * sign;
    }
    const k = sortKeys(rows, indices, col, s.key);
    return (a: number, b: number) => {
      const x = k[a];
      const y = k[b];
      if (x !== x || y !== y) return x !== x && y !== y ? 0 : x !== x ? 1 : -1; // NaN last
      return (x - y) * sign;
    };
  });
  out.sort((a, b) => {
    for (const cmp of plans) {
      const c = cmp(a, b);
      if (c) return c;
    }
    return a - b;
  });
  return out;
}

/**
 * The next sort after a header press. Alone: ascending, descending, off. With `add` (Shift): the key
 * joins (or cycles within) the existing keys, up to `max`.
 */
export function nextSorts(current: readonly TableSort[], key: string, add = false, max = 4): TableSort[] {
  const at = current.findIndex((s) => s.key === key);
  const cycled: TableSort | null = at < 0 ? { key, direction: 'ascending' } : current[at].direction === 'ascending' ? { key, direction: 'descending' } : null;
  if (!add) return cycled ? [cycled] : [];
  const rest = current.filter((s) => s.key !== key);
  if (!cycled) return rest;
  if (at >= 0) return current.map((s) => (s.key === key ? cycled : s));
  return [...rest, cycled].slice(-max);
}

// ---------------------------------------------------------------------------------------------
// Grouping and totals

export type GridAggregate = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct';

/** A total over some rows of one column. Numbers for numbers; `min`/`max` of dates are dates (ms). */
export function aggregate<T>(rows: readonly T[], indices: readonly number[], read: (row: T) => unknown, fn: GridAggregate, type: GridColumnType = 'number'): number {
  if (fn === 'count') return indices.length;
  if (fn === 'countDistinct') return new Set(indices.map((i) => toText(read(rows[i])))).size;
  const conv = type === 'date' ? toTime : toNumber;
  let sum = 0;
  let n = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const i of indices) {
    const v = conv(read(rows[i]));
    if (v !== v) continue;
    sum += v;
    n++;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (fn === 'sum') return sum;
  if (fn === 'avg') return n ? sum / n : NaN;
  if (fn === 'min') return n ? min : NaN;
  return n ? max : NaN;
}

export interface GridGroup {
  /** The shared value as text (the group's id). */
  key: string;
  value: unknown;
  /** Row positions in the group, in the current order. */
  indices: number[];
}

/** Rows split by one value, groups in the order they first appear (so they follow the sort). */
export function groupRowIndices<T>(rows: readonly T[], indices: readonly number[], read: (row: T) => unknown): GridGroup[] {
  const groups = new Map<string, GridGroup>();
  for (const i of indices) {
    const value = read(rows[i]);
    const key = toText(value);
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { key, value, indices: [] }));
    g.indices.push(i);
  }
  return [...groups.values()];
}

// ---------------------------------------------------------------------------------------------
// Virtual window

/**
 * Tallest a scroll area is made. Browsers cap element heights (about 17 million px in Firefox), so a
 * taller list is drawn at this height and its scroll position is scaled.
 */
export const GRID_MAX_SCROLL = 10_000_000;

/**
 * Row offsets with a default height and a few rows of their own height (resized or expanded rows).
 * Offsets and the row at a pixel are O(log k) in the k rows with their own height, so a billion
 * rows cost nothing until rows differ.
 */
export class RowSizes {
  private keys: number[] = [];
  private extra: number[] = [];
  private prefix: number[] = [];
  constructor(
    public count: number,
    public height: number,
    sizes?: ReadonlyMap<number, number>,
  ) {
    if (sizes) {
      this.keys = [...sizes.keys()].filter((i) => i >= 0 && i < count).sort((a, b) => a - b);
      this.extra = this.keys.map((i) => sizes.get(i)! - height);
      let run = 0;
      this.prefix = this.extra.map((e) => (run += e));
    }
  }
  /** How many rows with their own height come before row `i`. */
  private before(i: number): number {
    let lo = 0;
    let hi = this.keys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.keys[mid] < i) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  /** Top of row `i` (also the total height when `i` is the count). */
  offset(i: number): number {
    const n = this.before(i);
    return i * this.height + (n ? this.prefix[n - 1] : 0);
  }
  size(i: number): number {
    const n = this.before(i);
    return n < this.keys.length && this.keys[n] === i ? this.height + this.extra[n] : this.height;
  }
  get total(): number {
    return this.offset(this.count);
  }
  /** The row at a pixel from the top. */
  indexAt(px: number): number {
    if (px <= 0 || this.count === 0) return 0;
    let lo = 0;
    let hi = this.count - 1;
    // Binary search on offset (monotonic); a few dozen steps even for a billion rows.
    while (lo < hi) {
      const mid = lo + Math.ceil((hi - lo) / 2);
      if (this.offset(mid) <= px) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }
}

export interface GridWindow {
  /** First and one past the last row to draw. */
  start: number;
  end: number;
  /** Height of the spacer above the drawn rows, in real (scaled) pixels. */
  before: number;
  /** Height of the spacer below. */
  after: number;
  /** Height the scroll area is made. */
  scrollHeight: number;
  /** Virtual pixels per real pixel (1 unless the list is taller than `GRID_MAX_SCROLL`). */
  ratio: number;
}

/**
 * The rows to draw for a position. `top` is the virtual scroll position (in row pixels, precise for
 * any count); the result places the drawn rows exactly under the real scroll position, so a list
 * taller than any browser allows scrolls row by row.
 */
export function gridWindow(sizes: RowSizes, top: number, viewport: number, overscan = 6): GridWindow {
  const total = sizes.total;
  const scrollHeight = Math.min(total, GRID_MAX_SCROLL);
  const ratio = total > scrollHeight && scrollHeight > viewport ? (total - viewport) / (scrollHeight - viewport) : 1;
  const clamped = Math.max(0, Math.min(top, Math.max(0, total - viewport)));
  const first = sizes.indexAt(clamped);
  const last = sizes.indexAt(clamped + viewport);
  const start = Math.max(0, first - overscan);
  const end = Math.min(sizes.count, last + 1 + overscan);
  // Real scroll position of `clamped`, then the drawn rows start where row `start` sits relative to it.
  const real = clamped / ratio;
  const before = Math.max(0, real - (clamped - sizes.offset(start)));
  const drawn = sizes.offset(end) - sizes.offset(start);
  const after = Math.max(0, scrollHeight - before - drawn);
  return { start, end, before, after, scrollHeight, ratio };
}

/** Rows a fetch block holds, and the blocks a window needs (for a data source). */
export function blocksFor(start: number, end: number, blockSize: number): number[] {
  const out: number[] = [];
  for (let b = Math.floor(start / blockSize); b * blockSize < end; b++) out.push(b);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Columns

/** A width kept between a column's min and max. */
export function clampWidth(width: number, min = 48, max = Infinity): number {
  return Math.max(min, Math.min(max, Math.round(width)));
}

/** Sticky offsets of pinned columns: start ones from the start edge, end ones from the end edge. */
export function pinOffsets(widths: readonly number[], pins: ReadonlyArray<'start' | 'end' | undefined>): Array<number | undefined> {
  const out: Array<number | undefined> = new Array(widths.length).fill(undefined);
  let run = 0;
  for (let i = 0; i < widths.length; i++)
    if (pins[i] === 'start') {
      out[i] = run;
      run += widths[i];
    }
  run = 0;
  for (let i = widths.length - 1; i >= 0; i--)
    if (pins[i] === 'end') {
      out[i] = run;
      run += widths[i];
    }
  return out;
}

/** Columns in display order: pinned start ones first, then the rest, then pinned end ones. */
export function orderColumns<C extends { key: string }>(columns: readonly C[], order: readonly string[] | undefined, pins: Readonly<Record<string, 'start' | 'end' | undefined>>): C[] {
  const rank = new Map((order ?? []).map((k, i) => [k, i]));
  const sorted = [...columns].sort((a, b) => (rank.get(a.key) ?? Infinity) - (rank.get(b.key) ?? Infinity) || columns.indexOf(a) - columns.indexOf(b));
  const zone = (c: C) => (pins[c.key] === 'start' ? 0 : pins[c.key] === 'end' ? 2 : 1);
  return sorted.sort((a, b) => zone(a) - zone(b));
}

// ---------------------------------------------------------------------------------------------
// Export

/** CSV (RFC 4180): a header row, then one line per row; quotes where needed. */
export function toCsv<T>(rows: readonly T[], indices: readonly number[], columns: ReadonlyArray<{ header: string; value: (row: T) => unknown }>): string {
  const cell = (v: unknown) => {
    const t = toText(v);
    return /[",\r\n]/.test(t) || /^\s|\s$/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = [columns.map((c) => cell(c.header)).join(',')];
  for (const i of indices) lines.push(columns.map((c) => cell(c.value(rows[i]))).join(','));
  return lines.join('\r\n');
}
