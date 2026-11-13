import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { NoInfer, SlotOverrides } from '../types';

export type TabsSlot = 'root' | 'header' | 'list' | 'tab' | 'indicator' | 'icon' | 'endContent' | 'close' | 'add' | 'scrollButton' | 'panel';
export type TabsVariant = 'segmented' | 'underline' | 'pills' | 'soft' | 'enclosed';
export type TabsPlacement = 'top' | 'bottom' | 'start' | 'end';

/** One tab and its panel. */
export interface TabsItem<Id extends string = string> {
  /** Stable id: the value of `value` and `onChange`. */
  id: Id;
  /** The tab text. Default the id. */
  label?: React.ReactNode;
  /** The panel. */
  content?: React.ReactNode;
  /** Before the text. */
  icon?: React.ReactNode;
  /** After the text: a count or a badge. */
  endContent?: React.ReactNode;
  /** The tab is a link (a route): it selects and follows it, through the provider's `navigate`. */
  href?: string;
  /** Focusable, never selected. */
  disabled?: boolean;
  /** With `onClose`, every tab can close; `false` keeps this one. */
  closable?: boolean;
}

/** Passed to slot `render` overrides. */
export interface TabsState {
  variant: TabsVariant;
  placement: TabsPlacement;
  orientation: 'horizontal' | 'vertical';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The selected tab id. */
  value: string;
}

export interface TabsDimensions {
  height?: Length;
  gap?: Length;
}

/**
 *   const Settings = defineTabs();
 *   <Settings label="Settings" items={[{ id: 'profile', label: 'Profile', content: <Profile /> }]} />
 *   <Settings label="Views" items={['Board', 'List', 'Calendar']} onChange={setView} />
 */
/** One tab as you wrote it, its position and whether it is selected. `render` overrides of the repeating parts get it as `item`. */
export type TabsItemContext = TabsItem & { index: number; selected: boolean };

export interface TabsConfig<Id extends string = string> extends SlotOverrides<TabsSlot, TabsState, TabsItemContext> {
  /** The accessible name of the tab list, e.g. "Account settings". */
  label: string;
  /** One tab and its panel each; a string is a tab whose id and text are that string. */
  items: ReadonlyArray<TabsItem<Id> | Id>;
  /** The selected tab id, controlled. */
  value?: NoInfer<Id>;
  /** The selected tab id when uncontrolled. Default the first tab that is not disabled. */
  defaultValue?: NoInfer<Id>;
  /** When another tab is selected. */
  onChange?: (id: Id, event: React.SyntheticEvent) => void;
  /** Tabs get a close mark, and Delete closes the focused one. Remove the item in your state. */
  onClose?: (id: Id, event: React.SyntheticEvent) => void;
  /** A + button after the tabs. Add an item in your state. */
  onAdd?: (event: React.MouseEvent) => void;
  /** @default 'New tab' */
  addLabel?: string;
  /** @default 'Press Delete to close' */
  closeLabel?: string;
  /** Tabs can be dragged, or moved with Ctrl (⌘) + Shift + an arrow key: `(ids, event)` in the new order. Reorder the items in your state. */
  onReorder?: (ids: Id[], event: React.SyntheticEvent) => void;
  /** @default 'Press Control, Shift and an arrow key to move' */
  reorderLabel?: string;
  /** @default 'segmented' */
  variant?: TabsVariant;
  /** @default 'top' */
  placement?: TabsPlacement;
  /** @default 'auto' */
  activation?: 'auto' | 'manual';
  /** @default false */
  fullWidth?: boolean;
  /** @default false */
  keepMounted?: boolean;
  /** Mount a panel the first time its tab is selected, then keep it (its state survives a switch). @default false */
  lazy?: boolean;
  /** `tabs`: a tab list with panels. `nav`: the tabs are links in a `<nav>` (the current one `aria-current="page"`), no panels: route tabs. @default 'tabs' */
  mode?: 'tabs' | 'nav';
  /** The panel's frame: `plain` (no frame, your layout), `card` (on a card), or `auto` (a card for `enclosed`, else plain). @default 'auto' */
  panelVariant?: 'auto' | 'plain' | 'card';
  /** Arrow buttons at the ends of a row of tabs that overflows (for pointers; keys move focus along the row). @default true */
  scrollButtons?: boolean;
  /** Draw the inside of each tab yourself: `(item) => node` (the tab keeps its element, role and keys). */
  renderTab?: (item: TabsItemContext) => React.ReactNode;
  /** The panel content for a tab: `(item) => node`, instead of each item's `content`. */
  renderPanel?: (item: TabsItemContext) => React.ReactNode;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: TabsDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TabsRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type TabsTagProps<Id extends string = string> = TabsConfig<Id> & Omit<TabsRootProps, keyof TabsConfig>;

export interface TabsApi {
  /** The selected tab id. */
  value: string;
  /** Select a tab. */
  select: (id: string) => void;
  /** Select the next tab that can be (wraps). */
  next: () => void;
  /** Select the previous tab that can be (wraps). */
  previous: () => void;
  /** Focus the selected tab. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TabsRootProps) => React.ReactElement;
}
export type TabsComponent = PinfoldComponent<TabsApi, TabsRootProps>;
