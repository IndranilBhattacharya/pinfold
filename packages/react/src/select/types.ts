import type * as React from 'react';
import type { Length, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
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
  | 'clear'
  | 'chevron'
  | 'popup'
  | 'group'
  | 'groupLabel'
  | 'option'
  | 'check'
  | 'icon'
  | 'detail'
  | 'description'
  | 'empty'
  | 'error';
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
}

export interface SelectDimensions {
  /** Width of the field. */
  width?: Length;
  /** Tallest the list gets before it scrolls. */
  maxHeight?: Length;
}

interface SelectShared<V extends string> extends FieldConfig, SlotOverrides<SelectSlot, SelectState> {
  /** The rows: strings, or `{ value, label, description, icon, group, disabled }`. */
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
}

export interface SelectMultipleConfig<V extends string = string> extends SelectShared<V> {
  multiple: true;
  value?: ReadonlyArray<NoInfer<V>>;
  defaultValue?: ReadonlyArray<NoInfer<V>>;
  onChange?: (value: V[], event?: React.SyntheticEvent) => void;
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

export interface SelectApi {
  /** The chosen values (one at most without `multiple`). */
  value: readonly string[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Choose values (none with `[]`). */
  setValue: (value: readonly string[]) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SelectRootProps) => React.ReactElement;
}
export type SelectComponent = PinfoldComponent<SelectApi, SelectRootProps>;
