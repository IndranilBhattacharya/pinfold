// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  aggregate,
  blocksFor,
  filterMatcher,
  filterRowIndices,
  getPath,
  gridWindow,
  GRID_MAX_SCROLL,
  groupRowIndices,
  inferColumnType,
  nextSorts,
  orderColumns,
  pinOffsets,
  RowSizes,
  sortRowIndices,
  toCsv,
  type GridColumnRule,
  type GridFilter,
} from './grid.logic';

type Order = { id: number; customer: { name: string; city?: string }; total: number | null; placed: string; paid: boolean; tags: string[] };
const rows: Order[] = [
  { id: 1, customer: { name: 'Émile', city: 'Paris' }, total: 120, placed: '2026-11-03', paid: true, tags: ['vip'] },
  { id: 2, customer: { name: 'ada' }, total: 80.5, placed: '2026-10-21', paid: false, tags: [] },
  { id: 3, customer: { name: 'Bo', city: 'Oslo' }, total: null, placed: '2026-11-03T15:00:00Z', paid: true, tags: ['new', 'vip'] },
  { id: 4, customer: { name: 'item 10', city: 'Paris' }, total: 1200, placed: '2025-01-02', paid: false, tags: ['new'] },
  { id: 5, customer: { name: 'item 2', city: 'Rome' }, total: 80.5, placed: '2026-02-14', paid: true, tags: [] },
];
const columns: GridColumnRule<Order>[] = [
  { key: 'id', type: 'number' },
  { key: 'customer.name', type: 'text' },
  { key: 'customer.city', type: 'enum' },
  { key: 'total', type: 'number' },
  { key: 'placed', type: 'date' },
  { key: 'paid', type: 'boolean' },
  { key: 'tags', type: 'enum' },
];
const ids = (idx: number[]) => idx.map((i) => rows[i].id);
const run = (filters: GridFilter[], logic?: 'and' | 'or') => ids(filterRowIndices(rows, { filters, logic, columns }));

