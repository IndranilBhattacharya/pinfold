import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { SlotOverrides } from '../types';

export type NumberFieldSlot = 'root' | 'label' | 'control' | 'input' | 'decrement' | 'increment' | 'startContent' | 'endContent' | 'description' | 'error' | 'statusIcon' | 'validating';
export type NumberFieldVariant = 'outline' | 'filled';
export type NumberFieldSteppers = 'split' | 'end' | 'none';

/** Passed to slot `render` overrides. */
export interface NumberFieldState {
  value: number | null;
  variant: NumberFieldVariant;
  size: PinfoldSize;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

/** A node, or a function of the field's live state. */
export type NumberFieldContent = React.ReactNode | ((state: NumberFieldState) => React.ReactNode);

export interface NumberFieldDimensions {
  width?: Length;
  height?: Length;
}

/**
 *   const Quantity = defineNumberField({ min: 1, max: 99 });
 *   <Quantity label="Quantity" name="qty" defaultValue={1} />
 */
export interface NumberFieldConfig extends Omit<FieldConfig, 'error'>, FieldValidationConfig<number | null>, SlotOverrides<NumberFieldSlot, NumberFieldState> {
  /** Controlled value; `null` is empty. */
  value?: number | null;
  /** Initial value when uncontrolled. A form reset returns to it. */
  defaultValue?: number;
  /** `value` is `null` when the field is empty. No `event` from the buttons. */
  onChange?: (value: number | null, event?: React.ChangeEvent<HTMLInputElement>) => void;
  /** The value settled: a stepper press ended, an arrow key was released, Enter, or the field was left after a change. The moment to save. */
  onValueCommit?: (value: number | null) => void;
  /** The native element took focus. */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** The native element lost focus (after `onValueCommit` and validation on blur). */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Any key in the native element; `preventDefault()` on Enter skips the commit. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
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
  /** The + button's icon. */
  incrementIcon?: React.ReactNode;
  /** The − button's icon. */
  decrementIcon?: React.ReactNode;
  /** Before the number: a currency, an icon. A node or a function of state. */
  startContent?: NumberFieldContent;
  /** After the number: a unit. A node or a function of state. */
  endContent?: NumberFieldContent;
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

export interface NumberFieldApi extends FieldValidationApi {
  /** The number shown now; `null` when empty. */
  value: number | null;
  /** One step up (1) or down (-1), as the buttons do. */
  step: (direction: 1 | -1) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: NumberFieldRootProps) => React.ReactElement;
}
export type NumberFieldComponent = PinfoldComponent<NumberFieldApi, NumberFieldRootProps>;
