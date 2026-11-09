import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { ChoiceRow, FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type RadioSlot = 'root' | 'label' | 'items' | 'item' | 'input' | 'box' | 'itemLabel' | 'itemDescription' | 'description' | 'error';
export type RadioVariant = 'plain' | 'card';

/** One row. */
export interface RadioItem extends ChoiceRow {
  /** The form value of this row. */
  value: string;
}

/** Passed to slot `render` overrides. */
export interface RadioState {
  size: PinfoldSize;
  tone: PinfoldTone;
  invalid: boolean;
}

export interface RadioDimensions {
  size?: Length;
  gap?: Length;
}

/**
 *   const Plan = defineRadio({ variant: 'card' });
 *   <Plan label="Plan" name="plan" items={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]} />
 */
export interface RadioConfig extends FieldConfig, SlotOverrides<RadioSlot, RadioState> {
  /** One row each. */
  items: readonly RadioItem[];
  /** The selected value, controlled. */
  value?: string;
  /** The selected value when uncontrolled. A form reset returns to it. */
  defaultValue?: string;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
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

export interface RadioApi {
  /** Focus the selected row, or the first. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: RadioRootProps) => React.ReactElement;
}
export type RadioComponent = PinfoldComponent<RadioApi, RadioRootProps>;
