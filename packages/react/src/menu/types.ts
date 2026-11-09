import type * as React from 'react';
import type { Length, OverlayPlacement, PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';

export type MenuSlot = 'root' | 'item' | 'indicator' | 'icon' | 'label' | 'shortcut' | 'separator' | 'group' | 'groupLabel' | 'submenu' | 'chevron';
export type MenuMode = 'dropdown' | 'context';

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
  /** Close after selecting. On; off for checkbox and radio rows. */
  closeOnSelect?: boolean;
}

export interface MenuActionItem extends MenuRowBase {
  type?: 'item';
  /** Makes the row a real link. */
  href?: string;
  target?: string;
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

export interface MenuDimensions {
  width?: Length;
  maxHeight?: Length;
}

/**
 *   const RowActions = defineMenu({ placement: 'bottom-end' });
 *   <RowActions trigger={{ label: 'Actions' }} items={[{ label: 'Edit', onSelect: edit }]} />
 */
export interface MenuConfig extends SlotOverrides<MenuSlot, MenuState> {
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
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 4 */
  offset?: number;
  /** @default true */
  loop?: boolean;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: MenuRootProps) => React.ReactElement;
}
export type MenuComponent = PinfoldComponent<MenuApi, MenuRootProps>;
