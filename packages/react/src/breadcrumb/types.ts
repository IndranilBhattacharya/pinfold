import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
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
  /** What `onChange` reports for it. Default its `href`, else its text, else its position. */
  key?: string;
  /** Show only the icon; the label stays as its name (read by screen readers) and its tooltip. */
  iconOnly?: boolean;
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
/** One crumb as you wrote it, its position and whether it is the current page. `render` overrides of the repeating parts get it as `item`. */
export type BreadcrumbItemContext = BreadcrumbItem & { index: number; current: boolean };

export interface BreadcrumbConfig extends SlotOverrides<BreadcrumbSlot, BreadcrumbState, BreadcrumbItemContext> {
  /** From the top of the site to the current page; the last one is the current page. A string is a crumb with no link. */
  items?: ReadonlyArray<BreadcrumbItem | string>;
  /** Build the crumbs from a URL path instead: one per segment, each linking to the path up to it. */
  path?: string;
  /** Names for path segments, by segment or by href (`{ 'user-settings': 'Settings' }`), or a function; unnamed segments are made readable. */
  pathLabels?: Readonly<Record<string, React.ReactNode>> | ((segment: string, href: string) => React.ReactNode | undefined);
  /** @default 'Home' */
  homeLabel?: React.ReactNode;
  /**
   * A home crumb: `true` puts a house icon linking to `/` first (named by `homeLabel`); a crumb
   * object sets its own `href`, `icon`, `label`. With `path`, it dresses the root crumb instead.
   * @default false
   */
  home?: boolean | BreadcrumbItem;
  /** Handles crumb clicks (client-side routing). Without it, the provider's `navigate` does, then the browser. */
  onNavigate?: (href: string, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * A crumb, a hidden crumb or a sibling page was chosen: `(key, item, event)`, after the item's own
   * `onClick` and before navigation (`event.preventDefault()` keeps the page). `key` is the item's
   * `key`, else its `href`, else its text, else its position.
   */
  onChange?: (key: string, item: BreadcrumbLink, event: React.MouseEvent<HTMLElement>) => void;
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
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
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
