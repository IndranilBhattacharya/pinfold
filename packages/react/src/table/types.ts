import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, TableSort } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type { TableSort } from '@pinfold/core';
export type TableSlot = 'root' | 'caption' | 'scroll' | 'table' | 'head' | 'header' | 'sort' | 'body' | 'row' | 'cell' | 'select' | 'empty' | 'loading' | 'footer';
export type TableVariant = 'card' | 'plain' | 'outline';
type Key<T> = Extract<keyof T, string>;

/** One column. A key alone is a column of that key, headed by the key made readable. */
export interface TableColumn<T> {
  key: Key<T>;
  /** Default the key made readable ("dueDate" reads "Due date"). */
  header?: React.ReactNode;
  /** What the cell shows. Default the value as text. */
  cell?: (row: T, index: number) => React.ReactNode;
  /** The header sorts the rows. */
  sortable?: boolean;
  /** Your own order for this column (ascending). Default numbers by value, text naturally. */
  compare?: (a: T, b: T) => number;
  /** @default 'start' */
  align?: 'start' | 'center' | 'end';
  width?: Length;
}

/** Text read and shown, for translation. */
export interface TableLabels {
  /** @default 'Select all rows on this page' */
  selectAll?: string;
  /** Each row's box, from its first column's text. Default "Select <text>". */
  selectRow?: (text: string) => string;
}

/** Passed to slot `render` overrides. */
export interface TableState {
  variant: TableVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  density: 'compact' | 'normal' | 'relaxed';
  loading: boolean;
  sort: TableSort | null;
}

export interface TableDimensions {
  /** Tallest the body gets before it scrolls under a sticky header. */
  maxHeight?: Length;
}

/**
 *   const Grid = defineTable({ striped: true });
 *   <Grid label="Invoices" rows={invoices} columns={['id', 'customer', { key: 'amount', align: 'end', sortable: true }]} pageSize={10} />
 */
export interface TableConfig<T extends object = Record<string, unknown>> extends SlotOverrides<TableSlot, TableState> {
  /** Names the table (its caption). */
  label: React.ReactNode;
  /** Keep the caption for screen readers only. @default false */
  hideLabel?: boolean;
  /** The rows: your data. */
  rows: readonly T[];
  /** The columns: keys, or `{ key, header, cell, sortable, align, width }`. Default every key of the first row. */
  columns?: ReadonlyArray<TableColumn<T> | Key<T>>;
  /** A row's stable id: a key, or `(row) => string`. Default `id`, else the position. */
  rowKey?: Key<T> | ((row: T, index: number) => string);
  /** The sort, controlled; `null` for none. */
  sort?: TableSort | null;
  defaultSort?: TableSort;
  /** A header was pressed: ascending, descending, then off. */
  onSortChange?: (sort: TableSort | null) => void;
  /** Rows come sorted from your server: the table only shows the sort. @default false */
  manualSort?: boolean;
  /** Rows can be chosen: checkboxes, one or several. @default 'none' */
  selection?: 'none' | 'single' | 'multiple';
  /** The chosen row keys, controlled. */
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Rows per page: the table pages its rows and shows Pagination under them. */
  pageSize?: number;
  page?: number;
  /** @default 1 */
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Rows come one page at a time from your server: how many there are in all. */
  total?: number;
  /** A row was activated (click, or Enter on a focused row): rows become focusable. */
  onRowAction?: (row: T, event: React.SyntheticEvent) => void;
  /** Rows are being fetched: shimmering rows while there are none, the table busy. @default false */
  loading?: boolean;
  /** @default 'Nothing to show' */
  emptyText?: React.ReactNode;
  labels?: TableLabels;
  /** @default 'card' */
  variant?: TableVariant;
  /** @default 'normal' */
  density?: 'compact' | 'normal' | 'relaxed';
  /** @default false */
  striped?: boolean;
  /** The header stays while the body scrolls (with `dimensions.maxHeight`). @default false */
  stickyHeader?: boolean;
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
  /** The rows on screen: sorted, and the current page. */
  visibleRows: readonly object[];
  sort: TableSort | null;
  selected: readonly string[];
  setSort: (sort: TableSort | null) => void;
  setSelected: (keys: readonly string[]) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TableRootProps) => React.ReactElement;
}
export type TableComponent = PinfoldComponent<TableApi, TableRootProps>;
