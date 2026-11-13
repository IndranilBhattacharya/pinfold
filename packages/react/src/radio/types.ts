import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { ChoiceRow, FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { SlotOverrides } from '../types';

export type RadioSlot = 'root' | 'label' | 'items' | 'item' | 'input' | 'box' | 'itemLabel' | 'itemDescription' | 'itemStartContent' | 'itemEndContent' | 'description' | 'error' | 'statusIcon' | 'validating';
export type RadioVariant = 'plain' | 'card';

/** One row. */
export interface RadioItem extends ChoiceRow {
  /** The form value of this row. */
  value: string;
}

/** A group row as a slot `render` override receives it (`item`): the row plus its live state. */
export interface RadioItemContext extends RadioItem {
  index: number;
  checked: boolean;
}

/** Passed to slot `render` overrides. */
export interface RadioState {
  size: PinfoldSize;
  tone: PinfoldTone;
  invalid: boolean;
  /** The selected value, or null. */
  value: string | null;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

/** What an `icon` function receives, per row. */
export interface RadioIconState {
  checked: boolean;
  disabled: boolean;
}

export interface RadioDimensions {
  size?: Length;
  gap?: Length;
}

/**
 *   const Plan = defineRadio({ variant: 'card' });
 *   <Plan label="Plan" name="plan" items={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]} />
 */
export interface RadioConfig extends Omit<FieldConfig, 'error'>, FieldValidationConfig<string | null>, SlotOverrides<RadioSlot, RadioState, RadioItemContext> {
  /** One row each. */
  items: readonly RadioItem[];
  /** The selected value, controlled. */
  value?: string;
  /** The selected value when uncontrolled. A form reset returns to it. */
  defaultValue?: string;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** A radio took focus (`event.target` says which). */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** A radio lost focus. */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Any key on a radio. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** The mark in the circle, in place of the dot: a node, or a function of `{ checked, disabled }`. */
  icon?: React.ReactNode | ((state: RadioIconState) => React.ReactNode);
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** @default 'plain' */
  variant?: RadioVariant;
  /**
   * How the dot arrives: `spring` grows it with a little overshoot, `ripple` also sends a ring out.
   * Reduced motion and the provider's `disableAnimation` turn it off.
   * @default 'spring'
   */
  animation?: 'spring' | 'ripple' | 'none';
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: RadioDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type RadioRootProps = Omit<React.HTMLAttributes<HTMLFieldSetElement>, 'children' | 'onChange' | 'defaultValue' | 'id'> & { [key: `data-${string}`]: unknown };
export type RadioTagProps = RadioConfig & Omit<RadioRootProps, keyof RadioConfig>;

export interface RadioApi extends FieldValidationApi {
  /** Focus the selected row, or the first. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: RadioRootProps) => React.ReactElement;
}
export type RadioComponent = PinfoldComponent<RadioApi, RadioRootProps>;
