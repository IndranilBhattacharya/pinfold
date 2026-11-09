import * as React from 'react';
import {
  aggregate,
  blocksFor,
  clampWidth,
  cn,
  dataAttr,
  dimensionVars,
  filterRowIndices,
  getPath,
  groupRowIndices,
  headerFromKey,
  inactiveTableOptions,
  inferColumnType,
  mergeProps,
  moveItem,
  nextSorts,
  orderColumns,
  pinOffsets,
  radiusProps,
  RowSizes,
  sortRowIndices,
  toCsv,
  toText,
  warnOnce,
  type GridColumnRule,
  type GridFilter,
  type GridFilterOp,
  type GridGroup,
  type PropsBag,
  type TableSort,
} from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { Pagination } from '../pagination/Pagination';
import { CellEditor, FilterControl, PausedInput } from './parts';
import { useVirtualRows } from './virtual';
import type { TableApi, TableColumn, TableColumnState, TableComponent, TableConfig, TableItemContext, TableResolvedColumn, TableRootProps, TableSlot, TableState } from './types';

type Row = Record<string, unknown>;
type Col = TableResolvedColumn<Row>;
type Entry = { kind: 'row'; index: number; pos: number } | { kind: 'detail'; index: number; pos: number } | { kind: 'group'; group: GridGroup } | { kind: 'remote'; pos: number };

const EMPTY: readonly Row[] = [];
const ROW_HEIGHT = { compact: 36, normal: 44, relaxed: 52 } as const;
/** In a fixed layout, a column with no width gets one that suits its type; text shares the rest. */
const TYPE_WIDTH: Record<string, number | undefined> = { number: 120, date: 210, boolean: 100, enum: 150 };
const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d={d} />
  </svg>
);
const SORT_BOTH = icon('m8 9 4-4 4 4M16 15l-4 4-4-4');
const SORT_UP = icon('m6 15 6-6 6 6');
const SORT_DOWN = icon('m6 9 6 6 6-6');
const CHEVRON = icon('m9 6 6 6-6 6');
const asSorts = (s: TableSort | readonly TableSort[] | null | undefined): readonly TableSort[] => (!s ? [] : Array.isArray(s) ? s : [s as TableSort]);
const px = (w: number | string | undefined) => (typeof w === 'number' ? `${w}px` : w);

/**
 * A data grid: your rows (or a server's, a block at a time) with typed columns; sorting by one key
 * or several; filters by type on values and on paths into objects; a quick search; pages or a
 * virtual body for any number of rows; columns that resize, reorder, pin and hide; rows that resize,
 * expand and group with totals; cells you draw and edit. A hook that hands back a component and its
 * controller.
 *
 *   const Orders = useTable({ label: 'Orders', rows, columns: ['id', 'customer.name', { key: 'total', aggregate: 'sum' }], sortable: true, filterable: true, pageSize: 25 });
 *   return <Orders />;
 *
 * Precedence: this config, then `defaults.table`, then the provider (size, tone), then the library default.
 */
