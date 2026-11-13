import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { SlotOverrides } from '../types';

export type SwitchVariant = 'solid' | 'slim' | 'icon' | 'outline';
export type SwitchSlot = 'root' | 'item' | 'input' | 'box' | 'thumb' | 'itemLabel' | 'description' | 'error' | 'statusIcon' | 'validating';

/** Passed to slot `render` overrides. */
export interface SwitchState {
  variant: SwitchVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  invalid: boolean;
  checked: boolean;
  disabled: boolean;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

export interface SwitchDimensions {
  width?: Length;
  height?: Length;
}

/**
 *   const Setting = defineSwitch({ labelPosition: 'start' });
 *   <Setting label="Email alerts" defaultChecked onChange={save} />
 */
export interface SwitchConfig extends Omit<FieldConfig, 'error'>, FieldValidationConfig<boolean>, SlotOverrides<SwitchSlot, SwitchState> {
  /** Controlled state. */
  checked?: boolean;
  /** @default false */
  defaultChecked?: boolean;
  /**
   * What the form submits when on.
   * @default 'on'
   */
  formValue?: string;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** The switch took focus. */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** The switch lost focus. */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Any key on the switch. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** What the thumb carries, in any variant: a node, or a function of state (`({ checked }) => checked ? <Sun /> : <Moon />`). */
  thumbIcon?: React.ReactNode | ((state: SwitchState) => React.ReactNode);
  /** @default 'end' */
  labelPosition?: 'end' | 'start';
  /**
   * `solid`: a filled track and a white thumb. `slim`: a thin rail under a larger thumb. `icon`: the
   * thumb carries a check or a cross. `outline`: a hollow track; the thumb takes the colour.
   * @default 'solid'
   */
  variant?: SwitchVariant;
  /**
   * `spring`: the thumb stretches while pressed and lands with a little overshoot. `slide`: a plain
   * glide. Reduced motion and the provider's `disableAnimation` turn it off.
   * @default 'spring'
   */
  animation?: 'spring' | 'slide' | 'none';
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: SwitchDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type SwitchRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultChecked' | 'id'> & { [key: `data-${string}`]: unknown };
export type SwitchTagProps = SwitchConfig & Omit<SwitchRootProps, keyof SwitchConfig>;

export interface SwitchApi extends FieldValidationApi {
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SwitchRootProps) => React.ReactElement;
}
export type SwitchComponent = PinfoldComponent<SwitchApi, SwitchRootProps>;
