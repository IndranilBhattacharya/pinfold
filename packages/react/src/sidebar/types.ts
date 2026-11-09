import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type SidebarSlot = 'root' | 'header' | 'body' | 'group' | 'groupLabel' | 'list' | 'item' | 'link' | 'icon' | 'badge' | 'chevron' | 'sublist' | 'footer' | 'toggle';
export type SidebarVariant = 'soft' | 'plain' | 'solid';

/** One entry: a link (`href`), a button (`onClick`, or `onChange` picks it), or a section (`items`). */
export interface SidebarItem {
  /** The key `value` matches. Default the href, else the label. */
  id?: string;
  label: string;
  /** A link, followed through `onNavigate` or the provider's `navigate`. */
  href?: string;
  /** Opens in another tab or frame: the browser follows it. */
  target?: string;
  /** Before the text; in a collapsed rail it stands for the entry (the first letter otherwise). */
  icon?: React.ReactNode;
  /** After the text: a count or a status. */
  badge?: React.ReactNode;
  /** Entries in a section that opens and closes. A section is a button, never a link. */
  items?: ReadonlyArray<SidebarItem | string>;
  /** Top-level entries with the same group sit under its heading. */
  group?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
}

/** Passed to slot `render` overrides. */
export interface SidebarState {
  variant: SidebarVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The current entry's key. */
  value: string | undefined;
  collapsed: boolean;
}

export interface SidebarDimensions {
  /** Default 16rem. */
  width?: Length;
}

/**
 *   const AppNav = defineSidebar({ collapsible: true });
 *   <AppNav label="Main" value={pathname} items={[
 *     { label: 'Inbox', href: '/inbox', icon: <InboxIcon />, badge: 4 },
 *     { label: 'Projects', icon: <FolderIcon />, items: [{ label: 'Pinfold', href: '/p/pinfold' }] },
 *     { label: 'Settings', href: '/settings', group: 'Account' },
 *   ]} />
 */
/** One entry as you wrote it, its key, depth, whether it is current, and (sections) open. `render` overrides of the repeating parts get it as `item`. */
export type SidebarItemContext = SidebarItem & { key: string; depth: number; current: boolean; open?: boolean };

export interface SidebarConfig extends SlotOverrides<SidebarSlot, SidebarState, SidebarItemContext> {
  /** Names the navigation landmark, e.g. "Main". */
  label: string;
  /** Entries; a string is an entry whose key and text are that string. */
  items: ReadonlyArray<SidebarItem | string>;
  /** The current entry's key (id, href or label), controlled: usually the router's path. */
  value?: string;
  /** The current entry at first, when uncontrolled. */
  defaultValue?: string;
  /** When an entry is chosen (links too): `(key, item, event)`. */
  onChange?: (key: string, item: SidebarItem, event: React.MouseEvent) => void;
  /** Follow links yourself: `(href, event)`. Default the provider's `navigate`, else the browser. */
  onNavigate?: (href: string, event: React.MouseEvent) => void;
  /** Open sections (their keys), controlled. */
  expanded?: readonly string[];
  /** Open sections at first. Default the sections that hold the current entry. */
  defaultExpanded?: readonly string[];
  onExpandedChange?: (keys: string[]) => void;
  /** A button at the foot folds the sidebar into a rail of icons. @default false */
  collapsible?: boolean;
  /** A rail of icons, controlled. */
  collapsed?: boolean;
  /** @default false */
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Above the entries: a logo, a team switcher. */
  header?: React.ReactNode;
  /** Under the entries: the account, help. */
  footer?: React.ReactNode;
  /** Text read and shown, for translation. */
  labels?: { collapse?: string; expand?: string };
  /** @default 'soft' */
  variant?: SidebarVariant;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: SidebarDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type SidebarRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type SidebarTagProps = SidebarConfig & Omit<SidebarRootProps, keyof SidebarConfig>;

export interface SidebarApi {
  /** The current entry's key. */
  value: string | undefined;
  setValue: (key: string) => void;
  /** Open sections. */
  expanded: string[];
  setExpanded: (keys: string[]) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SidebarRootProps) => React.ReactElement;
}
export type SidebarComponent = PinfoldComponent<SidebarApi, SidebarRootProps>;
