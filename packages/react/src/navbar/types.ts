import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { ButtonConfig } from '../button/types';
import type { MenuItem } from '../menu/types';
import type { SlotOverrides } from '../types';

export type NavbarSlot = 'root' | 'inner' | 'brand' | 'start' | 'list' | 'item' | 'link' | 'icon' | 'badge' | 'indicator' | 'more' | 'center' | 'end' | 'actions' | 'toggle' | 'panel' | 'panelLink' | 'zone' | 'tools' | 'tool' | 'toolBadge' | 'secondary';
export type NavbarVariant = 'solid' | 'glass' | 'floating' | 'plain';

/** One link: `href`, or a button (`onClick`), or a dropdown of links (`items`). */
export interface NavbarItem {
  /** The key `value` matches. Default the href, else the label. */
  id?: string;
  label: string;
  href?: string;
  /** Opens in another tab or frame: the browser follows it. */
  target?: string;
  icon?: React.ReactNode;
  /** After the text: a count, "New". */
  badge?: React.ReactNode;
  /** Links under this one, in a dropdown. */
  items?: ReadonlyArray<NavbarItem | string>;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
}

/** A tool in the bar: an icon button (search, notifications, theme), a link, a dropdown, or anything of your own. */
export interface NavbarTool {
  /** Names it in `layout` (`'tool:search'`). Default the label. */
  id?: string;
  /** Its accessible name and tooltip; shown as text with `showLabel` or when there is no icon. */
  label: string;
  icon?: React.ReactNode;
  /** Show the label beside the icon. @default false */
  showLabel?: boolean;
  /** A count or a word on its corner; `true` for a dot. */
  badge?: React.ReactNode | boolean;
  onClick?: (event: React.MouseEvent) => void;
  /** Makes it a link, followed like the bar's links. */
  href?: string;
  target?: string;
  /** Rows of a dropdown it opens. */
  menu?: readonly MenuItem[];
  /** A toggle: pressed or not (`aria-pressed`). */
  active?: boolean;
  disabled?: boolean;
  /** Your own element in its place: a search field, a switch, an avatar menu. */
  content?: React.ReactNode;
  /** The zone it sits in when the layout says `'tools'`. @default 'end' */
  placement?: 'start' | 'center' | 'end';
  /** In a folded bar: stay in the bar, become a row of the panel, or go away. @default 'keep' */
  whenCollapsed?: 'keep' | 'panel' | 'hide';
}

/** Anything of your own in a zone, with rules for a narrow bar. */
export interface NavbarCustomPart {
  content: React.ReactNode;
  /** Leave the bar while it is narrower than this (px). */
  hideBelow?: number;
  /** In a folded bar: stay or go away. @default 'keep' */
  whenCollapsed?: 'keep' | 'hide';
}

/**
 * One part of a zone. Built-in parts by name: `'brand'`, `'links'`, `'actions'`, `'tools'` (the tools placed in
 * that zone), `'tool:<id>'` (one tool), `'start'`, `'center'`, `'end'` (your nodes), `'toggle'` (the menu button of
 * a folded bar), `'spacer'` (takes the free room), `'separator'` (a hairline). Or any node, or `{ content, hideBelow }`.
 */
export type NavbarPart = 'brand' | 'links' | 'actions' | 'tools' | 'start' | 'center' | 'end' | 'toggle' | 'spacer' | 'separator' | `tool:${string}` | React.ReactElement | NavbarCustomPart;

/** What sits in each zone of the bar, in order. A zone left out keeps its default. */
export interface NavbarLayout {
  start?: readonly NavbarPart[];
  center?: readonly NavbarPart[];
  end?: readonly NavbarPart[];
}

/** The brand as data: a link home with a logo and a name. */
export interface NavbarBrand {
  label: React.ReactNode;
  logo?: React.ReactNode;
  href?: string;
}

/** Passed to slot `render` overrides. */
export interface NavbarState {
  variant: NavbarVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The current link's key. */
  value: string | undefined;
  /** The page has scrolled. */
  scrolled: boolean;
  /** The links are folded into the menu button. */
  collapsed: boolean;
  /** The folded panel is open. */
  menuOpen: boolean;
}

