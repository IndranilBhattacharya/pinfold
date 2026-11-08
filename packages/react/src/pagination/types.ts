import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type PaginationSlot = 'root' | 'list' | 'item' | 'gap' | 'previous' | 'next' | 'first' | 'last';
export type PaginationVariant = 'ghost' | 'soft' | 'outline';

/** Names read by screen readers, for translation. */
export interface PaginationLabels {
  previous?: string;
  next?: string;
  first?: string;
  last?: string;
  page?: (page: number) => string;
}

/** Passed to slot `render` overrides. */
export interface PaginationState {
  variant: PaginationVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  page: number;
  count: number;
}

/**
 *   const Pages = definePagination();
 *   <Pages count={24} page={page} onChange={setPage} />
 */
export interface PaginationConfig extends SlotOverrides<PaginationSlot, PaginationState> {
  /** How many pages there are. */
  count: number;
  /** The current page (from 1), controlled. */
  page?: number;
  /** @default 1 */
  defaultPage?: number;
  onChange?: (page: number, event: React.MouseEvent) => void;
  /** Every page is a real link (crawlable, opens in a new tab). Without it, pages are buttons. */
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
  /** @default 'ghost' */
  variant?: PaginationVariant;
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
  /** Go to a page (clamped). */
  setPage: (page: number) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: PaginationRootProps) => React.ReactElement;
}
export type PaginationComponent = PinfoldComponent<PaginationApi, PaginationRootProps>;
