/** Table rules, framework-free: sorting, the sort cycle, selection. */

export type SortDirection = 'ascending' | 'descending';
export interface TableSort {
  key: string;
  direction: SortDirection;
}

const collator = typeof Intl !== 'undefined' ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;

/** Compare two cell values: numbers and dates by value, text by the reader's language (with numbers inside text in order: "Item 2" before "Item 10"). Empty values last. */
export function compareValues(a: unknown, b: unknown): number {
  const empty = (v: unknown) => v === null || v === undefined || v === '';
  if (empty(a) || empty(b)) return empty(a) && empty(b) ? 0 : empty(a) ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator ? collator.compare(String(a), String(b)) : String(a).localeCompare(String(b));
}

/** The rows sorted by a key, stable (equal rows keep their order); a column's own compare wins. */
export function sortRows<T>(rows: readonly T[], sort: TableSort | null | undefined, compare?: (a: T, b: T) => number): T[] {
  if (!sort) return [...rows];
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i }))
    .sort((x, y) => (compare ? compare(x.row, y.row) : compareValues((x.row as Record<string, unknown>)[sort.key], (y.row as Record<string, unknown>)[sort.key])) * sign || x.i - y.i)
    .map(({ row }) => row);
}

/** A header press: ascending, then descending, then unsorted (the original order). */
export function nextSort(current: TableSort | null | undefined, key: string): TableSort | null {
  if (!current || current.key !== key) return { key, direction: 'ascending' };
  return current.direction === 'ascending' ? { key, direction: 'descending' } : null;
}

/** The header box's state from what is selected on the page: all, some or none. */
export function selectionState(selected: readonly string[], keys: readonly string[]): 'all' | 'some' | 'none' {
  const on = keys.filter((k) => selected.includes(k)).length;
  return on === 0 ? 'none' : on === keys.length ? 'all' : 'some';
}

/** "Invoice id" from "invoiceId" or "invoice_id": a header from a key. */
export function headerFromKey(key: string): string {
  const words = key.replace(/[_-]+/g, ' ').replace(/([a-z\d])([A-Z])/g, '$1 $2').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface TableRules {
  selection?: string;
  pageSize?: number;
  total?: number;
  virtual?: boolean;
  dataSource?: unknown;
  sortable?: boolean;
  filterable?: boolean;
  columns?: ReadonlyArray<unknown>;
  renderDetail?: unknown;
  subTable?: unknown;
  getSubRows?: unknown;
  groupBy?: string | null;
  filterMode?: string;
  reorderableRows?: boolean;
  onRowReorder?: unknown;
  toolbar?: unknown;
}

/** Options with no visible effect in the current config. */
export function inactiveTableOptions(config: TableRules): Record<string, string> {
  const out: Record<string, string> = {};
  const cols = (config.columns ?? []).filter((c): c is Record<string, unknown> => !!c && typeof c === 'object');
  const virtual = !!(config.virtual || config.dataSource);
  if (!config.selection || config.selection === 'none') {
    const why = 'only used with `selection`.';
    Object.assign(out, { selected: why, defaultSelected: why, onSelectionChange: why });
  }
  if (config.pageSize === undefined || virtual) {
    const why = virtual ? 'a virtual table scrolls instead of paging.' : 'only used with `pageSize`.';
    Object.assign(out, { page: why, defaultPage: why, onPageChange: why, total: why, pageSizes: why, onPageSizeChange: why });
  }
  if (!config.sortable && !cols.some((c) => c.sortable)) {
    const why = 'no column sorts (`sortable`).';
    Object.assign(out, { multiSort: why });
  }
  if (!config.filterable && !cols.some((c) => c.filterable)) {
    out.filterLogic = 'no column filters (`filterable`); set `filters` for filters of your own.';
    out.filterMode = 'no column filters (`filterable`).';
  }
  if (!virtual) out.rowHeight = 'only for a virtual table (rows size to their content otherwise).';
  if (!config.renderDetail && !config.subTable && !config.getSubRows) {
    const why = 'no row opens (`renderDetail`, `subTable` or `getSubRows`).';
    Object.assign(out, { expanded: why, defaultExpanded: why, onExpandedChange: why, expandIcon: why });
  }
  if (config.getSubRows) {
    const why = 'tree rows keep their own order of parents and children.';
    Object.assign(out, { groupBy: why, defaultGroupBy: why, groupable: why, reorderableRows: why });
  }
  if (config.reorderableRows && !config.onRowReorder) out.reorderableRows = 'needs `onRowReorder` to save the new order.';
  if (!config.reorderableRows) out.onRowReorder = 'only used with `reorderableRows`.';
  if (config.dataSource) {
    const why = 'a data source sorts, filters and groups on your server.';
    Object.assign(out, { groupBy: why, defaultGroupBy: why, groupable: why, manualSort: why, manualFilter: why, rows: 'the rows come from `dataSource`.', getSubRows: 'a data source sends flat blocks of rows.', reorderableRows: 'the order is your server\'s.' });
  }
  return out;
}