export interface NavbarDimensions {
  /** Default by size: 3rem, 3.5rem, 4rem. */
  height?: Length;
  /** Widest the bar's content gets; centred beyond that. */
  maxWidth?: Length;
  /** Space at the bar's ends. */
  paddingX?: Length;
}

/** One link as you wrote it, its key and whether it is current: `render` overrides of links get it as `item`. */
export type NavbarItemContext = (NavbarItem & { key: string; current: boolean; overflowed: boolean }) | NavbarTool;

/**
 *   const TopBar = defineNavbar({ variant: 'glass', position: 'sticky' });
 *   <TopBar label="Main" value={pathname} brand={{ label: 'Acme', href: '/' }} items={['Docs', 'Pricing']} actions={[{ label: 'Sign in' }]} />
 */
export interface NavbarConfig extends SlotOverrides<NavbarSlot, NavbarState, NavbarItemContext> {
  /** Names the navigation landmark, e.g. "Main". */
  label: string;
  /** The logo and name: a node, or `{ label, logo, href }`. */
  brand?: React.ReactNode | NavbarBrand;
  /** The links; a string is a link whose key and text are that string. */
  items?: ReadonlyArray<NavbarItem | string>;
  /** The current link's key, controlled: usually the router's path. */
  value?: string;
  defaultValue?: string;
  onChange?: (key: string, item: NavbarItem, event: React.SyntheticEvent) => void;
  /** Follow links yourself. Default the provider's `navigate`, else the browser. */
  onNavigate?: (href: string, event: React.SyntheticEvent) => void;
  /** After the brand. */
  start?: React.ReactNode;
  /** In the middle: a search field, a navigation menu. */
  center?: React.ReactNode;
  /** At the end: an avatar, a theme switch. */
  end?: React.ReactNode;
  /** Buttons at the end, as button configs. */
  actions?: readonly ButtonConfig[];
  /** Icon buttons, links, dropdowns or your own elements, as data; each names the zone it sits in. */
  tools?: readonly NavbarTool[];
  /**
   * What sits where: three zones, each a list of parts in order. Default: start `['brand', 'tools', 'start', 'links']`,
   * center `['tools', 'center']`, end `['tools', 'actions', 'end', 'toggle']` (`align` moves `'links'`).
   */
  layout?: NavbarLayout;
  /** A second row under the bar: tabs, a breadcrumb, filters. */
  secondary?: React.ReactNode;
  /** Where the links sit. @default 'start' */
  align?: 'start' | 'center' | 'end';
  /** @default 'solid' */
  variant?: NavbarVariant;
  /** How the current link is marked; the marker slides between links. @default 'pill' */
  indicator?: 'pill' | 'underline' | 'none';
  /** @default 'static' */
  position?: 'static' | 'sticky' | 'fixed';
  /** The bar gets shorter once the page has scrolled. @default false */
  shrinkOnScroll?: boolean;
  /** Scrolling down slides the bar away; scrolling up brings it back. @default false */
  hideOnScroll?: boolean;
  /** Links that do not fit: under "More", in a row that scrolls, or left to you. @default 'more' */
  overflow?: 'more' | 'scroll' | 'none';
  /** The bar width (px) under which the links fold into a menu button. @default 640 */
  collapseAt?: number;
  labels?: { more?: string; openMenu?: string; closeMenu?: string };
  /** Corner radius: a preset or a length. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: NavbarDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type NavbarRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type NavbarTagProps = NavbarConfig & Omit<NavbarRootProps, keyof NavbarConfig>;

export interface NavbarApi {
  /** The current link's key. */
  value: string | undefined;
  setValue: (key: string) => void;
  scrolled: boolean;
  collapsed: boolean;
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: NavbarRootProps) => React.ReactElement;
}
export type NavbarComponent = PinfoldComponent<NavbarApi, NavbarRootProps>;
