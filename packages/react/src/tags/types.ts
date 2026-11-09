import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { NoInfer, SlotOverrides } from '../types';

export type TagsSlot = 'root' | 'label' | 'list' | 'tag' | 'icon' | 'text' | 'remove' | 'more' | 'empty';
export type TagsVariant = 'soft' | 'solid' | 'outline';

/** One tag. A string is a tag whose value and label are that string. */
export interface TagsItem<V extends string = string> {
  value: V;
  /** Shown. Default the value. */
  label?: React.ReactNode;
  /** Before the label: an icon, a dot, an avatar. */
  icon?: React.ReactNode;
  /** This tag's colour (the group's tone otherwise). */
  tone?: PinfoldTone;
  /** A link: the tag goes there, through the provider's `navigate`. */
  href?: string;
  /** With `onRemove`, every tag can be removed; `false` keeps this one. */
  removable?: boolean;
  /** Shown, never chosen or removed. */
  disabled?: boolean;
}

/** Passed to slot `render` overrides. */
export interface TagsState {
  variant: TagsVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  selection: 'none' | 'single' | 'multiple';
  /** The chosen values. */
  value: readonly string[];
}

/**
 *   const Chips = defineTags();
 *   <Chips label="Filters" items={filters} onRemove={(v) => setFilters((f) => f.filter((x) => x !== v))} />
 *   <Chips label="Size" items={['S', 'M', 'L']} selection="single" value={size} onChange={([v]) => setSize(v)} />
 */
/** One tag, its position, whether it is picked, and `remove` when it can be removed. `render` overrides of the repeating parts get it as `item`. */
export type TagsItemContext = { value: string; label: React.ReactNode; text: string; icon?: React.ReactNode; tone?: string; disabled?: boolean; href?: string; index: number; selected: boolean; remove?: (event: React.SyntheticEvent) => void };

export interface TagsConfig<V extends string = string> extends SlotOverrides<TagsSlot, TagsState, TagsItemContext> {
  /** Names the group, e.g. "Filters". */
  label: React.ReactNode;
  /** @default false */
  hideLabel?: boolean;
  /** The tags: strings, or `{ value, label, icon, tone, href, removable, disabled }`. */
  items: ReadonlyArray<TagsItem<V> | V>;
  /** Tags can be chosen: one, or several. @default 'none' */
  selection?: 'none' | 'single' | 'multiple';
  /** The chosen values, controlled. */
  value?: ReadonlyArray<NoInfer<V>>;
  defaultValue?: ReadonlyArray<NoInfer<V>>;
  /** `(values, event)` when the choice changes. */
  onChange?: (values: V[], event: React.SyntheticEvent) => void;
  /** Tags get a remove mark (and Delete removes the focused one). Remove it in your state. */
  onRemove?: (value: V, event: React.SyntheticEvent) => void;
  /** Tags shown before "+3 more", which shows the rest. */
  maxVisible?: number;
  /** @default 'Show all' */
  moreLabel?: string;
  /** @default 'Remove' */
  removeLabel?: string;
  /** Read with a removable tag that can be chosen. @default 'Press Delete to remove' */
  removeHint?: string;
  /** Shown when there are no tags. */
  emptyText?: React.ReactNode;
  /** @default 'soft' */
  variant?: TagsVariant;
  /** @default 'full' */
  radius?: 'sm' | 'md' | 'full';
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'neutral' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TagsRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type TagsTagProps<V extends string = string> = TagsConfig<V> & Omit<TagsRootProps, keyof TagsConfig>;

export interface TagsApi {
  value: readonly string[];
  setValue: (values: readonly string[]) => void;
  /** Show every tag (past `maxVisible`). */
  expand: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TagsRootProps) => React.ReactElement;
}
export type TagsComponent = PinfoldComponent<TagsApi, TagsRootProps>;
