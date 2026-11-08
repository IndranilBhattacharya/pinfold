import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { NoInfer, SlotOverrides } from '../types';

export type TabsSlot = 'root' | 'list' | 'tab' | 'indicator' | 'icon' | 'endContent' | 'panel';
export type TabsVariant = 'underline' | 'segmented' | 'pills';

/** One tab and its panel. */
export interface TabsItem<Id extends string = string> {
  /** Stable id: the value of `value` and `onChange`. */
  id: Id;
  /** The tab text. */
  label: React.ReactNode;
  /** The panel. */
  content?: React.ReactNode;
  /** Before the text. */
  icon?: React.ReactNode;
  /** After the text: a count or a badge. */
  endContent?: React.ReactNode;
  /** Focusable, never selected. */
  disabled?: boolean;
}

/** Passed to slot `render` overrides. */
export interface TabsState {
  variant: TabsVariant;
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
 */
export interface TabsConfig<Id extends string = string> extends SlotOverrides<TabsSlot, TabsState> {
  /** The accessible name of the tab list, e.g. "Account settings". */
  label: string;
  /** One tab and its panel each. */
  items: ReadonlyArray<TabsItem<Id>>;
  /** The selected tab id, controlled. */
  value?: NoInfer<Id>;
  /** The selected tab id when uncontrolled. Default the first tab that is not disabled. */
  defaultValue?: NoInfer<Id>;
  /** When another tab is selected. */
  onChange?: (id: Id, event: React.MouseEvent | React.KeyboardEvent) => void;
  /** @default 'underline' */
  variant?: TabsVariant;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
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
  /** Focus the selected tab. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TabsRootProps) => React.ReactElement;
}
export type TabsComponent = PinfoldComponent<TabsApi, TabsRootProps>;
