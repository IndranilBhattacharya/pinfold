import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { NoInfer, SlotOverrides } from '../types';

export type TabsSlot = 'root' | 'header' | 'list' | 'tab' | 'indicator' | 'icon' | 'endContent' | 'close' | 'add' | 'panel';
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
export interface TabsConfig<Id extends string = string> extends SlotOverrides<TabsSlot, TabsState> {
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
