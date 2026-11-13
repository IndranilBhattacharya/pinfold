import type * as React from 'react';
import type { Length, ListFilter, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { NoInfer, SlotOverrides } from '../types';
import type { ListItem, LoadItems } from '../select/listbox';
import type { SelectVariant } from '../select/types';

export type ComboboxSlot =
  | 'root'
  | 'label'
  | 'control'
  | 'values'
  | 'chips'
  | 'chip'
  | 'chipRemove'
  | 'input'
  | 'clear'
  | 'chevron'
  | 'popup'
  | 'group'
  | 'groupLabel'
  | 'option'
  | 'check'
  | 'avatar'
  | 'icon'
  | 'detail'
  | 'endContent'
  | 'empty'
  | 'loadMore'
  | 'description'
  | 'error'
  | 'statusIcon'
  | 'validating';

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
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
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
  /** `loadItems` failed. @default 'Could not load results' */
  error?: React.ReactNode;
  /** The row under the list while the next page loads. @default 'Loading more…' */
  loadingMore?: React.ReactNode;
  /** The "+3" chip's name. Default `Show 3 more`. */
  more?: (count: number) => string;
  /** The chip that folds the chips again. @default 'Show less' */
  less?: string;
  /** Starts each chip's remove button name: "Remove Berlin". @default 'Remove' */
  remove?: string;
}

/** What a custom list body (`renderList`) gets: the rows, the state, and the actions. */
export interface ComboboxListContext {
  /** The rows to show (filtered, unless `loadItems` or `filter: 'none'`), each with its live state and `data` (your row). */
  items: ComboboxItemContext[];
  /** What is typed. */
  query: string;
  /** The chosen values. */
  value: readonly string[];
  /** Rows are being fetched (the first page). */
  loading: boolean;
  /** The next page is being fetched. */
  loadingMore: boolean;
  /** `loadItems` failed. */
  error: boolean;
  /** More rows follow (`hasMore`, or a page from `loadItems`). */
  hasMore: boolean;
  /** Fetch the next page now (it also happens on its own near the end of the scroll). */
  loadMore: () => void;
  /** Choose a value (one value: replace it and close). */
  select: (value: string, event?: React.SyntheticEvent) => void;
  /** Unchoose a value. */
  deselect: (value: string, event?: React.SyntheticEvent) => void;
  /** Choose or unchoose, as a click on a row does. */
  toggle: (value: string, event?: React.SyntheticEvent) => void;
  isSelected: (value: string) => boolean;
  /** The row the arrow keys are on (Enter chooses it), or null. */
  activeValue: string | null;
  setActiveValue: (value: string | null) => void;
  /**
   * Props for the element that shows a row: its id (for `aria-activedescendant`), the role that
   * matches `popupRole`, `aria-selected`, `data-active` / `data-selected`, and pointer handlers that
   * keep focus in the input and choose on click.
   */
  getRowProps: (value: string, props?: PropsBag) => PropsBag;
  close: () => void;
}

/** What `onCreate` may return: nothing (keep the text as the value), `false` (do not add), or the value to add. */
export type ComboboxCreateResult<V extends string = string> = void | undefined | false | V | ListItem<V>;

/** An option (with its live state) or a chosen chip (with `remove`). `render` overrides of the repeating parts get it as `item`. */
export type ComboboxItemContext = import('../select/listbox').ListItemContext;

