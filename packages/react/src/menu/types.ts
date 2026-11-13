import type * as React from 'react';
import type { Length, OverlayPlacement, PinfoldSize, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';

export type MenuSlot =
  | 'root' | 'list' | 'item' | 'indicator' | 'icon' | 'text' | 'label' | 'description' | 'end' | 'shortcut'
  | 'separator' | 'group' | 'groupLabel' | 'submenu' | 'chevron' | 'header' | 'footer' | 'search' | 'empty' | 'loading';
export type MenuMode = 'dropdown' | 'context';
export type MenuSelectionMode = 'none' | 'single' | 'multiple';
/** Why the menu opened or closed. */
export type MenuChangeReason = 'trigger' | 'keyboard' | 'contextmenu' | 'escape' | 'outside' | 'select' | 'tab' | 'api';

/** What a row's `content` function receives. */
export interface MenuRowState {
  checked: boolean;
  selected: boolean;
  disabled: boolean;
}
/** What a function in the menu's `header` or `footer` receives. */
export interface MenuRenderContext {
  close: () => void;
}

interface MenuRowBase {
  /** React key; the position is used without one. */
  id?: string;
  label: React.ReactNode;
  /** Decorative icon before the label. */
  icon?: React.ReactNode;
  /** A hint at the end, e.g. "⌘K". It does not bind the key. */
  shortcut?: React.ReactNode;
  /** Colour for the row, e.g. a destructive action. */
  tone?: 'danger' | 'success' | 'warning' | 'info';
  /** Stays reachable by keyboard, does nothing. */
  disabled?: boolean;
  /** Called on click, Enter or Space. */
  onSelect?: (event: React.SyntheticEvent<HTMLElement>) => void;
  /** Close after selecting. Wins over the menu's `closeOnSelect`. */
  closeOnSelect?: boolean;
  /** A muted line under the label. */
  description?: React.ReactNode;
  /** Anything before the label (an avatar, a dot). Takes the place of `icon`. */
  startContent?: React.ReactNode;
  /** Anything at the end, before the shortcut (a badge, a count). */
  endContent?: React.ReactNode;
  /** Replaces the row's inside (all but the check mark). The row keeps its role and `label` as its name. */
  content?: React.ReactNode | ((state: MenuRowState) => React.ReactNode);
  /** Text for typeahead and search when `label` is not a string. */
  textValue?: string;
  /** Why a disabled row is disabled: its tooltip and accessible description. */
  disabledReason?: string;
}

export interface MenuActionItem extends MenuRowBase {
  type?: 'item';
  /** Makes the row a real link. */
  href?: string;
  target?: string;
  /** The current choice (the current workspace): a check at the end and `aria-current`. @default false */
  selected?: boolean;
  checked?: never;
}
export interface MenuCheckItem extends MenuRowBase {
  type: 'checkbox' | 'radio';
  /** You own the state; update it in `onSelect`. */
  checked?: boolean;
  href?: never;
}
export interface MenuSeparatorItem {
  type: 'separator';
  id?: string;
}
export interface MenuGroupItem {
  type: 'group';
  id?: string;
  /** Names the group. */
  label: React.ReactNode;
  items: readonly MenuItem[];
  /** The menu checks this group's rows for you: radio rows (`single`) or checkbox rows (`multiple`). */
  selectionMode?: 'single' | 'multiple';
  /** Checked row ids (one id for `single`). Controlled. */
  value?: string | readonly string[];
  /** Initial ids, uncontrolled. */
  defaultValue?: string | readonly string[];
  /** The new id (`single`) or ids (`multiple`). */
  onValueChange?: (value: string & string[], item: MenuItem) => void;
}
/** A row that opens a menu beside it: on hover, a press, Enter, Space or the arrow toward it. */
export interface MenuSubmenuItem {
  type: 'submenu';
  id?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'danger' | 'success' | 'warning' | 'info';
  disabled?: boolean;
  items: readonly MenuItem[];
}
export type MenuItem = MenuActionItem | MenuCheckItem | MenuSeparatorItem | MenuGroupItem | MenuSubmenuItem;

/** Passed to slot `render` overrides. */
export interface MenuState {
  open: boolean;
  mode: MenuMode;
  size: PinfoldSize;
}

export interface MenuLabels {
  /** @default 'Search' */
  search?: string;
  /** @default 'No results' */
  empty?: string;
  /** @default 'Loading' */
  loading?: string;
}

export interface MenuDimensions {
  width?: Length;
  maxHeight?: Length;
}

/**
 *   const RowActions = defineMenu({ placement: 'bottom-end' });
 *   <RowActions trigger={{ label: 'Actions' }} items={[{ label: 'Edit', onSelect: edit }]} />
 */
/** One menu row as you wrote it (a submenu row also says if it is open). `render` overrides of the repeating parts get it as `item`. */
export type MenuItemContext = MenuItem & { index?: number; open?: boolean };

export interface MenuConfig extends SlotOverrides<MenuSlot, MenuState, MenuItemContext> {
  /** The rows. */
  items: readonly MenuItem[];
  /** A dropdown's button config or element; a context menu's area. */
  trigger?: OverlayTrigger;
  /** @default 'dropdown' */
  mode?: MenuMode;
  /** Accessible name. A dropdown is named by its trigger without one; a context menu needs it. */
  label?: string;
  /** @default 'bottom-start' */
  placement?: OverlayPlacement;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 4 */
  offset?: number;
  /** @default true */
  loop?: boolean;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  /** The next state, and why. */
  onOpenChange?: (open: boolean, reason: MenuChangeReason) => void;
  /** Any row was chosen. `id` is the row's `id`, or its position. */
  onAction?: (id: string, item: MenuItem) => void;
  /** Close after a row is chosen. On; off for checkbox and radio rows. */
  closeOnSelect?: boolean;
  /** The menu checks its rows for you. @default 'none' */
  selectionMode?: MenuSelectionMode;
  /** Checked row ids (one id for `single`). Controlled. */
  value?: string | readonly string[];
  /** Initial ids, uncontrolled. */
  defaultValue?: string | readonly string[];
  /** The new id (`single`) or ids (`multiple`). */
  onValueChange?: (value: string & string[], item: MenuItem) => void;
  /** A search field filters the rows. @default false */
  searchable?: boolean;
  /** Your own match. */
  filter?: (item: MenuItem, query: string) => boolean;
  /** The search text changed. */
  onSearchChange?: (query: string) => void;
  /** @default false */
  loading?: boolean;
  /** Shown when there are no rows, or none match. */
  emptyContent?: React.ReactNode;
  labels?: MenuLabels;
  /** Your own content above the rows. */
  header?: React.ReactNode | ((context: MenuRenderContext) => React.ReactNode);
  /** Your own content below the rows. */
  footer?: React.ReactNode | ((context: MenuRenderContext) => React.ReactNode);
  dimensions?: MenuDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type MenuRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type MenuTagProps = MenuConfig & Omit<MenuRootProps, keyof MenuConfig>;

export interface MenuApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Spread on your own element when `trigger` is unset. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  /** The panel (header, search, list, footer). */
  getRootProps: (props?: PropsBag) => PropsBag;
  /** The `role="menu"` list of rows. */
  getListProps: (props?: PropsBag) => PropsBag;
  render: (props?: MenuRootProps) => React.ReactElement;
}
export type MenuComponent = PinfoldComponent<MenuApi, MenuRootProps>;
