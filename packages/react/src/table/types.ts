import type * as React from 'react';
import type { GridAggregate, GridColumnType, GridFilter, GridFilterOp, Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption, TableSort } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type { TableSort, GridFilter as TableFilter, GridFilterOp as TableFilterOp, GridColumnType as TableColumnType, GridAggregate as TableAggregate } from '@pinfold/core';

export type TableSlot =
  | 'root'
  | 'toolbar'
  | 'search'
  | 'caption'
  | 'scroll'
  | 'table'
  | 'head'
  | 'header'
  | 'sort'
  | 'resizer'
  | 'filters'
  | 'filter'
  | 'body'
  | 'row'
  | 'cell'
  | 'select'
  | 'expand'
  | 'detail'
  | 'group'
  | 'editor'
  | 'empty'
  | 'loading'
  | 'totals'
  | 'footer';
export type TableVariant = 'card' | 'plain' | 'outline';
export type TableDensity = 'compact' | 'normal' | 'relaxed';

type Prim = string | number | boolean | bigint | symbol | null | undefined | Date | ((...a: any[]) => any);
/** Dotted paths into a row, three levels deep: `'customer'`, `'customer.name'`, `'customer.address.city'`. */
export type TablePath<T, Depth extends unknown[] = []> = [T] extends [never]
  ? string
  : T extends Prim
  ? never
  : T extends ReadonlyArray<unknown>
    ? never
    : {
        [K in Extract<keyof T, string>]: Depth['length'] extends 2 ? K : NonNullable<T[K]> extends Prim | ReadonlyArray<unknown> ? K : K | `${K}.${TablePath<NonNullable<T[K]>, [...Depth, 0]>}`;
      }[Extract<keyof T, string>];

/** What a cell renderer gets. */
export interface TableCellContext<T> {
  row: T;
  /** The cell's value (from `value`, else the key's path). */
  value: unknown;
  /** The value shown by default: formatted for its type. */
  formatted: React.ReactNode;
  rowKey: string;
  /** Position in the current order (after filters and sorting), from 0. */
  rowIndex: number;
  column: TableResolvedColumn<T>;
  selected: boolean;
  /** Open this cell's editor (an editable column). */
  edit: () => void;
}

/** What a header renderer gets. */
export interface TableHeaderContext<T> {
  column: TableResolvedColumn<T>;
  /** This column's sort, if it sorts the rows; `index` is its place among several. */
  sort: { direction: 'ascending' | 'descending'; index: number } | null;
  /** This column's filter, if any. */
  filter: GridFilter | null;
}

/** What a custom filter control gets. */
export interface TableFilterContext<T> {
  column: TableResolvedColumn<T>;
  filter: GridFilter | null;
  /** Set this column's filter; `undefined` clears it. `op` defaults to the type's usual one. */
  setFilter: (value: unknown, op?: GridFilterOp) => void;
}

/** What a custom cell editor gets. */
export interface TableEditorContext<T> {
  row: T;
  value: unknown;
  column: TableResolvedColumn<T>;
  /** Save a value (runs `validate`, then `onCellEdit`). */
  commit: (value: unknown) => void;
  cancel: () => void;
  /** The last validation message, if any. */
  error: string | null;
}

