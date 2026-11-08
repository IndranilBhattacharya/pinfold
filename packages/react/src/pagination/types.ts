import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type PaginationSlot = 'root' | 'info' | 'list' | 'cursor' | 'item' | 'gap' | 'previous' | 'next' | 'first' | 'last' | 'status' | 'size' | 'jump';
export type PaginationVariant = 'soft' | 'ghost' | 'outline' | 'panel';
export type PaginationRadius = 'sm' | 'md' | 'full';

/** Text read and shown, for translation. */
export interface PaginationLabels {
  /** @default 'Previous page' */
  previous?: string;
  /** @default 'Next page' */
  next?: string;
  /** @default 'First page' */
  first?: string;
  /** @default 'Last page' */
  last?: string;
  /** Default "Page 3". */
  page?: (page: number) => string;
  /** The summary. Default "21–40 of 532", or "Page 3 of 20" without a `total`. */
  info?: (details: { from: number; to: number; total?: number; page: number; count?: number }) => React.ReactNode;
  /** @default 'Rows per page' */
  pageSize?: string;
  /** @default 'Go to page' */
  jump?: string;
}

/** What `onChange` receives besides the page: everything a server query needs. */
export interface PaginationChange {
  /** Items per page. */
  pageSize: number;
  /** Items before this page: a query's `offset` / `skip`. */
  offset: number;
  /** What changed. */
  reason: 'page' | 'pageSize';
  event?: React.SyntheticEvent;
}

/** Passed to slot `render` overrides. */
export interface PaginationState {
  variant: PaginationVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  page: number;
  /** Undefined while the total is unknown (`hasNext`). */
  count?: number;
  pageSize: number;
  loading: boolean;
}

/**
 *   const Pages = definePagination({ pageSizes: [10, 25, 50], showInfo: true });
 *   <Pages count={24} page={page} onChange={setPage} />
 *   <Pages total={data.total} page={query.page} pageSize={query.size} loading={isFetching}
 *     onChange={(page, { pageSize }) => setQuery({ page, size: pageSize })} />
 */
export interface PaginationConfig extends SlotOverrides<PaginationSlot, PaginationState> {
  /** How many pages there are. Or give `total` (items) and the page size. */
  count?: number;
  /** How many items there are; with `pageSize` it gives the page count and the "21–40 of 532" summary. */
  total?: number;
  /** The total is unknown (a cursor-paged API): whether there is a page after this one. */
  hasNext?: boolean;
  /** The current page (from 1), controlled. */
  page?: number;
  /** @default 1 */
  defaultPage?: number;
  /** Items per page, controlled. */
  pageSize?: number;
  /** @default 10 */
  defaultPageSize?: number;
  /** Page sizes to pick from: a "Rows per page" select. */
  pageSizes?: readonly number[];
  /** A page or the page size changed: `(page, { pageSize, offset, reason, event })`. */
  onChange?: (page: number, details: PaginationChange) => void;
  /** Every page is a real link (crawlable, opens in a new tab), routed by the provider's `navigate`. Without it, pages are buttons. */
  getHref?: (page: number) => string;
  /** @default 'Pagination' */
  label?: string;
  /** @default 1 */
  siblings?: number;
  /** @default 1 */
  boundaries?: number;
  /** @default true */
  showControls?: boolean;
  /** @default false */
  showEdges?: boolean;
  /** @default false */
  showInfo?: boolean;
  /** @default false */
  showJump?: boolean;
  /** @default false */
  compact?: boolean;
  /** @default false */
  loading?: boolean;
  /** @default 'soft' */
  variant?: PaginationVariant;
  /** @default 'md' */
  radius?: PaginationRadius;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  disabled?: boolean;
  labels?: PaginationLabels;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type PaginationRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onChange'> & { [key: `data-${string}`]: unknown };
export type PaginationTagProps = PaginationConfig & Omit<PaginationRootProps, keyof PaginationConfig>;

export interface PaginationApi {
  page: number;
  pageSize: number;
  /** How many pages; undefined while the total is unknown. */
  count?: number;
  /** Items before the current page. */
  offset: number;
  /** Go to a page (clamped). */
  setPage: (page: number) => void;
  /** Change the page size; the page moves so the first item stays in view. */
  setPageSize: (size: number) => void;
  next: () => void;
  previous: () => void;
  /** The current page of an array you hold: `Pages.slice(rows)`. */
  slice: <T>(items: readonly T[]) => T[];
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: PaginationRootProps) => React.ReactElement;
}
export type PaginationComponent = PinfoldComponent<PaginationApi, PaginationRootProps>;