describe('grid engine', () => {
  it('reads paths and infers types', () => {
    expect(getPath(rows[0], 'customer.name')).toBe('Émile');
    expect(getPath(rows[1], 'customer.city')).toBeUndefined();
    expect(getPath({ 'a.b': 1 }, 'a.b')).toBe(1);
    expect(inferColumnType([null, 3])).toBe('number');
    expect(inferColumnType(['', '2026-11-09'])).toBe('date');
    expect(inferColumnType([true])).toBe('boolean');
    expect(inferColumnType(['Paris'])).toBe('text');
  });

  it('filters by type: text folds accents and case, numbers and dates compare, enums match lists', () => {
    expect(run([{ key: 'customer.name', value: 'emi' }])).toEqual([1]);
    expect(run([{ key: 'total', op: 'gte', value: 100 }])).toEqual([1, 4]);
    expect(run([{ key: 'total', op: 'between', value: [80, 130] }])).toEqual([1, 2, 5]);
    expect(run([{ key: 'total', op: 'empty' }])).toEqual([3]);
    expect(run([{ key: 'placed', value: '2026-11-03' }])).toEqual([1, 3]); // a day matches a time on it
    expect(run([{ key: 'placed', op: 'between', value: ['2026-01-01', ''] }])).toEqual([1, 2, 3, 5]);
    expect(run([{ key: 'paid', value: false }])).toEqual([2, 4]);
    expect(run([{ key: 'customer.city', value: ['paris', 'Rome'] }])).toEqual([1, 4, 5]);
    expect(run([{ key: 'tags', op: 'in', value: ['new'] }])).toEqual([3, 4]);
    expect(run([{ key: 'customer.city', op: 'notIn', value: ['Paris'] }])).toEqual([2, 3, 5]);
    expect(run([{ key: 'total', op: 'gt', value: 1000 }, { key: 'customer.name', value: 'ada' }], 'or')).toEqual([2, 4]);
    expect(run([{ key: 'total', value: '' }])).toEqual([1, 2, 3, 4, 5]); // blank filters filter nothing
    expect(filterMatcher({ key: 'x', op: 'endsWith', value: 'ON' }, 'text')('Lyon')).toBe(true);
  });

  it('quick search: every word somewhere in the row; own filter rules win', () => {
    expect(ids(filterRowIndices(rows, { search: 'paris vip', columns }))).toEqual([1]);
    const own = columns.map((c) => (c.key === 'total' ? { ...c, filterFn: (r: Order) => r.id === 2 } : c));
    expect(ids(filterRowIndices(rows, { filters: [{ key: 'total', value: 'anything' }], columns: own }))).toEqual([2]);
  });

  it('sorts by several keys, stable, empties last both ways, text naturally', () => {
    const all = rows.map((_, i) => i);
    const by = (sorts: Parameters<typeof sortRowIndices>[2]) => ids(sortRowIndices(rows, all, sorts, columns));
    expect(by([{ key: 'total', direction: 'ascending' }])).toEqual([2, 5, 1, 4, 3]);
    expect(by([{ key: 'total', direction: 'descending' }])).toEqual([4, 1, 2, 5, 3]);
    expect(by([{ key: 'total', direction: 'ascending' }, { key: 'id', direction: 'descending' }])).toEqual([5, 2, 1, 4, 3]);
    expect(by([{ key: 'customer.name', direction: 'ascending' }])).toEqual([2, 3, 1, 5, 4]);
    expect(by([{ key: 'placed', direction: 'ascending' }])).toEqual([4, 5, 2, 1, 3]);
    expect(by([{ key: 'customer.city', direction: 'ascending' }])).toEqual([3, 1, 4, 5, 2]);
  });

  it('sorts a hundred thousand rows by two keys quickly', () => {
    const big = Array.from({ length: 100_000 }, (_, i) => ({ n: (i * 7919) % 1000, s: `name ${(i * 31) % 5000}` }));
    const t = performance.now();
    const out = sortRowIndices(big, big.map((_, i) => i), [{ key: 's', direction: 'ascending' }, { key: 'n', direction: 'descending' }], [{ key: 's', type: 'text' }, { key: 'n', type: 'number' }]);
    expect(performance.now() - t).toBeLessThan(2000);
    expect(big[out[0]].s).toBe('name 0');
  });

  it('header presses: alone cycles, with Shift adds keys', () => {
    expect(nextSorts([], 'a')).toEqual([{ key: 'a', direction: 'ascending' }]);
    expect(nextSorts([{ key: 'a', direction: 'ascending' }], 'a')).toEqual([{ key: 'a', direction: 'descending' }]);
    expect(nextSorts([{ key: 'a', direction: 'descending' }], 'a')).toEqual([]);
    expect(nextSorts([{ key: 'a', direction: 'ascending' }], 'b', true)).toEqual([{ key: 'a', direction: 'ascending' }, { key: 'b', direction: 'ascending' }]);
    expect(nextSorts([{ key: 'a', direction: 'ascending' }, { key: 'b', direction: 'descending' }], 'b', true)).toEqual([{ key: 'a', direction: 'ascending' }]);
    expect(nextSorts([{ key: 'a', direction: 'ascending' }], 'b')).toEqual([{ key: 'b', direction: 'ascending' }]);
  });

  it('groups and totals', () => {
    const all = rows.map((_, i) => i);
    const groups = groupRowIndices(rows, all, (r) => r.paid);
    expect(groups.map((g) => [g.key, g.indices.length])).toEqual([
      ['true', 3],
      ['false', 2],
    ]);
    const total = (r: Order) => r.total;
    expect(aggregate(rows, all, total, 'sum')).toBe(1481);
    expect(aggregate(rows, all, total, 'avg')).toBeCloseTo(370.25);
    expect(aggregate(rows, all, total, 'max')).toBe(1200);
    expect(aggregate(rows, all, total, 'count')).toBe(5);
    expect(aggregate(rows, all, total, 'countDistinct')).toBe(4);
  });

  it('row offsets with a few rows of their own height', () => {
    const s = new RowSizes(1_000_000_000, 40, new Map([[2, 100], [5, 10]]));
    expect(s.offset(2)).toBe(80);
    expect(s.offset(3)).toBe(180);
    expect(s.offset(6)).toBe(6 * 40 + 60 - 30);
    expect(s.total).toBe(40_000_000_000 + 30);
    expect(s.indexAt(179)).toBe(2);
    expect(s.indexAt(180)).toBe(3);
    expect(s.indexAt(40 * 500_000_000 + 30)).toBe(500_000_000);
  });

  it('a window for a billion rows: drawn rows sit under the real scroll position; the area stays under the browser cap', () => {
    const sizes = new RowSizes(1_000_000_000, 40);
    const top = 40 * 123_456_789;
    const w = gridWindow(sizes, top, 600, 4);
    expect(w.scrollHeight).toBe(GRID_MAX_SCROLL);
    expect(w.ratio).toBeGreaterThan(1000);
    expect(w.start).toBe(123_456_789 - 4);
    expect(w.end).toBe(123_456_789 + 15 + 1 + 4);
    const real = top / w.ratio;
    // The row at the virtual top is drawn exactly at the real scroll position.
    expect(w.before + 4 * 40).toBeCloseTo(real, 3);
    expect(w.before + (w.end - w.start) * 40 + w.after).toBeCloseTo(GRID_MAX_SCROLL, 3);
    const small = gridWindow(new RowSizes(100, 40), 400, 200);
    expect([small.start, small.end, small.ratio, small.scrollHeight]).toEqual([4, 22, 1, 4000]);
    expect(blocksFor(250, 420, 100)).toEqual([2, 3, 4]);
  });

  it('columns: pinned order and offsets; CSV quoting', () => {
    const cols = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];
    expect(orderColumns(cols, ['d', 'c'], { b: 'start', a: 'end' }).map((c) => c.key)).toEqual(['b', 'd', 'c', 'a']);
    expect(pinOffsets([100, 50, 80, 60], ['start', 'start', undefined, 'end'])).toEqual([0, 100, undefined, 0]);
    const csv = toCsv(rows, [0, 2], [
      { header: 'Name', value: (r: Order) => r.customer.name },
      { header: 'Tags', value: (r: Order) => r.tags },
      { header: 'Note', value: () => 'say "hi"' },
    ]);
    expect(csv).toBe('Name,Tags,Note\r\nÉmile,vip,"say ""hi"""\r\nBo,"new, vip","say ""hi"""');
  });
});