/** One column. A key alone is a column of that key (dotted paths reach into objects). */
export interface TableColumn<T> {
  /** The value's path in a row (`'total'`, `'customer.name'`), or any id when `value` reads it. */
  key: TablePath<T> | (string & {});
  /** Default the key made readable ("dueDate" reads "Due date"). A node, or a function of the header's state. */
  header?: React.ReactNode | ((ctx: TableHeaderContext<T>) => React.ReactNode);
  /** Read the value yourself: a computed column, or a field deep in an object. */
  value?: (row: T) => unknown;
  /** Your own cell: any component. Default the value, formatted for its type. */
  cell?: (ctx: TableCellContext<T>) => React.ReactNode;
  /** How the column compares, filters and edits. Default from its values. */
  type?: GridColumnType;
  /** Numbers and dates: `Intl` options (`{ style: 'currency', currency: 'EUR' }`); or `(value, row) => node`. */
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | ((value: unknown, row: T) => React.ReactNode);
  /** The values an `enum` column can hold: its filter list and its editor's choices. */
  options?: ReadonlyArray<string | { value: string; label?: string }>;
  /** Default the table's `sortable`. */
  sortable?: boolean;
  /** Your own order (ascending). */
  compare?: (a: T, b: T) => number;
  /** Default the table's `filterable`. */
  filterable?: boolean;
  /** Your own filter rule: `(row, filter) => boolean`. */
  filterFn?: (row: T, filter: GridFilter) => boolean;
  /** Your own filter control in the filter row. */
  filter?: (ctx: TableFilterContext<T>) => React.ReactNode;
  /** Searched by the quick search. @default true */
  searchable?: boolean;
  /** A number is px; a string is any CSS width. */
  width?: number | string;
  /** @default 64 */
  minWidth?: number;
  maxWidth?: number;
  /** Default the table's `resizableColumns`. */
  resizable?: boolean;
  /** Stays in view while the rest scrolls sideways. */
  pinned?: 'start' | 'end';
  /** Starts hidden (people can show it from the columns menu). */
  hidden?: boolean;
  /** Can be hidden from the columns menu. @default true */
  hideable?: boolean;
  /** @default 'start' ('end' for numbers) */
  align?: 'start' | 'center' | 'end';
  /** Cells can be edited (double-click, Enter or F2): needs the table's `onCellEdit`. */
  editable?: boolean | ((row: T) => boolean);
  /** The editor: by type by default, or your own component. */
  editor?: 'text' | 'number' | 'date' | 'select' | 'checkbox' | ((ctx: TableEditorContext<T>) => React.ReactNode);
  /** A message when an edited value is wrong; nothing when it is fine. */
  validate?: (value: unknown, row: T) => string | null | undefined | void;
  /** A total in the footer and in each group's row: a function, or your own `(rows) => node`. */
  aggregate?: GridAggregate | ((rows: readonly T[]) => React.ReactNode);
  /** A class on each of the column's cells, or per row. */
  className?: string | ((row: T) => string | undefined);
}

/** A column with every default filled in: what renderers get. */
export interface TableResolvedColumn<T> extends Omit<TableColumn<T>, 'key' | 'type' | 'align'> {
  key: string;
  type: GridColumnType;
  align: 'start' | 'center' | 'end';
  /** The header as text (for labels, the columns menu and CSV). */
  title: string;
  read: (row: T) => unknown;
}

/** Widths, order, hidden and pinned columns: what people change, what `autoSaveId` keeps. */
export interface TableColumnState {
  order?: readonly string[];
  /** px per column key. */
  widths?: Readonly<Record<string, number>>;
  hidden?: readonly string[];
  pinned?: Readonly<Record<string, 'start' | 'end' | undefined>>;
}

/** Rows from your server, a block at a time, for any number of rows (billions included). */
export interface TableDataSource<T> {
  /** How many rows match. A fetch may update it (`{ rows, rowCount }`). */
  rowCount: number;
  /**
   * Rows `start` to `end` (end excluded) in the given order and filters. Return them, or a promise.
   * Aborted when the request is no longer needed (scrolled past, sort or filters changed).
   */
  getRows: (request: { start: number; end: number; sort: TableSort[]; filters: GridFilter[]; search: string; signal: AbortSignal }) =>
    | readonly T[]
    | { rows: readonly T[]; rowCount?: number }
    | Promise<readonly T[] | { rows: readonly T[]; rowCount?: number }>;
  /** Rows per request. @default 100 */
  blockSize?: number;
}

/** A cell edit, for `onCellEdit`. */
export interface TableCellEdit<T> {
  row: T;
  rowKey: string;
  key: string;
  value: unknown;
  previous: unknown;
}

/** The toolbar above the table. */
export interface TableToolbar {
  /** A quick search over every searchable column. @default true */
  search?: boolean;
  /** A menu to show and hide columns. @default true */
  columns?: boolean;
  /** A button that downloads the rows as CSV; a string names the file. @default false */
  export?: boolean | string;
}