interface ComboboxShared<V extends string> extends Omit<FieldConfig, 'error'>, Omit<FieldValidationConfig<V | null | V[]>, 'validate' | 'onValidate'>, SlotOverrides<ComboboxSlot, ComboboxState, ComboboxItemContext> {
  /** The rows: strings, or `{ value, label, description, icon, avatar, endContent, tone, group, disabled }` (extra fields reach `render` and `renderList` as `item.data`). Long lists draw only the rows in view. */
  items?: ReadonlyArray<ListItem<V> | V>;
  /** What is typed, controlled. */
  inputValue?: string;
  /** @default '' */
  defaultInputValue?: string;
  /** Every keystroke: fetch matching `items` here for a server search (with `filter: 'none'`). */
  onInputChange?: (text: string) => void;
  /**
   * Fetch the rows for what is typed (`''` when the list opens): the combobox waits `debounce` ms,
   * cancels a request that is no longer needed (`signal`), shows a loading row, keeps results per
   * query, and does not filter them again. `items` is then not needed. Return the rows, or a page
   * `{ items, hasMore, cursor }`: the next page is fetched (with `cursor` and `page`) as the list
   * scrolls near its end.
   */
  loadItems?: LoadItems<ListItem<V> | V>;
  /** Milliseconds `loadItems` and `onSearch` wait after the last keystroke. @default 250 */
  debounce?: number;
  /** Your own `items` have a next page: `onLoadMore` runs as the list scrolls near its end. @default false */
  hasMore?: boolean;
  /** Fetch the next page of your own `items` (set `loading` while it runs). Once per row count. */
  onLoadMore?: () => void;
  /** `(query)` once typing pauses for `debounce` ms: run your search here. */
  onSearch?: (query: string) => void;
  /**
   * With `allowCustom`, typed text is about to become a value: return nothing to keep the text,
   * `false` to refuse it, or the value to add (a row `{ value, label }` from your server); a promise
   * of one waits.
   */
  onCreate?: (text: string) => ComboboxCreateResult<V> | Promise<ComboboxCreateResult<V>>;
  /** A value left a multiple choice (a chip's remove, Backspace, the list, `deselect`): `(value, item)`. */
  onRemove?: (value: V, item: ComboboxItemContext) => void;
  /** The clear button emptied the field. */
  onClear?: () => void;
  /**
   * Your own dropdown body in place of the listbox: a table, cards, anything. It gets the rows, the
   * state and the actions (`select`, `deselect`, `getRowProps`...). The body owns its roles: say
   * which with `popupRole`.
   */
  renderList?: (context: ComboboxListContext) => React.ReactNode;
  /**
   * With `renderList`: the popup's role, also the input's `aria-haspopup`. `dialog` for free-form
   * content; `listbox`, `grid` or `tree` when your rows use `getRowProps` (the active row is then
   * `aria-activedescendant`). @default 'dialog'
   */
  popupRole?: 'dialog' | 'listbox' | 'grid' | 'tree';
  /** Multiple: chosen rows in the list keep a check, are shown but cannot be picked again, or leave the list. @default 'check' */
  selectedInList?: 'check' | 'disable' | 'hide';
  /**
   * Multiple: chips inside the field; as a tag group above or under it (every chip shows); or
   * `none` to draw them yourself (a Tag group bound to `value`). @default 'inside'
   */
  chipsPlacement?: 'inside' | 'above' | 'below' | 'none';
  /** Multiple: the chips' look; a row's `tone` colours its chip. @default 'soft' */
  chipVariant?: 'soft' | 'solid' | 'outline';
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
  /** Multiple: chips shown before a "+3" chip that shows the rest. Default 3 inside the field, all outside it. */
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
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
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
  /** Your check of the value: a message, nothing, or `{ status, message }`; may be async. */
  validate?: FieldValidationConfig<V | null>['validate'];
  /** After every validation run. */
  onValidate?: FieldValidationConfig<V | null>['onValidate'];
}

export interface ComboboxMultipleConfig<V extends string = string> extends ComboboxShared<V> {
  multiple: true;
  value?: ReadonlyArray<NoInfer<V>>;
  defaultValue?: ReadonlyArray<NoInfer<V>>;
  onChange?: (value: V[], event?: React.SyntheticEvent) => void;
  /** Your check of the values: a message, nothing, or `{ status, message }`; may be async. */
  validate?: FieldValidationConfig<V[]>['validate'];
  /** After every validation run. */
  onValidate?: FieldValidationConfig<V[]>['onValidate'];
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

export interface ComboboxApi extends FieldValidationApi {
  value: readonly string[];
  /** What is typed. */
  inputValue: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setValue: (value: readonly string[]) => void;
  /** Empty the value and the text. */
  clear: () => void;
  /** Fetch the next page now. */
  loadMore: () => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ComboboxRootProps) => React.ReactElement;
}
export type ComboboxComponent = PinfoldComponent<ComboboxApi, ComboboxRootProps>;
