import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type BreadcrumbSlot = 'root' | 'list' | 'item' | 'link' | 'icon' | 'separator' | 'ellipsis' | 'menuButton';
export type BreadcrumbSeparator = 'chevron' | 'slash' | 'dot' | 'arrow';
export type BreadcrumbVariant = 'plain' | 'soft' | 'outline' | 'pills';

/** A page a crumb, or a crumb's menu, links to. */
export interface BreadcrumbLink {
  /** The text. */
  label: React.ReactNode;
  /** Where it goes. */
  href?: string;
  /** Before the text. */
  icon?: React.ReactNode;
  /** Runs before navigation; `event.preventDefault()` stops it. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

/** One crumb. */
export interface BreadcrumbItem extends BreadcrumbLink {
  /**
   * Other pages at this level, e.g. the other projects next to this one: a menu opens from a
   * button beside the crumb (from the crumb itself when it has no `href`).
   */
  menu?: readonly BreadcrumbLink[];
  /** Shown as text, never a link. */
  disabled?: boolean;
}

/** Passed to slot `render` overrides. */
export interface BreadcrumbState {
  variant: BreadcrumbVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The middle crumbs are hidden behind the ellipsis. */
  collapsed: boolean;
}

export interface BreadcrumbDimensions {
  /** Longest a crumb gets before its text is cut with an ellipsis. */
  itemWidth?: Length;
}

/**
 *   const Trail = defineBreadcrumb({ maxItems: 4 });
 *   <Trail path={location.pathname} />
 *   <Trail items={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/projects', menu: projects }, 'Settings']} />
 */
export interface BreadcrumbConfig extends SlotOverrides<BreadcrumbSlot, BreadcrumbState> {
  /** From the top of the site to the current page; the last one is the current page. A string is a crumb with no link. */
  items?: ReadonlyArray<BreadcrumbItem | string>;
  /** Build the crumbs from a URL path instead: one per segment, each linking to the path up to it. */
  path?: string;
  /** Names for path segments, by segment or by href (`{ 'user-settings': 'Settings' }`), or a function; unnamed segments are made readable. */
  pathLabels?: Readonly<Record<string, React.ReactNode>> | ((segment: string, href: string) => React.ReactNode | undefined);
  /** @default 'Home' */
  homeLabel?: React.ReactNode;
  /** Handles crumb clicks (client-side routing). Without it, the provider's `navigate` does, then the browser. */
  onNavigate?: (href: string, event: React.MouseEvent<HTMLElement>) => void;
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
  /** @default 'menu' */
  collapse?: 'menu' | 'expand';
  /** @default 'Show the full path' */
  expandLabel?: string;
  /** @default 'Other pages' */
  menuLabel?: string;
  /** @default 'plain' */
  variant?: BreadcrumbVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: BreadcrumbDimensions;
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