/** Text read and shown, for translation. */
export interface TableLabels {
  /** @default 'Select all rows' */
  selectAll?: string;
  /** Each row's box, from its first column's text. Default "Select <text>". */
  selectRow?: (text: string) => string;
  /** @default 'Search' */
  search?: string;
  /** @default 'Columns' */
  columns?: string;
  /** @default 'Export CSV' */
  export?: string;
  /** Each filter control. Default "Filter <header>". */
  filter?: (header: string) => string;
  /** @default 'Show details' */
  expand?: string;
  /** @default 'Resize column' */
  resize?: string;
  /** @default 'Rows per page' */
  pageSize?: string;
  /** A cell edit was refused. @default 'Not saved' */
  notSaved?: string;
  /** "1–25 of 1,204". */
  range?: (from: number, to: number, total: number) => string;
}

/** Passed to slot `render` overrides. */
export interface TableState {
  variant: TableVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  density: TableDensity;
  loading: boolean;
  sort: readonly TableSort[];
  filters: readonly GridFilter[];
  search: string;
}

/** The repeating part a `render` override is drawing: a row, a cell or a header. */
export interface TableItemContext<T = unknown> {
  row?: T;
  rowKey?: string;
  rowIndex?: number;
  column?: TableResolvedColumn<T>;
  value?: unknown;
  selected?: boolean;
  expanded?: boolean;
  /** Group rows: the shared value and the rows under it. */
  group?: { key: string; value: unknown; count: number; collapsed: boolean };
}

export interface TableDimensions {
  /** Tallest the body gets before it scrolls under a sticky header. */
  maxHeight?: Length;
  /** A fixed height (a virtual table needs one: this, or `maxHeight`). */
  height?: Length;
}

/**
 *   const Grid = defineTable({ striped: true });
 *   <Grid label="Invoices" rows={invoices} columns={['id', 'customer.name', { key: 'amount', type: 'number', aggregate: 'sum' }]} sortable filterable pageSize={25} />
 *   <Grid label="Events" dataSource={{ rowCount: 1_000_000_000, getRows }} columns={columns} dimensions={{ height: 560 }} />
 */
export interface TableConfig<T extends object = Record<string, unknown>> extends SlotOverrides<TableSlot, TableState, TableItemContext<T>> {
  /** Names the table (its caption). */
  label: React.ReactNode;
  /** Keep the caption for screen readers only. @default false */
  hideLabel?: boolean;
  /** The rows: your data, sorted, filtered and paged in the browser. */
  rows?: readonly T[];
  /** Or rows from your server, a block at a time (the table scrolls virtually). */
  dataSource?: TableDataSource<T>;
  /** The columns: keys or paths, or `{ key, header, cell, type, ... }`. Default every key of the first row. */
  columns?: ReadonlyArray<TableColumn<T> | TablePath<T>>;
  /** A row's stable id: a key, or `(row) => string`. Default `id`, else the position. */
  rowKey?: TablePath<T> | ((row: T, index: number) => string);

  /** Every column sorts from its header (a column's `sortable` wins). @default false */
  sortable?: boolean;
  /** The sort, controlled: one key or several in order; `null` or `[]` for none. */
  sort?: TableSort | readonly TableSort[] | null;
  defaultSort?: TableSort | readonly TableSort[];
  /** A header was pressed (Shift adds a key). */
  onSortChange?: (sort: TableSort[]) => void;
  /** Shift + press sorts by several columns. @default true */
  multiSort?: boolean;
  /** Rows come sorted from your server: the table only shows the sort. @default false */
  manualSort?: boolean;

  /** A filter row under the headers, every column filtering by its type (a column's `filterable` wins). @default false */
  filterable?: boolean;
  /** The filters, controlled. */
  filters?: readonly GridFilter[];
  defaultFilters?: readonly GridFilter[];
  onFiltersChange?: (filters: GridFilter[]) => void;
  /** Rows pass every filter, or any. @default 'and' */
  filterLogic?: 'and' | 'or';
  /** Rows come filtered from your server: the table only shows the filters. @default false */
  manualFilter?: boolean;
  /** The quick search, controlled. */
  search?: string;
  /** @default '' */
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /** A toolbar over the table: search, a columns menu, CSV export. `true` for search and columns. */
  toolbar?: boolean | TableToolbar;

