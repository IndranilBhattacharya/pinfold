import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type InputSlot = 'root' | 'label' | 'control' | 'input' | 'startContent' | 'endContent' | 'clear' | 'description' | 'error';
export type InputType = 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';
export type InputVariant = 'outline' | 'filled';
export type InputElement = HTMLInputElement | HTMLTextAreaElement;

/** Passed to slot `render` overrides. */
export interface InputState {
  variant: InputVariant;
  size: PinfoldSize;
  invalid: boolean;
  disabled: boolean;
  hasValue: boolean;
}

export interface InputDimensions {
  width?: Length;
  height?: Length;
  paddingX?: Length;
  radius?: Length;
}

/**
 *   const Email = defineInput({ type: 'email', autoComplete: 'email', required: true });
 *   <Email label="Work email" name="email" />
 */
export interface InputConfig extends FieldConfig, SlotOverrides<InputSlot, InputState> {
  /** @default 'text' */
  type?: InputType;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. A form reset returns to it. */
  defaultValue?: string;
  /** `event` is absent when the clear button did it. */
  onChange?: (value: string, event?: React.ChangeEvent<InputElement>) => void;
  placeholder?: string;
  /** Native `autocomplete`, e.g. `email`. */
  autoComplete?: string;
  /** Native `inputmode`, e.g. `numeric`. */
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  /** @default false */
  readOnly?: boolean;
  /** @default false */
  multiline?: boolean;
  /** @default 3 */
  rows?: number;
  /** @default false */
  autosize?: boolean;
  /** Before the text: an icon or a unit. */
  startContent?: React.ReactNode;
  /** After the text. */
  endContent?: React.ReactNode;
  /** @default false */
  clearable?: boolean;
  /** @default 'Clear' */
  clearLabel?: string;
  /** @default 'outline' */
  variant?: InputVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  dimensions?: InputDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type InputRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue' | 'id' | 'inputMode'> & { [key: `data-${string}`]: unknown };
export type InputTagProps = InputConfig & Omit<InputRootProps, keyof InputConfig>;

export interface InputApi {
  focus: () => void;
  /** Empty the field, as the clear button does. */
  clear: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: InputRootProps) => React.ReactElement;
}
export type InputComponent = PinfoldComponent<InputApi, InputRootProps>;