export function useTable<T extends object>(input: TableConfig<T>): TableComponent {
  const ctx = usePinfold();
  const own = input as unknown as TableConfig<Row>;
  const config = ctx.defaults.table ? mergeConfig<TableConfig<Row>>(ctx.defaults.table as TableConfig<Row>, own) : own;
  const base = useId();
  const source = config.dataSource;
  const rows = config.rows ?? EMPTY;
  const L = config.labels ?? {};
  const scroller = React.useRef<HTMLDivElement | null>(null);
  const thead = React.useRef<HTMLTableSectionElement | null>(null);
  const tableRef = React.useRef<HTMLTableElement | null>(null);
  const headerBox = React.useRef<HTMLInputElement | null>(null);

  const [sorts, setSortState] = useControllableState<readonly TableSort[]>({ value: config.sort === undefined ? undefined : asSorts(config.sort), defaultValue: asSorts(config.defaultSort) });
  const [filters, setFiltersState] = useControllableState<readonly GridFilter[]>({ value: config.filters, defaultValue: config.defaultFilters ?? [] });
  const [search, setSearchState] = useControllableState<string>({ value: config.search, defaultValue: config.defaultSearch ?? '' });
  const [selected, setSelectedState] = useControllableState<readonly string[]>({ value: config.selected, defaultValue: config.defaultSelected ?? [] });
  const [expanded, setExpandedState] = useControllableState<readonly string[]>({ value: config.expanded, defaultValue: config.defaultExpanded ?? [] });
  const [page, setPageState] = useControllableState<number>({ value: config.page, defaultValue: config.defaultPage ?? 1 });
  // A size picked from `pageSizes` holds until the config's pageSize changes (or, with onPageSizeChange, the config decides).
  const [picked, setPicked] = React.useState<{ size: number; from: number | undefined } | null>(null);
  const pageSize = !config.onPageSizeChange && picked && picked.from === config.pageSize ? picked.size : config.pageSize ?? 0;
  const [colState, setColStateState] = useControllableState<TableColumnState>({ value: config.columnState, defaultValue: config.defaultColumnState ?? {} });
  const [rowHeights, setRowHeights] = React.useState<Record<string, number>>({});
  const [detailHeights, setDetailHeights] = React.useState<Record<string, number>>({});
  const [collapsed, setCollapsed] = React.useState<readonly string[]>([]);
  const [editing, setEditing] = React.useState<{ rowKey: string; key: string } | null>(null);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<{ r: number; c: number }>({ r: -1, c: 0 });
  const [announce, setAnnounce] = React.useState('');
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  const moveFocus = React.useRef(false);
  const anchor = React.useRef<number | null>(null);
  const [drag, setDrag] = React.useState<{ key: string; over?: string; after?: boolean } | null>(null);
  // The column being dragged, read by the drop handlers before React has re-rendered.
  const dragKey = React.useRef<string | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tableMeta, validateConfig }) => {
      for (const problem of validateConfig(tableMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTableOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Table: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Table: give it a `label`: it is the caption that names the table.');
    warnOnce(!!(config.virtual || source) && !config.dimensions?.height && !config.dimensions?.maxHeight, 'Table: a virtual table needs a height (`dimensions.height` or `dimensions.maxHeight`).');
  }

  // ---- remembered state (after mount: the server has no storage) ----
  const storeKey = config.autoSaveId ? `pinfold-table:${config.autoSaveId}` : null;
  React.useEffect(() => {
    if (!storeKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? 'null') as { columns?: TableColumnState; sort?: TableSort[]; filters?: GridFilter[] } | null;
      if (!saved) return;
      if (saved.columns && config.columnState === undefined) setColStateState(saved.columns);
      if (saved.sort && config.sort === undefined) setSortState(saved.sort);
      if (saved.filters && config.filters === undefined) setFiltersState(saved.filters);
    } catch {
      // Storage blocked or a bad entry: start from the defaults.
    }
  }, [storeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!storeKey) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ columns: colState, sort: sorts, filters }));
    } catch {
      // Storage full or blocked: nothing to keep.
    }
  }, [storeKey, colState, sorts, filters]);

  // ---- data source blocks ----
  const blockSize = source?.blockSize ?? 100;
  const blocks = React.useRef(new Map<number, readonly Row[]>());
  const pending = React.useRef(new Map<number, AbortController>());
  const [srcCount, setSrcCount] = React.useState(source?.rowCount ?? 0);
  React.useEffect(() => setSrcCount(source?.rowCount ?? 0), [source?.rowCount]);
  const query = JSON.stringify([sorts, filters, search]);
  React.useEffect(() => {
    for (const c of pending.current.values()) c.abort();
    pending.current.clear();
    blocks.current.clear();
    refresh();
  }, [query, source]);

  // ---- columns ----
  const sample = React.useMemo(() => {
    if (!source) return rows.slice(0, 25);
    for (const b of blocks.current.values()) return b.slice(0, 25);
    return EMPTY;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, source, blocks.current.size]);
  const resolved: Col[] = React.useMemo(() => {
    const first = sample[0];
    const defs: Array<TableColumn<Row>> = (config.columns ?? (first ? (Object.keys(first) as string[]) : [])).map((c) => (typeof c === 'string' ? { key: c } : (c as TableColumn<Row>)));
    return defs.map((c) => {
      const key = c.key as string;
      const read = c.value ?? ((row: Row) => getPath(row, key));
      const type = c.type ?? (c.options ? 'enum' : inferColumnType(sample.map(read)));
      return { ...c, key, type, align: c.align ?? (type === 'number' ? 'end' : 'start'), title: typeof c.header === 'string' ? c.header : headerFromKey(key.replace(/\./g, ' ')), read } as Col;
    });
  }, [config.columns, sample]);
  const pins: Record<string, 'start' | 'end' | undefined> = {};
  for (const c of resolved) pins[c.key] = colState.pinned && c.key in colState.pinned ? colState.pinned[c.key] : c.pinned;
  const hidden = new Set(colState.hidden ?? resolved.filter((c) => c.hidden).map((c) => c.key));
  const columns = orderColumns(
    resolved.filter((c) => !hidden.has(c.key)),
    colState.order,
    pins,
  );
  const rules: GridColumnRule<Row>[] = React.useMemo(() => resolved.map((c) => ({ key: c.key, type: c.type, value: c.read, compare: c.compare, filterFn: c.filterFn, searchable: c.searchable })), [resolved]);
  const sortable = (c: Col) => c.sortable ?? !!config.sortable;
  const filterable = (c: Col) => c.filterable ?? !!config.filterable;
  const resizable = (c: Col) => c.resizable ?? !!config.resizableColumns;
  const optionsOf = (c: Col) => {
    if (c.options) return c.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }));
    if (c.type !== 'enum') return [];
    const seen = new Set<string>();
    for (const r of rows) {
      const v = c.read(r);
      for (const x of Array.isArray(v) ? v : [v]) if (x != null && x !== '') seen.add(toText(x));
      if (seen.size >= 100) break;
    }
    return [...seen].sort().map((v) => ({ value: v, label: v }));
  };

  // ---- the pipeline (client rows): filter, sort, page, group ----
  const filtered = React.useMemo(
    () => (source || config.manualFilter ? rows.map((_, i) => i) : filterRowIndices(rows, { filters, logic: config.filterLogic, search, columns: rules })),
    [rows, source, config.manualFilter, filters, search, config.filterLogic, rules],
  );
  const ordered = React.useMemo(() => (source || config.manualSort ? filtered : sortRowIndices(rows, filtered, sorts, rules)), [rows, source, config.manualSort, filtered, sorts, rules]);
  const virtual = !!(config.virtual || source);
  const keyOf = (row: Row | undefined, i: number): string =>
    !row ? `#${i}` : typeof config.rowKey === 'function' ? config.rowKey(row, i) : config.rowKey ? toText(getPath(row, config.rowKey)) : row.id !== undefined ? toText(row.id) : String(i);
  const groupCol = config.groupBy && !source ? resolved.find((c) => c.key === config.groupBy) : undefined;
  const groupRead = groupCol?.read ?? (config.groupBy ? (r: Row) => getPath(r, config.groupBy as string) : null);
  // Grouped rows: every filtered row is grouped (the groups follow the sort), then the grouped list is paged.
  const grouped = React.useMemo(() => (groupRead && !source ? groupRowIndices(rows, ordered, groupRead) : null), [groupRead, source, rows, ordered]);
  const all: Entry[] = React.useMemo(() => {
    if (source) return [];
    const out: Entry[] = [];
    let pos = 0;
    const push = (index: number) => {
      out.push({ kind: 'row', index, pos });
      if (config.renderDetail && expanded.includes(keyOf(rows[index], index))) out.push({ kind: 'detail', index, pos });
      pos++;
    };
    if (grouped) {
      for (const g of grouped) {
        out.push({ kind: 'group', group: g });
        if (!collapsed.includes(g.key)) for (const i of g.indices) push(i);
      }
    } else for (const i of ordered) push(i);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, ordered, grouped, collapsed, expanded, config.renderDetail, rows]);
  const paged = pageSize > 0 && !virtual && config.total === undefined;
  // A page holds pageSize rows; group headers and detail panels ride along with their rows.
  const pageStarts = React.useMemo(() => {
    if (!paged) return [0];
    const starts: number[] = [];
    let rowsSeen = 0;
    all.forEach((e, i) => {
      // A row counts; so does a folded group's header (nothing follows it). An open group's header
      // rides with its first row; details ride with their row.
      const folded = e.kind === 'group' && collapsed.includes(e.group.key);
      if (e.kind !== 'row' && !folded) return;
      if (rowsSeen % pageSize === 0) starts.push(e.kind === 'row' && i > 0 && all[i - 1].kind === 'group' && !collapsed.includes((all[i - 1] as { group: GridGroup }).group.key) ? i - 1 : i);
      rowsSeen++;
    });
    return starts.length ? starts : [0];
  }, [paged, all, pageSize, collapsed]);
  const pageCount = pageSize > 0 ? Math.max(1, config.total !== undefined ? Math.ceil(config.total / pageSize) : pageStarts.length) : 1;
  const current = Math.min(Math.max(1, page), pageCount);
  const entries: Entry[] = paged ? all.slice(pageStarts[current - 1] ?? 0, pageStarts[current] ?? all.length) : all;
  const onPage = paged ? entries.filter((e): e is Extract<Entry, { kind: 'row' }> => e.kind === 'row').map((e) => e.index) : ordered;
  const count = source ? srcCount : entries.length;
  const entryAt = (i: number): Entry => (source ? { kind: 'remote', pos: i } : entries[i]);
  const rowOf = (e: Entry): Row | undefined => {
    if (e.kind === 'group') return undefined;
    if (e.kind === 'remote') return blocks.current.get(Math.floor(e.pos / blockSize))?.[e.pos % blockSize];
    return rows[e.index];
  };
  const keyOfEntry = (e: Entry) => (e.kind === 'group' ? `group:${e.group.key}` : e.kind === 'remote' ? keyOf(rowOf(e), e.pos) : keyOf(rows[e.index], e.index));

  // ---- heights and the virtual window ----
  const density = config.density ?? 'normal';
  const rowHeight = config.rowHeight ?? ROW_HEIGHT[density];
  const sizes = React.useMemo(() => {
    const own = new Map<number, number>();
    if (virtual && !source && (Object.keys(rowHeights).length || entries.some((e) => e.kind === 'detail'))) {
      entries.forEach((e, i) => {
        const k = keyOf(rowOf(e), e.kind === 'group' ? i : e.kind === 'remote' ? e.pos : e.index);
        if (e.kind === 'detail') own.set(i, detailHeights[k] ?? 180);
        else if (e.kind === 'row' && rowHeights[k]) own.set(i, rowHeights[k]);
      });
    } else if (source) for (const [k, h] of Object.entries(rowHeights)) if (k.startsWith('#')) own.set(Number(k.slice(1)), h);
    return new RowSizes(count, rowHeight, own);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, rowHeight, entries, rowHeights, detailHeights, virtual, source]);
  const vr = useVirtualRows(virtual, sizes, scroller, headerHeight);
  useIsomorphicLayoutEffect(() => {
    if (thead.current && thead.current.offsetHeight !== headerHeight) setHeaderHeight(thead.current.offsetHeight);
  });
  const win = vr.window;
  const start = win ? win.start : 0;
  const end = win ? win.end : count;

  // Fetch the blocks the window needs; drop requests it no longer needs.
  React.useEffect(() => {
    if (!source) return;
    const want = new Set(blocksFor(start, Math.min(end, srcCount), blockSize));
    for (const [b, c] of pending.current)
      if (!want.has(b)) {
        c.abort();
        pending.current.delete(b);
      }
    for (const b of want) {
      if (blocks.current.has(b) || pending.current.has(b)) continue;
      const controller = new AbortController();
      pending.current.set(b, controller);
      const from = b * blockSize;
      void Promise.resolve(source.getRows({ start: from, end: Math.min(from + blockSize, srcCount), sort: [...sorts], filters: [...filters], search, signal: controller.signal }))
        .then((res) => {
          if (controller.signal.aborted) return;
          const list = Array.isArray(res) ? (res as readonly Row[]) : (res as { rows: readonly Row[] }).rows;
          const total = Array.isArray(res) ? undefined : (res as { rowCount?: number }).rowCount;
          blocks.current.set(b, list);
          // Keep memory flat while scrolling far: a few hundred blocks at most.
          if (blocks.current.size > 300) blocks.current.delete(blocks.current.keys().next().value as number);
          if (total !== undefined) setSrcCount(total);
          refresh();
        })
        .catch(() => undefined)
        .finally(() => {
          if (pending.current.get(b) === controller) pending.current.delete(b);
        });
    }
  });

  // ---- state setters with events ----
  const setSort = (next: readonly TableSort[]) => {
    setSortState(next);
    config.onSortChange?.([...next]);
    vr.reset();
    const first = next[0];
    const title = first ? resolved.find((c) => c.key === first.key)?.title ?? first.key : '';
    setAnnounce(first ? `${title}, ${first.direction}${next.length > 1 ? `, then ${next.length - 1} more` : ''}` : 'Not sorted');
  };
  // The latest filters, so two controls committing in one tick both count.
  const latestFilters = React.useRef(filters);
  latestFilters.current = filters;
  const setFilters = (next: readonly GridFilter[]) => {
    latestFilters.current = next;
    setFiltersState(next);
    config.onFiltersChange?.([...next]);
    setPage(1);
    vr.reset();
  };
  const setFilter = (key: string, value: unknown, op?: GridFilterOp) => {
    const rest = latestFilters.current.filter((f) => f.key !== key);
    setFilters(value === undefined || value === null || value === '' ? rest : [...rest, { key, op, value }]);
  };
  const setSearch = (next: string) => {
    setSearchState(next);
    config.onSearchChange?.(next);
    setPage(1);
    vr.reset();
  };
  const setSelected = (next: string[]) => {
    setSelectedState(next);
    config.onSelectionChange?.(next);
  };
  const setExpanded = (next: string[]) => {
    setExpandedState(next);
    config.onExpandedChange?.(next);
  };
  const setPage = (p: number) => {
    setPageState(p);
    if (p !== page) config.onPageChange?.(p);
  };
  const setColState = (next: TableColumnState) => {
    setColStateState(next);
    config.onColumnStateChange?.(next);
  };
  const widthOf = (c: Col): number | undefined => colState.widths?.[c.key] ?? (typeof c.width === 'number' ? c.width : undefined);

  // Selection: Shift picks the span from the last row picked.
  const selection = config.selection ?? 'none';
  const visibleKeys = source ? [] : (paged ? onPage : ordered).map((i) => keyOf(rows[i], i));
  const boxState = !visibleKeys.length ? 'none' : visibleKeys.every((k) => selected.includes(k)) ? 'all' : visibleKeys.some((k) => selected.includes(k)) ? 'some' : 'none';
  React.useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = boxState === 'some';
  });
  const toggleRow = (key: string, pos: number, span: boolean) => {
    if (selection === 'single') return setSelected(selected.includes(key) ? [] : [key]);
    if (span && anchor.current !== null && !source) {
      const [a, b] = anchor.current < pos ? [anchor.current, pos] : [pos, anchor.current];
      const list = paged ? onPage : ordered;
      const keys = list.slice(a, b + 1).map((i) => keyOf(rows[i], i));
      setSelected([...new Set([...selected, ...keys])]);
    } else setSelected(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
    anchor.current = pos;
  };

  // ---- editing ----
  const startEdit = (row: Row, c: Col, rowKey: string) => {
    const can = typeof c.editable === 'function' ? c.editable(row) : c.editable;
    if (!can || !config.onCellEdit) return;
    setEditError(null);
    setEditing({ rowKey, key: c.key });
  };
  const commitEdit = (row: Row, c: Col, rowKey: string, value: unknown) => {
    const previous = c.read(row);
    if (value === previous || (toText(value) === toText(previous) && typeof value === typeof previous)) {
      setEditing(null);
      return;
    }
    const problem = c.validate?.(value, row);
    if (problem) {
      setEditError(problem);
      return;
    }
    const finish = (ok: unknown) => {
      if (ok === false) setEditError(L.notSaved ?? 'Not saved');
      else {
        setEditing(null);
        setEditError(null);
        moveFocus.current = true;
      }
    };
    try {
      const res = config.onCellEdit?.({ row, rowKey, key: c.key, value, previous });
      if (res && typeof (res as Promise<unknown>).then === 'function') (res as Promise<unknown>).then(finish, () => setEditError(L.notSaved ?? 'Not saved'));
      else finish(res);
    } catch {
      setEditError(L.notSaved ?? 'Not saved');
    }
  };

  // ---- columns: resize, reorder ----
  const snapshotWidths = (): Record<string, number> => {
    const out: Record<string, number> = { ...(colState.widths ?? {}) };
    tableRef.current?.querySelectorAll<HTMLElement>('thead th[data-key]').forEach((th) => {
      const k = th.dataset.key!;
      if (out[k] === undefined) out[k] = th.offsetWidth;
    });
    return out;
  };
  const resizeTo = (c: Col, width: number, widths = colState.widths ?? {}) => setColState({ ...colState, widths: { ...widths, [c.key]: clampWidth(width, c.minWidth ?? 64, c.maxWidth) } });
  const onResizeStart = (c: Col) => (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    const th = handle.closest('th') as HTMLElement;
    const widths = snapshotWidths();
    const startX = event.clientX;
    const startW = th.offsetWidth;
    const flip = ctx.dir === 'rtl' ? -1 : 1;
    handle.setPointerCapture?.(event.pointerId);
    const move = (e: PointerEvent) => resizeTo(c, startW + (e.clientX - startX) * flip, widths);
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  };
  const reorder = (from: string, to: string, after: boolean) => {
    if (from === to) return;
    const keys = columns.map((c) => c.key);
    const fromAt = keys.indexOf(from);
    let toAt = keys.indexOf(to) + (after ? 1 : 0);
    if (fromAt < toAt) toAt--;
    const next = moveItem(keys, fromAt, toAt);
    const order = [...next, ...resolved.map((c) => c.key).filter((k) => !next.includes(k))];
    setColState({ ...colState, order });
    setAnnounce(`${resolved.find((c) => c.key === from)?.title}: ${toAt + 1} of ${keys.length}`);
  };

  // ---- formatting ----
  const formatters = React.useMemo(() => {
    const out = new Map<string, (v: unknown, row: Row) => React.ReactNode>();
    for (const c of resolved) {
      if (typeof c.format === 'function') {
        out.set(c.key, c.format as (v: unknown, row: Row) => React.ReactNode);
        continue;
      }
      const opts = c.format && typeof c.format === 'object' ? c.format : undefined;
      if (c.type === 'number') {
        const nf = new Intl.NumberFormat(undefined, opts as Intl.NumberFormatOptions);
        out.set(c.key, (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? '' : nf.format(Number(v))));
      } else if (c.type === 'date') {
        const day = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC', ...(opts as Intl.DateTimeFormatOptions) });
        const at = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', ...(opts as Intl.DateTimeFormatOptions) });
        out.set(c.key, (v) => {
          if (v === null || v === undefined || v === '') return '';
          const d = v instanceof Date ? v : new Date(typeof v === 'string' && v.length === 10 ? v + 'T00:00:00Z' : (v as string | number));
          if (Number.isNaN(d.getTime())) return toText(v);
          return typeof v === 'string' && v.length === 10 ? day.format(d) : at.format(d);
        });
      } else if (c.type === 'boolean') out.set(c.key, (v) => (v === null || v === undefined ? '' : v ? 'Yes' : 'No'));
      else if (c.options) {
        const labels = new Map(optionsOf(c).map((o) => [o.value, o.label]));
        out.set(c.key, (v) => labels.get(toText(v)) ?? toText(v));
      } else out.set(c.key, (v) => toText(v));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);
  const total = (c: Col, indices: readonly number[]): React.ReactNode => {
    if (!c.aggregate) return null;
    if (typeof c.aggregate === 'function') return c.aggregate(indices.map((i) => rows[i]));
    const n = aggregate(rows, indices, c.read, c.aggregate, c.type);
    if (Number.isNaN(n)) return '';
    return c.aggregate === 'count' || c.aggregate === 'countDistinct' ? new Intl.NumberFormat().format(n) : formatters.get(c.key)!(n, {});
  };

  // ---- the grid's keyboard (interactive tables) ----
  const editableAny = resolved.some((c) => c.editable);
  const grid = virtual || selection !== 'none' || !!config.onRowAction || !!config.renderDetail || editableAny || !!groupRead || !!config.reorderableColumns || !!config.resizableColumns;
  const lead = (selection !== 'none' ? 1 : 0) + (config.renderDetail ? 1 : 0);
  const cellCount = lead + columns.length;
  React.useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    tableRef.current?.querySelector<HTMLElement>(`[data-r="${focus.r}"][data-c="${focus.c}"]`)?.focus();
  });
  const go = (r: number, c: number, from = r) => {
    let rr = Math.max(-1, Math.min(count - 1, r));
    // Detail panels are not cells: step over them in the direction of travel.
    const step = rr >= from ? 1 : -1;
    while (rr >= 0 && rr < count && entryAt(rr).kind === 'detail') rr += step;
    if (rr >= count || rr < -1) rr = from;
    const cc = Math.max(0, Math.min(cellCount - 1, c));
    setFocus({ r: rr, c: cc });
    moveFocus.current = true;
    if (rr >= 0) vr.scrollToRow(rr);
  };
  const onGridKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!grid || editing) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-c]');
    if (!target || target !== event.target) return;
    const r = Number(target.dataset.r);
    const c = Number(target.dataset.c);
    const flip = ctx.dir === 'rtl' ? -1 : 1;
    const mod = event.ctrlKey || event.metaKey;
    const col = columns[c - lead];
    const page = Math.max(1, Math.floor(((scroller.current?.clientHeight ?? 400) - headerHeight) / rowHeight) - 1);
    const key = event.key;
    let used = true;
    if (r === -1 && col && mod && event.shiftKey && (key === 'ArrowLeft' || key === 'ArrowRight') && config.reorderableColumns) {
      const dir = (key === 'ArrowRight' ? 1 : -1) * flip;
      const at = c - lead + dir;
      if (at >= 0 && at < columns.length) {
        reorder(col.key, columns[at].key, dir > 0);
        go(r, c + dir);
      }
    } else if (r === -1 && col && event.altKey && (key === 'ArrowLeft' || key === 'ArrowRight') && resizable(col)) {
      const th = target as HTMLElement;
      resizeTo(col, th.offsetWidth + (key === 'ArrowRight' ? 16 : -16) * flip, snapshotWidths());
    } else if (key === 'ArrowRight') go(r, c + flip);
    else if (key === 'ArrowLeft') go(r, c - flip);
    else if (key === 'ArrowDown') go(r + 1, c, r);
    else if (key === 'ArrowUp') go(r - 1, c, r);
    else if (key === 'Home') go(mod ? 0 : r, 0);
    else if (key === 'End') go(mod ? count - 1 : r, cellCount - 1);
    else if (key === 'PageDown') go(r + page, c);
    else if (key === 'PageUp') go(Math.max(0, r - page), c);
    else if (r === -1 && col && (key === 'Enter' || key === ' ') && sortable(col)) setSort(nextSorts(sorts, col.key, event.shiftKey && config.multiSort !== false));
    else if (r >= 0) {
      const e = entryAt(r);
      const row = rowOf(e);
      const rowKey = keyOfEntry(e);
      if (e.kind === 'group' && (key === 'Enter' || key === ' ')) setCollapsed(collapsed.includes(e.group.key) ? collapsed.filter((k) => k !== e.group.key) : [...collapsed, e.group.key]);
      else if (!row || e.kind === 'detail') used = false;
      else if (key === ' ' && selection !== 'none') toggleRow(rowKey, (e as { pos: number }).pos, event.shiftKey);
      else if ((key === 'Enter' || key === 'F2') && col && col.editable && config.onCellEdit) startEdit(row, col, rowKey);
      else if (key === 'Enter' && config.renderDetail && c < lead) setExpanded(expanded.includes(rowKey) ? expanded.filter((k) => k !== rowKey) : [...expanded, rowKey]);
      else if (key === 'Enter' && config.onRowAction) config.onRowAction(row, event);
      else if (mod && key.toLowerCase() === 'c' && col) void navigator.clipboard?.writeText(toText(col.read(row))).catch(() => undefined);
      else used = false;
    } else used = false;
    if (used) event.preventDefault();
  };

  // ---- state for render overrides and the root ----
  const state: TableState = { variant: config.variant ?? 'card', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, density, loading: !!config.loading, sort: sorts, filters, search };
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'data-variant': state.variant,
        'data-density': density,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-striped': dataAttr(config.striped),
        'data-sticky': dataAttr(config.stickyHeader || virtual),
        'data-virtual': dataAttr(virtual),
        'data-grid': dataAttr(grid),
        'data-loading': dataAttr(state.loading),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const exportCsv = () => {
    const list = source ? [] : ordered;
    return toCsv(rows, list, columns.map((c) => ({ header: c.title, value: c.read })));
  };
  const downloadCsv = (name?: string) => {
    const file = name ?? (typeof config.toolbar === 'object' && typeof config.toolbar.export === 'string' ? config.toolbar.export : `${typeof config.label === 'string' ? config.label : 'table'}.csv`);
    const url = URL.createObjectURL(new Blob([exportCsv()], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = file.endsWith('.csv') ? file : `${file}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const render = (rootProps?: TableRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: TableSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-table__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('table', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-table', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const name = typeof config.label === 'string' ? config.label : 'Table';
    const tabFor = (r: number, c: number) => (grid ? (focus.r === r && focus.c === c ? 0 : -1) : undefined);
    const cellNav = (r: number, c: number) => (grid ? { 'data-r': r, 'data-c': c, tabIndex: tabFor(r, c), onFocus: () => (focus.r !== r || focus.c !== c) && setFocus({ r, c }) } : {});

    // Pinned columns stick: start ones after the utility columns, end ones from the end.
    const widths = columns.map((c) => widthOf(c) ?? (pins[c.key] ? 160 : 0));
    const offsets = pinOffsets(widths, columns.map((c) => pins[c.key]));
    const anyStart = columns.some((c) => pins[c.key] === 'start');
    const leadWidth = (selection !== 'none' ? 44 : 0) + (config.renderDetail ? 40 : 0);
    const stick = (c: Col, i: number): React.CSSProperties | undefined => {
      const pin = pins[c.key];
      if (!pin) return undefined;
      return pin === 'start' ? { insetInlineStart: offsets[i]! + leadWidth } : { insetInlineEnd: offsets[i]! };
    };
    const fixed = virtual || !!config.resizableColumns || columns.some((c) => pins[c.key] || widthOf(c) !== undefined || typeof c.width === 'string');
    const known = widths.reduce((a, w) => a + w, 0) + leadWidth;
    const allKnown = columns.every((c) => widthOf(c) !== undefined);
    const tableStyle: React.CSSProperties | undefined = fixed ? { tableLayout: 'fixed', inlineSize: allKnown ? known : '100%', minInlineSize: known + columns.filter((c) => widthOf(c) === undefined).length * 120 } : undefined;
    const lastPinStart = columns.reduce((at, c, i) => (pins[c.key] === 'start' ? i : at), -1);
    const firstPinEnd = columns.findIndex((c) => pins[c.key] === 'end');
    const pinAttrs = (c: Col, i: number) => ({ 'data-pinned': pins[c.key], 'data-pin-edge': dataAttr(i === lastPinStart || i === firstPinEnd), style: stick(c, i) });
    const leadPin = anyStart ? { 'data-pinned': 'start' } : {};

    // ---- toolbar ----
    const tb = config.toolbar === true ? { search: true, columns: true } : config.toolbar || null;
    const toolbar = tb
      ? slot(
          'toolbar',
          <>
            {tb.search !== false
              ? slot('search', null, PausedInput as unknown as string, {
                  type: 'search',
                  'aria-label': L.search ?? 'Search',
                  placeholder: L.search ?? 'Search',
                  value: search,
                  onCommit: setSearch,
                })
              : null}
            <span className={cls('pinfold-table__tools')}>
              {tb.columns !== false ? (
                <details className={cls('pinfold-table__columns')}>
                  <summary>{L.columns ?? 'Columns'}</summary>
                  <div role="group" aria-label={L.columns ?? 'Columns'} className={cls('pinfold-table__columnsPanel')}>
                    {resolved.map((c) => (
                      <div key={c.key} className={cls('pinfold-table__columnRow')}>
                        <label>
                          <input
                            type="checkbox"
                            checked={!hidden.has(c.key)}
                            disabled={c.hideable === false || (!hidden.has(c.key) && columns.length === 1)}
                            onChange={(e) => {
                              const next = new Set(hidden);
                              if (e.target.checked) next.delete(c.key);
                              else next.add(c.key);
                              setColState({ ...colState, hidden: [...next] });
                            }}
                          />
                          {c.title}
                        </label>
                        <select aria-label={`Pin ${c.title}`} value={pins[c.key] ?? ''} onChange={(e) => setColState({ ...colState, pinned: { ...(colState.pinned ?? {}), [c.key]: (e.target.value || undefined) as 'start' | 'end' | undefined } })}>
                          <option value="">—</option>
                          <option value="start">Pin start</option>
                          <option value="end">Pin end</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
              {tb.export ? (
                <button type="button" className={cls('pinfold-table__export')} onClick={() => downloadCsv()}>
                  {L.export ?? 'Export CSV'}
                </button>
              ) : null}
            </span>
          </>,
          'div',
          { role: 'toolbar', 'aria-label': `${name} tools`, 'aria-controls': `${base}-table` },
        )
      : null;

    // ---- head ----
    const headerCells = columns.map((c, i) => {
      const at = sorts.findIndex((s) => s.key === c.key);
      const sort = at >= 0 ? sorts[at] : null;
      const filter = filters.find((f) => f.key === c.key) ?? null;
      const label = typeof c.header === 'function' ? c.header({ column: c, sort: sort ? { direction: sort.direction, index: at } : null, filter }) : c.header ?? c.title;
      const ci = lead + i;
      const indicator = sort ? (sort.direction === 'ascending' ? SORT_UP : SORT_DOWN) : SORT_BOTH;
      const press = (event: React.MouseEvent) => setSort(nextSorts(sorts, c.key, event.shiftKey && config.multiSort !== false));
      const dragProps = config.reorderableColumns
        ? {
            draggable: true,
            onDragStart: (e: React.DragEvent) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', c.key);
              dragKey.current = c.key;
              setDrag({ key: c.key });
            },
            onDragOver: (e: React.DragEvent<HTMLElement>) => {
              const from = dragKey.current;
              if (!from) return;
              e.preventDefault();
              const box = e.currentTarget.getBoundingClientRect();
              const after = (e.clientX - box.left > box.width / 2) !== (ctx.dir === 'rtl');
              if (drag?.over !== c.key || drag?.after !== after) setDrag({ key: from, over: c.key, after });
            },
            onDrop: (e: React.DragEvent<HTMLElement>) => {
              e.preventDefault();
              const from = dragKey.current;
              const box = e.currentTarget.getBoundingClientRect();
              const after = (e.clientX - box.left > box.width / 2) !== (ctx.dir === 'rtl');
              if (from) reorder(from, c.key, after);
              dragKey.current = null;
              setDrag(null);
            },
            onDragEnd: () => {
              dragKey.current = null;
              setDrag(null);
            },
            'data-drop': drag?.over === c.key && drag.key !== c.key ? (drag.after ? 'after' : 'before') : undefined,
          }
        : {};
      return (
        <React.Fragment key={c.key}>
          {slot(
            'header',
            <>
              {sortable(c)
                ? slot(
                    'sort',
                    <>
                      <span className={cls('pinfold-table__title')}>{label}</span>
                      <span className={cls('pinfold-table__sortIcon')}>{indicator}</span>
                      {sort && sorts.length > 1 ? <span className={cls('pinfold-table__sortIndex')}>{at + 1}</span> : null}
                    </>,
                    'button',
                    // A button does not start a drag by itself: it takes part in reordering explicitly.
                    { type: 'button', tabIndex: grid ? -1 : undefined, 'data-direction': sort?.direction, onClick: press, draggable: config.reorderableColumns ? true : undefined },
                  )
                : <span className={cls('pinfold-table__title')}>{label}</span>}
              {resizable(c)
                ? slot('resizer', null, 'span', {
                    role: 'separator',
                    'aria-orientation': 'vertical',
                    'aria-label': `${L.resize ?? 'Resize column'} ${c.title}`,
                    'aria-valuenow': widthOf(c),
                    'aria-valuemin': c.minWidth ?? 64,
                    'aria-valuemax': c.maxWidth,
                    // Pointer only: the keyboard resizes from the header (Alt + arrows), so the handle is a plain separator.
                    onPointerDown: onResizeStart(c),
                    onDoubleClick: () => {
                      // Fit the widest drawn cell of this column.
                      let w = 64;
                      tableRef.current?.querySelectorAll<HTMLElement>(`[data-col="${CSS.escape(c.key)}"] > *`).forEach((el) => (w = Math.max(w, el.scrollWidth + 28)));
                      resizeTo(c, w, snapshotWidths());
                    },
                    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
                      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                      e.preventDefault();
                      const th = e.currentTarget.closest('th') as HTMLElement;
                      resizeTo(c, th.offsetWidth + (e.key === 'ArrowRight' ? 16 : -16) * (ctx.dir === 'rtl' ? -1 : 1), snapshotWidths());
                    },
                  })
                : null}
            </>,
            'th',
            {
              [ITEM]: { column: c } satisfies TableItemContext<Row>,
              scope: 'col',
              'data-key': c.key,
              'data-align': c.align === 'start' ? undefined : c.align,
              'data-sorted': sort ? '' : undefined,
              'aria-sort': sort ? sort.direction : sortable(c) ? 'none' : undefined,
              ...pinAttrs(c, i),
              ...cellNav(-1, ci),
              ...dragProps,
            },
          )}
        </React.Fragment>
      );
    });
    const filterRow = columns.some(filterable) ? (
      <tr className={cls('pinfold-table__filters')}>
        {selection !== 'none' ? <td {...leadPin} className={cls('pinfold-table__select')} /> : null}
        {config.renderDetail ? <td {...leadPin} className={cls('pinfold-table__expand')} /> : null}
        {columns.map((c, i) => {
          const filter = filters.find((f) => f.key === c.key) ?? null;
          const label = L.filter ? L.filter(c.title) : `Filter ${c.title}`;
          const setter = (value: unknown, op?: GridFilterOp) => setFilter(c.key, value, op);
          return (
            <React.Fragment key={c.key}>
              {slot(
                'filter',
                !filterable(c) ? null : c.filter ? (
                  c.filter({ column: c, filter, setFilter: setter })
                ) : (
                  <FilterControl
                    type={c.type}
                    label={label}
                    filter={filter}
                    options={optionsOf(c)}
                    setFilter={setter}
                    className={cls}
                    labels={{ any: 'Any', yes: 'Yes', no: 'No', from: 'from', to: 'to', placeholder: 'Filter…' }}
                  />
                ),
                'td',
                { [ITEM]: { column: c } satisfies TableItemContext<Row>, ...pinAttrs(c, i) },
              )}
            </React.Fragment>
          );
        })}
      </tr>
    ) : null;
    const head = slot(
      'head',
      <>
        <tr aria-rowindex={virtual ? 1 : undefined}>
          {selection !== 'none' ? (
            <th scope="col" className={cls('pinfold-table__select')} {...leadPin} {...cellNav(-1, 0)}>
              {selection === 'multiple' && !source ? (
                <input
                  ref={headerBox}
                  type="checkbox"
                  tabIndex={grid ? -1 : undefined}
                  aria-label={L.selectAll ?? 'Select all rows'}
                  checked={boxState === 'all'}
                  disabled={!visibleKeys.length}
                  onChange={() => setSelected(boxState === 'all' ? selected.filter((k) => !visibleKeys.includes(k)) : [...new Set([...selected, ...visibleKeys])])}
                />
              ) : (
                <span style={VISUALLY_HIDDEN}>Select</span>
              )}
            </th>
          ) : null}
          {config.renderDetail ? (
            <th scope="col" className={cls('pinfold-table__expand')} {...leadPin} {...cellNav(-1, selection !== 'none' ? 1 : 0)}>
              <span style={VISUALLY_HIDDEN}>{L.expand ?? 'Show details'}</span>
            </th>
          ) : null}
          {headerCells}
        </tr>
        {filterRow}
      </>,
      'thead',
      { ref: thead },
    );

    // ---- body ----
    const span = cellCount;
    const drawRow = (e: Entry, r: number): React.ReactNode => {
      const height = virtual ? sizes.size(r) : undefined;
      if (e.kind === 'group') {
        const g = e.group;
        const shut = collapsed.includes(g.key);
        const value = groupCol ? formatters.get(groupCol.key)!(g.value, rows[g.indices[0]]) : toText(g.value);
        const item: TableItemContext<Row> = { group: { key: g.key, value: g.value, count: g.indices.length, collapsed: shut } };
        return (
          <React.Fragment key={`g:${g.key}`}>
            {slot(
              'group',
              <>
                {columns.map((c, i) => {
                  const first = i === 0;
                  return (
                    <td
                      key={c.key}
                      colSpan={first ? lead + 1 : undefined}
                      className={cls('pinfold-table__cell')}
                      data-align={!first && c.align !== 'start' ? c.align : undefined}
                      {...pinAttrs(c, i)}
                      {...(first ? cellNav(r, 0) : {})}
                    >
                      {first ? (
                        <button
                          type="button"
                          tabIndex={grid ? -1 : undefined}
                          className={cls('pinfold-table__groupToggle')}
                          aria-expanded={!shut}
                          onClick={() => setCollapsed(shut ? collapsed.filter((k) => k !== g.key) : [...collapsed, g.key])}
                        >
                          {CHEVRON}
                          <span>{value || '—'}</span>
                          <span className={cls('pinfold-table__groupCount')}>{g.indices.length}</span>
                        </button>
                      ) : (
                        total(c, g.indices)
                      )}
                    </td>
                  );
                })}
              </>,
              'tr',
              { [ITEM]: item, 'data-group': '', 'aria-rowindex': virtual ? r + 2 : undefined, style: height ? { blockSize: height } : undefined },
            )}
          </React.Fragment>
        );
      }
      const row = rowOf(e);
      const index = e.kind === 'remote' ? e.pos : e.index;
      const rowKey = keyOfEntry(e);
      if (e.kind === 'detail')
        return (
          <React.Fragment key={`d:${rowKey}`}>
            {slot(
              'detail',
              <td colSpan={span}>
                <div
                  className={cls('pinfold-table__detailBody')}
                  ref={(el) => {
                    // Virtual tables need the panel's real height for the rows below it.
                    if (!el || !virtual) return;
                    const h = el.offsetHeight + 1;
                    if (detailHeights[rowKey] !== h) setDetailHeights((m) => ({ ...m, [rowKey]: h }));
                  }}
                >
                  {config.renderDetail!(row as Row)}
                </div>
              </td>,
              'tr',
              { [ITEM]: { row, rowKey, rowIndex: e.pos, expanded: true } satisfies TableItemContext<Row>, id: `${base}-detail-${rowKey}`, 'aria-rowindex': virtual ? r + 2 : undefined },
            )}
          </React.Fragment>
        );
      if (!row) {
        // A server row still on its way.
        return (
          <tr key={`p:${index}`} aria-rowindex={r + 2} aria-busy="true" style={{ blockSize: height }} className={cls('pinfold-table__pending')}>
            {Array.from({ length: span }, (_, j) => (
              <td key={j} className={cls('pinfold-table__cell')}>
                {slot('loading', null, 'span')}
              </td>
            ))}
          </tr>
        );
      }
      const on = selected.includes(rowKey);
      const open = expanded.includes(rowKey);
      const pos = e.pos;
      const action = config.onRowAction;
      const ownHeight = rowHeights[source ? `#${index}` : rowKey];
      return (
        <React.Fragment key={rowKey}>
          {slot(
            'row',
            <>
              {selection !== 'none' ? (
                <td className={cls('pinfold-table__select')} {...leadPin} {...cellNav(r, 0)}>
                  <input
                    type={selection === 'single' ? 'radio' : 'checkbox'}
                    name={selection === 'single' ? `${base}-row` : undefined}
                    tabIndex={grid ? -1 : undefined}
                    aria-label={L.selectRow ? L.selectRow(toText(columns[0]?.read(row))) : `Select ${toText(columns[0]?.read(row))}`}
                    checked={on}
                    onChange={() => undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRow(rowKey, pos, event.shiftKey);
                    }}
                  />
                </td>
              ) : null}
              {config.renderDetail ? (
                <td className={cls('pinfold-table__expand')} {...leadPin} {...cellNav(r, selection !== 'none' ? 1 : 0)}>
                  {slot('expand', CHEVRON, 'button', {
                    type: 'button',
                    tabIndex: grid ? -1 : undefined,
                    'aria-label': L.expand ?? 'Show details',
                    'aria-expanded': open,
                    'aria-controls': open ? `${base}-detail-${rowKey}` : undefined,
                    onClick: (event: React.MouseEvent) => {
                      event.stopPropagation();
                      setExpanded(open ? expanded.filter((k) => k !== rowKey) : [...expanded, rowKey]);
                    },
                  })}
                </td>
              ) : null}
              {columns.map((c, i) => {
                const value = c.read(row);
                const formatted = formatters.get(c.key)!(value, row);
                const isEditing = editing?.rowKey === rowKey && editing.key === c.key;
                const can = !!config.onCellEdit && (typeof c.editable === 'function' ? c.editable(row) : !!c.editable);
                const errorId = `${base}-edit-error`;
                let content: React.ReactNode;
                if (isEditing) {
                  const commit = (v: unknown) => commitEdit(row, c, rowKey, v);
                  const cancel = () => {
                    setEditing(null);
                    setEditError(null);
                    moveFocus.current = true;
                  };
                  content = (
                    <>
                      {typeof c.editor === 'function'
                        ? c.editor({ row, value, column: c, commit, cancel, error: editError })
                        : slot(
                            'editor',
                            <CellEditor type={c.type} editor={c.editor} label={`${c.title}`} value={value} options={optionsOf(c)} error={editError} errorId={errorId} commit={commit} cancel={cancel} className={cls('pinfold-table__editorInput')} />,
                            'span',
                          )}
                      {editError ? (
                        <span id={errorId} role="alert" className={cls('pinfold-table__editError')}>
                          {editError}
                        </span>
                      ) : null}
                    </>
                  );
                } else content = c.cell ? c.cell({ row, value, formatted, rowKey, rowIndex: pos, column: c, selected: on, edit: () => startEdit(row, c, rowKey) }) : formatted;
                const extra = typeof c.className === 'function' ? c.className(row) : c.className;
                return (
                  <React.Fragment key={c.key}>
                    {slot(
                      'cell',
                      <>
                        {content}
                        {config.resizableRows && i === 0 ? (
                          <span
                            aria-hidden="true"
                            className={cls('pinfold-table__rowResizer')}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const tr = (event.currentTarget as HTMLElement).closest('tr') as HTMLElement;
                              const startY = event.clientY;
                              const startH = tr.offsetHeight;
                              const handle = event.currentTarget as HTMLElement;
                              handle.setPointerCapture?.(event.pointerId);
                              const k = source ? `#${index}` : rowKey;
                              const move = (ev: PointerEvent) => setRowHeights((m) => ({ ...m, [k]: Math.max(rowHeight * 0.75, Math.round(startH + ev.clientY - startY)) }));
                              const up = () => {
                                handle.removeEventListener('pointermove', move);
                                handle.removeEventListener('pointerup', up);
                              };
                              handle.addEventListener('pointermove', move);
                              handle.addEventListener('pointerup', up);
                            }}
                          />
                        ) : null}
                      </>,
                      'td',
                      {
                        [ITEM]: { row, rowKey, rowIndex: pos, column: c, value, selected: on } satisfies TableItemContext<Row>,
                        className: cn(cls('pinfold-table__cell'), extra),
                        'data-col': c.key,
                        'data-align': c.align === 'start' ? undefined : c.align,
                        'data-editable': dataAttr(can),
                        'data-editing': dataAttr(isEditing),
                        ...pinAttrs(c, i),
                        ...cellNav(r, lead + i),
                        onDoubleClick: can ? () => startEdit(row, c, rowKey) : undefined,
                      },
                    )}
                  </React.Fragment>
                );
              })}
            </>,
            'tr',
            {
              [ITEM]: { row, rowKey, rowIndex: pos, selected: on, expanded: open } satisfies TableItemContext<Row>,
              className: cn(cls('pinfold-table__row'), config.rowClassName?.(row, pos)),
              'aria-selected': selection === 'none' ? undefined : on,
              'aria-rowindex': virtual ? r + 2 : undefined,
              'data-selected': dataAttr(on),
              'data-expanded': dataAttr(open),
              style: ownHeight || height ? { blockSize: ownHeight ?? height } : undefined,
              ...(action
                ? {
                    'data-action': '',
                    tabIndex: grid ? undefined : 0,
                    onClick: (event: React.MouseEvent) => {
                      if ((event.target as HTMLElement).closest('button, input, select, a, [data-editing]')) return;
                      action(row, event);
                    },
                    onKeyDown: grid
                      ? undefined
                      : (event: React.KeyboardEvent) => {
                          if (event.key === 'Enter' && event.target === event.currentTarget) action(row, event);
                        },
                  }
                : null),
            },
          )}
        </React.Fragment>
      );
    };
    let bodyRows: React.ReactNode;
    if (!count && config.loading)
      bodyRows = Array.from({ length: Math.min(pageSize || 5, 5) }, (_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: span }, (_, j) => (
            <td key={j} className={cls('pinfold-table__cell')}>
              {slot('loading', null, 'span')}
            </td>
          ))}
        </tr>
      ));
    else if (!count)
      bodyRows = (
        <tr>
          {slot('empty', config.emptyText ?? 'Nothing to show', 'td', { colSpan: span })}
        </tr>
      );
    else {
      const list: React.ReactNode[] = [];
      for (let r = start; r < end; r++) list.push(drawRow(entryAt(r), r));
      const spacer = (h: number, key: string) => (h > 0 ? <tr key={key} aria-hidden="true" className={cls('pinfold-table__spacer')} style={{ blockSize: h }}><td colSpan={span} /></tr> : null);
      bodyRows = (
        <>
          {win ? spacer(win.before, 'before') : null}
          {list}
          {win ? spacer(win.after, 'after') : null}
        </>
      );
    }
    const totals = columns.some((c) => c.aggregate) && !source ? (
      slot(
        'totals',
        <tr>
          {lead ? <td colSpan={lead} {...leadPin} /> : null}
          {columns.map((c, i) => (
            <td key={c.key} className={cls('pinfold-table__cell')} data-align={c.align === 'start' ? undefined : c.align} {...pinAttrs(c, i)}>
              {total(c, ordered)}
            </td>
          ))}
        </tr>,
        'tfoot',
      )
    ) : null;

    // ---- footer: pages, page size, the range ----
    const rowTotal = source ? srcCount : config.total ?? ordered.length;
    const fmtN = new Intl.NumberFormat();
    const from = pageSize > 0 && !virtual ? (current - 1) * pageSize + 1 : 1;
    const to = pageSize > 0 && !virtual ? Math.min(rowTotal, current * pageSize) : rowTotal;
    const rangeText = L.range ? L.range(from, to, rowTotal) : virtual ? `${fmtN.format(rowTotal)} rows` : `${fmtN.format(rowTotal ? from : 0)}–${fmtN.format(to)} of ${fmtN.format(rowTotal)}`;
    const showFooter = (pageSize > 0 && !virtual) || virtual || !!config.pageSizes;
    const footer = showFooter
      ? slot(
          'footer',
          <>
            <span className={cls('pinfold-table__info')} aria-live="polite">
              {rangeText}
            </span>
            {config.pageSizes && !virtual ? (
              <label className={cls('pinfold-table__pageSize')}>
                <span>{L.pageSize ?? 'Rows per page'}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setPicked({ size: n, from: config.pageSize });
                    config.onPageSizeChange?.(n);
                    setPage(1);
                  }}
                >
                  {config.pageSizes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {pageSize > 0 && !virtual && pageCount > 1 ? (
              <Pagination
                count={pageCount}
                page={current}
                size="sm"
                variant="ghost"
                tone={state.tone}
                loading={state.loading}
                label={`${name} pages`}
                onChange={(p) => setPage(p)}
              />
            ) : null}
          </>,
          'div',
        )
      : null;

    const content = (
      <>
        {toolbar}
        {slot(
          'scroll',
          slot(
            'table',
            <>
              {slot('caption', config.label, 'caption', config.hideLabel ? { style: VISUALLY_HIDDEN } : {})}
              {fixed ? (
                <colgroup>
                  {selection !== 'none' ? <col style={{ inlineSize: 44 }} /> : null}
                  {config.renderDetail ? <col style={{ inlineSize: 40 }} /> : null}
                  {columns.map((c) => (
                    <col key={c.key} style={{ inlineSize: px(widthOf(c) ?? (pins[c.key] ? 160 : typeof c.width === 'string' ? c.width : TYPE_WIDTH[c.type])) }} />
                  ))}
                </colgroup>
              ) : null}
              {head}
              {slot('body', bodyRows, 'tbody')}
              {totals}
            </>,
            'table',
            {
              ref: tableRef,
              id: `${base}-table`,
              role: grid ? 'grid' : undefined,
              style: tableStyle,
              'aria-busy': state.loading || undefined,
              'aria-rowcount': virtual || config.total !== undefined ? rowTotal + 1 : undefined,
              'aria-colcount': grid ? cellCount : undefined,
              'aria-multiselectable': grid && selection === 'multiple' ? true : undefined,
              onKeyDown: onGridKey,
            },
          ),
          'div',
          // Scrolls on its own when wider (or, virtual, taller) than its box; a keyboard user can reach it.
          { ref: scroller, tabIndex: grid ? undefined : 0, role: 'region', 'aria-label': name },
        )}
        {footer}
        <span role="status" style={VISUALLY_HIDDEN}>
          {announce}
        </span>
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TableApi = {
    visibleRows: source ? [] : onPage.map((i) => rows[i]),
    filteredRows: source ? [] : ordered.map((i) => rows[i]),
    sort: sorts,
    filters,
    search,
    selected,
    columnState: colState,
    setSort: (s) => setSort(asSorts(s)),
    setFilters: (f) => setFilters(f),
    setFilter,
    setSearch,
    setSelected: (k) => setSelected([...k]),
    setColumnState: setColState,
    exportCsv,
    downloadCsv,
    scrollToRow: (i) => vr.scrollToRow(i),
    getRootProps,
    render,
  };
  return usePinfoldComponent<TableApi, TableRootProps>('Table', api, (props) => render(props));
}