  /** Rows per page: the table pages its rows and shows Pagination under them. */
  pageSize?: number;
  /** Page sizes people can choose from. */
  pageSizes?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  page?: number;
  /** @default 1 */
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Rows come one page at a time from your server: how many there are in all. */
  total?: number;

  /** Only the rows in view are drawn, so a list of any length scrolls smoothly (needs a height). @default false */
  virtual?: boolean;
  /** Row height in px (virtual tables). Default by density: 36, 44, 52. */
  rowHeight?: number;

  /** Column edges drag to resize (a column's `resizable` wins). @default false */
  resizableColumns?: boolean;
  /** Headers drag to reorder columns (also Ctrl or Cmd + Shift + arrow on a header). @default false */
  reorderableColumns?: boolean;
  /** Row bottoms drag to resize. @default false */
  resizableRows?: boolean;
  /** Widths, order, hidden and pinned columns, controlled. */
  columnState?: TableColumnState;
  defaultColumnState?: TableColumnState;
  onColumnStateChange?: (state: TableColumnState) => void;
  /** Remember column state, sort and filters in this browser under this id. */
  autoSaveId?: string;

  /** Rows can be chosen: checkboxes, one or several (Shift picks a span). @default 'none' */
  selection?: 'none' | 'single' | 'multiple';
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectionChange?: (keys: string[]) => void;

  /** A row opens a panel under it: your component. */
  renderDetail?: (row: T) => React.ReactNode;
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (keys: string[]) => void;

  /** Rows grouped by a column's value, a header row per group with its totals. */
  groupBy?: TablePath<T> | (string & {});

  /** A cell was edited: save it to your rows. Return `false` (or reject) to keep the editor open. */
  onCellEdit?: (edit: TableCellEdit<T>) => void | boolean | Promise<void | boolean>;

  /** A row was activated (click, or Enter on a focused row). */
  onRowAction?: (row: T, event: React.SyntheticEvent) => void;
  /** A class for a row, from its data. */
  rowClassName?: (row: T, index: number) => string | undefined;

  /** Rows are being fetched: shimmering rows while there are none, the table busy. @default false */
  loading?: boolean;
  /** @default 'Nothing to show' */
  emptyText?: React.ReactNode;
  labels?: TableLabels;
  /** @default 'card' */
  variant?: TableVariant;
  /** @default 'normal' */
  density?: TableDensity;
  /** @default false */
  striped?: boolean;
  /** The header stays while the body scrolls (with a height). @default false */
  stickyHeader?: boolean;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: TableDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TableRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type TableTagProps<T extends object = Record<string, unknown>> = TableConfig<T> & Omit<TableRootProps, keyof TableConfig>;

export interface TableApi {
  /** The rows on screen: filtered, sorted, the current page (client rows). */
  visibleRows: readonly object[];
  /** Every row that passes the filters and search, in order (client rows). */
  filteredRows: readonly object[];
  sort: readonly TableSort[];
  filters: readonly GridFilter[];
  search: string;
  selected: readonly string[];
  columnState: TableColumnState;
  setSort: (sort: TableSort | readonly TableSort[] | null) => void;
  setFilters: (filters: readonly GridFilter[]) => void;
  /** Set or clear (`undefined`) one column's filter. */
  setFilter: (key: string, value: unknown, op?: GridFilterOp) => void;
  setSearch: (search: string) => void;
  setSelected: (keys: readonly string[]) => void;
  setColumnState: (state: TableColumnState) => void;
  /** The filtered, sorted rows as CSV (visible columns). */
  exportCsv: () => string;
  /** Download that CSV. */
  downloadCsv: (fileName?: string) => void;
  /** Scroll a row (its position in the current order) into view. */
  scrollToRow: (index: number) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TableRootProps) => React.ReactElement;
}
export type TableComponent = PinfoldComponent<TableApi, TableRootProps>;
