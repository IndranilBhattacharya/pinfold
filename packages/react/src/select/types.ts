import type * as React from 'react';
import type { Length, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { NoInfer, SlotOverrides } from '../types';
import type { ListItem } from './listbox';

export type { ListItem as SelectItem } from './listbox';
export type SelectSlot =
  | 'root'
  | 'label'
  | 'control'
  | 'value'
  | 'placeholder'
  | 'chip'
  | 'chipRemove'
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
  | 'description'
  | 'empty'
  | 'error'
  | 'statusIcon'
  | 'validating';
export type SelectVariant = 'outline' | 'filled' | 'underline';

/** Passed to slot `render` overrides. */
export interface SelectState {
  variant: SelectVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  open: boolean;
  multiple: boolean;
  invalid: boolean;
  disabled: boolean;
  /** The chosen values. */
  value: readonly string[];
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

export interface SelectDimensions {
  /** Width of the field. */
  width?: Length;
  /** Tallest the list gets before it scrolls. */
  maxHeight?: Length;
}

/** An option (with its live state) or a chosen chip (with `remove`). `render` overrides of the repeating parts get it as `item`. */
export type SelectItemContext = import('./listbox').ListItemContext;

interface SelectShared<V extends string> extends Omit<FieldConfig, 'error'>, Omit<FieldValidationConfig<V | null | V[]>, 'validate' | 'onValidate'>, SlotOverrides<SelectSlot, SelectState, SelectItemContext> {
  /** The rows: strings, or `{ value, label, description, icon, avatar, endContent, tone, group, disabled }` (extra fields reach `render` as `item.data`). */
  items: ReadonlyArray<ListItem<V> | V>;
  /** @default 'Select…' */
  placeholder?: string;
  /** A button that empties the field. @default false */
  clearable?: boolean;
  /** @default 'Clear' */
  clearLabel?: string;
  /** Multiple: chips with a remove button each, or the labels as text. @default 'chips' */
  display?: 'chips' | 'text';
  /** Multiple: chips shown before "+3". @default 3 */
  maxChips?: number;
  /** Multiple: the chips' look; a row's `tone` colours its chip. @default 'soft' */
  chipVariant?: 'soft' | 'solid' | 'outline';
  /**
   * Draw the chosen value yourself, in the field: `(selected, state) => node`. `selected` holds each
   * chosen row with its state and `remove`. Empty when nothing is chosen (the placeholder shows).
   */
  renderValue?: (selected: SelectItemContext[], state: SelectState) => React.ReactNode;
  /** Multiple: a chip's remove mark unchose a value: `(value, item)`. */
  onRemove?: (value: V, item: SelectItemContext) => void;
  /** The clear button emptied the field. */
  onClear?: () => void;
  /** @default 'No options' */
  emptyText?: React.ReactNode;
  /** The list, controlled. */
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
  dimensions?: SelectDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface SelectSingleConfig<V extends string = string> extends SelectShared<V> {
  /** One value, or several with `multiple`. @default false */
  multiple?: false;
  /** The chosen value, controlled; `null` for none. */
  value?: NoInfer<V> | null;
  defaultValue?: NoInfer<V>;
  /** `(value, event)`: `null` when cleared. */
  onChange?: (value: V | null, event?: React.SyntheticEvent) => void;
  /** Your check of the value: a message, nothing, or `{ status, message }`; may be async. */
  validate?: FieldValidationConfig<V | null>['validate'];
  /** After every validation run. */
  onValidate?: FieldValidationConfig<V | null>['onValidate'];
}

export interface SelectMultipleConfig<V extends string = string> extends SelectShared<V> {
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
 *   const Field = defineSelect();
 *   <Field label="Country" items={['India', 'Japan', 'Kenya']} />
 *   <Field label="Plan" items={plans} value={plan} onChange={setPlan} />
 *   <Field label="Labels" multiple items={labels} defaultValue={['bug']} />
 */
export type SelectConfig<V extends string = string> = SelectSingleConfig<V> | SelectMultipleConfig<V>;

export type SelectRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type SelectTagProps<V extends string = string> = SelectConfig<V> & Omit<SelectRootProps, keyof SelectShared<V> | 'multiple' | 'value' | 'defaultValue' | 'onChange'>;

export interface SelectApi extends FieldValidationApi {
  /** The chosen values (one at most without `multiple`). */
  value: readonly string[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Choose values (none with `[]`). */
  setValue: (value: readonly string[]) => void;
  /** Empty the value. */
  clear: () => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SelectRootProps) => React.ReactElement;
}
export type SelectComponent = PinfoldComponent<SelectApi, SelectRootProps>;
