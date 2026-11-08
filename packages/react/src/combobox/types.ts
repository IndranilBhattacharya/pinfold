import type * as React from 'react';
import type { Length, ListFilter, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { NoInfer, SlotOverrides } from '../types';
import type { ListItem } from '../select/listbox';
import type { SelectVariant } from '../select/types';

export type ComboboxSlot =
  | 'root'
  | 'label'
  | 'control'
  | 'chip'
  | 'input'
  | 'clear'
  | 'chevron'
  | 'popup'
  | 'group'
  | 'groupLabel'
  | 'option'
  | 'check'
  | 'icon'
  | 'detail'
  | 'empty'
  | 'description'
  | 'error';

/** Passed to slot `render` overrides. */
export interface ComboboxState {
  variant: SelectVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  open: boolean;
  multiple: boolean;
  invalid: boolean;
  disabled: boolean;
  loading: boolean;
  value: readonly string[];
  /** What is typed. */
  query: string;
}

export interface ComboboxDimensions {
  width?: Length;
  maxHeight?: Length;
}

/** Text shown and read, for translation. */
export interface ComboboxLabels {
  /** @default 'No results' */
  empty?: React.ReactNode;
  /** @default 'Loading…' */
  loading?: React.ReactNode;
  /** @default 'Clear' */
  clear?: string;
  /** With `allowCustom`, the row that adds what was typed. Default `Add "…"`. */
  create?: (text: string) => React.ReactNode;
}

interface ComboboxShared<V extends string> extends FieldConfig, SlotOverrides<ComboboxSlot, ComboboxState> {
  /** The rows: strings, or `{ value, label, description, icon, group, disabled }`. */
  items: ReadonlyArray<ListItem<V> | V>;
  /** What is typed, controlled. */
  inputValue?: string;
  /** @default '' */
  defaultInputValue?: string;
  /** Every keystroke: fetch matching `items` here for a server search (with `filter: 'none'`). */
  onInputChange?: (text: string) => void;
  /** How typing narrows the rows; `none` when your `items` are already the results. @default 'contains' */
  filter?: ListFilter;
  /** What was typed becomes a value of its own (a tag input with `multiple`). @default false */
  allowCustom?: boolean;
  /** Rows being fetched: a loading row, and `aria-busy`. @default false */
  loading?: boolean;
  /** Mark the typed text in each row. @default true */
  highlight?: boolean;
  /** Open on focus, before anything is typed. @default false */
  openOnFocus?: boolean;
  /** @default false */
  clearable?: boolean;
  /** Multiple: chips shown before "+3". @default 3 */
  maxChips?: number;
  placeholder?: string;
  labels?: ComboboxLabels;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** @default 'bottom-start' */
  placement?: OverlayPlacement;
  /** @default 'outline' */
  variant?: SelectVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: ComboboxDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface ComboboxSingleConfig<V extends string = string> extends ComboboxShared<V> {
  /** @default false */
  multiple?: false;
  /** The chosen value, controlled; `null` for none. */
  value?: NoInfer<V> | null;
  defaultValue?: NoInfer<V>;
  onChange?: (value: V | null, event?: React.SyntheticEvent) => void;
}

export interface ComboboxMultipleConfig<V extends string = string> extends ComboboxShared<V> {
  multiple: true;
  value?: ReadonlyArray<NoInfer<V>>;
  defaultValue?: ReadonlyArray<NoInfer<V>>;
  onChange?: (value: V[], event?: React.SyntheticEvent) => void;
}

/**
 *   const Search = defineCombobox();
 *   <Search label="City" items={cities} onChange={setCity} />
 *   <Search label="Repository" items={results} filter="none" loading={isFetching} onInputChange={setQuery} />
 *   <Search label="Tags" multiple allowCustom items={suggestions} onChange={setTags} />
 */
export type ComboboxConfig<V extends string = string> = ComboboxSingleConfig<V> | ComboboxMultipleConfig<V>;

export type ComboboxRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type ComboboxTagProps<V extends string = string> = ComboboxConfig<V> & Omit<ComboboxRootProps, keyof ComboboxShared<V> | 'multiple' | 'value' | 'defaultValue' | 'onChange'>;

export interface ComboboxApi {
  value: readonly string[];
  /** What is typed. */
  inputValue: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setValue: (value: readonly string[]) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ComboboxRootProps) => React.ReactElement;
}
export type ComboboxComponent = PinfoldComponent<ComboboxApi, ComboboxRootProps>;
