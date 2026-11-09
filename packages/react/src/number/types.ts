import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type NumberFieldSlot = 'root' | 'label' | 'control' | 'input' | 'decrement' | 'increment' | 'startContent' | 'endContent' | 'description' | 'error';
export type NumberFieldVariant = 'outline' | 'filled';
export type NumberFieldSteppers = 'split' | 'end' | 'none';

/** Passed to slot `render` overrides. */
export interface NumberFieldState {
  value: number | null;
  variant: NumberFieldVariant;
  size: PinfoldSize;
  invalid: boolean;
  disabled: boolean;
}

export interface NumberFieldDimensions {
  width?: Length;
  height?: Length;
}

/**
 *   const Quantity = defineNumberField({ min: 1, max: 99 });
 *   <Quantity label="Quantity" name="qty" defaultValue={1} />
 */
export interface NumberFieldConfig extends FieldConfig, SlotOverrides<NumberFieldSlot, NumberFieldState> {
  /** Controlled value; `null` is empty. */
  value?: number | null;
  /** Initial value when uncontrolled. A form reset returns to it. */
  defaultValue?: number;
  /** `value` is `null` when the field is empty. No `event` from the buttons. */
  onChange?: (value: number | null, event?: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  /** @default 1 */
  step?: number;
  placeholder?: string;
  /** @default false */
  readOnly?: boolean;
  /** @default 'split' */
  steppers?: NumberFieldSteppers;
  /** @default 'Increase' */
  incrementLabel?: string;
  /** @default 'Decrease' */
  decrementLabel?: string;
  /** Before the number: a currency, an icon. */
  startContent?: React.ReactNode;
  /** After the number: a unit. */
  endContent?: React.ReactNode;
  /** @default 'outline' */
  variant?: NumberFieldVariant;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  dimensions?: NumberFieldDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type NumberFieldRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue' | 'id' | 'inputMode'> & { [key: `data-${string}`]: unknown };
export type NumberFieldTagProps = NumberFieldConfig & Omit<NumberFieldRootProps, keyof NumberFieldConfig>;

export interface NumberFieldApi {
  /** The number shown now; `null` when empty. */
  value: number | null;
  /** One step up (1) or down (-1), as the buttons do. */
  step: (direction: 1 | -1) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: NumberFieldRootProps) => React.ReactElement;
}
export type NumberFieldComponent = PinfoldComponent<NumberFieldApi, NumberFieldRootProps>;
