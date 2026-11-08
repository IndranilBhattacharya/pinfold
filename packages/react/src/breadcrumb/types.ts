import type * as React from 'react';
import type { PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type BreadcrumbSlot = 'root' | 'list' | 'item' | 'link' | 'icon' | 'separator' | 'ellipsis';
export type BreadcrumbSeparator = 'chevron' | 'slash' | 'dot';

/** One crumb. */
export interface BreadcrumbItem {
  /** The text. */
  label: React.ReactNode;
  /** Where it goes. The current page needs none. */
  href?: string;
  /** Before the text. */
  icon?: React.ReactNode;
  /** For client-side routing. */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

/** Passed to slot `render` overrides. */
export interface BreadcrumbState {
  variant: 'plain' | 'soft';
  size: PinfoldSize;
  /** The middle crumbs are hidden behind the reveal button. */
  collapsed: boolean;
}

/**
 *   const Trail = defineBreadcrumb({ maxItems: 4 });
 *   <Trail items={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/projects' }, { label: 'Settings' }]} />
 */
export interface BreadcrumbConfig extends SlotOverrides<BreadcrumbSlot, BreadcrumbState> {
  /** From the top of the site to the current page; the last one is the current page. */
  items: readonly BreadcrumbItem[];
  /** @default 'Breadcrumb' */
  label?: string;
  /** @default 'chevron' */
  separator?: BreadcrumbSeparator | React.ReactElement;
  /** Collapse the middle crumbs when there are more than this. */
  maxItems?: number;
  /** @default 1 */
  itemsBeforeCollapse?: number;
  /** @default 2 */
  itemsAfterCollapse?: number;
  /** @default 'Show the full path' */
  expandLabel?: string;
  /** @default 'plain' */
  variant?: 'plain' | 'soft';
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type BreadcrumbRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type BreadcrumbTagProps = BreadcrumbConfig & Omit<BreadcrumbRootProps, keyof BreadcrumbConfig>;

export interface BreadcrumbApi {
  /** The middle crumbs are hidden. */
  collapsed: boolean;
  /** Show every crumb. */
  expand: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: BreadcrumbRootProps) => React.ReactElement;
}
export type BreadcrumbComponent = PinfoldComponent<BreadcrumbApi, BreadcrumbRootProps>;
