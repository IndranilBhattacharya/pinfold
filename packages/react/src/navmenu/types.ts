import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type NavMenuSlot = 'root' | 'list' | 'item' | 'link' | 'trigger' | 'chevron' | 'panel' | 'content' | 'grid' | 'panelLink' | 'icon' | 'description';
export type NavMenuVariant = 'ghost' | 'underline' | 'pills';

/** A link in a panel. */
export interface NavMenuLink {
  /** The key `value` matches. Default the href, else the label. */
  id?: string;
  label: string;
  href?: string;
  target?: string;
  /** A line under the label. */
  description?: React.ReactNode;
  /** In a tile before the label. */
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
}

/** A top-level entry: a link, or a button that opens a panel of links (`items`) and/or any `content`. */
export interface NavMenuItem extends NavMenuLink {
  items?: ReadonlyArray<NavMenuLink | string>;
  /** Any node in the panel, before the links: a featured card. */
  content?: React.ReactNode;
  /** Link columns in the panel. Default 2 with more than three links, else 1. */
  columns?: 1 | 2 | 3;
}

/** Passed to slot `render` overrides. */
export interface NavMenuState {
  variant: NavMenuVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The current page's key. */
  value: string | undefined;
  /** The open entry's key. */
  open: string | null;
}

export interface NavMenuDimensions {
  /** Width of one link column (default 14rem). */
  columnWidth?: Length;
}

/**
 *   const SiteNav = defineNavMenu();
 *   <SiteNav label="Main" value={pathname} items={[
 *     { label: 'Products', items: [{ label: 'Analytics', href: '/analytics', description: 'Know your traffic', icon: <ChartIcon /> }] },
 *     { label: 'Pricing', href: '/pricing' },
 *   ]} />
 */
export interface NavMenuConfig extends SlotOverrides<NavMenuSlot, NavMenuState> {
  /** Names the navigation landmark, e.g. "Main". */
  label: string;
  /** Top-level entries; a string is a button whose key and text are that string. */
  items: ReadonlyArray<NavMenuItem | string>;
  /** The current page's key (id, href or label): usually the router's path. */
  value?: string;
  defaultValue?: string;
  /** A link or a button in a panel was chosen: `(key, item, event)`. */
  onChange?: (key: string, item: NavMenuLink, event: React.MouseEvent) => void;
  /** Follow links yourself: `(href, event)`. Default the provider's `navigate`, else the browser. */
  onNavigate?: (href: string, event: React.MouseEvent) => void;
  /** The open entry's key, controlled; `null` for none. */
  open?: string | null;
  defaultOpen?: string | null;
  onOpenChange?: (key: string | null) => void;
  /** Panels open on pointer hover (and a press), or on a press only. @default 'hover' */
  openOn?: 'hover' | 'click';
  /** @default 'ghost' */
  variant?: NavMenuVariant;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: NavMenuDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type NavMenuRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type NavMenuTagProps = NavMenuConfig & Omit<NavMenuRootProps, keyof NavMenuConfig>;

export interface NavMenuApi {
  value: string | undefined;
  open: string | null;
  setOpen: (key: string | null) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: NavMenuRootProps) => React.ReactElement;
}
export type NavMenuComponent = PinfoldComponent<NavMenuApi, NavMenuRootProps>;
