import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { SlotOverrides } from '../types';

export type InputSlot = 'root' | 'label' | 'control' | 'field' | 'input' | 'startContent' | 'endContent' | 'clear' | 'reveal' | 'handle' | 'description' | 'counter' | 'error' | 'statusIcon' | 'validating';
export type InputType = 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';
export type InputVariant = 'outline' | 'filled' | 'underline';
export type InputElement = HTMLInputElement | HTMLTextAreaElement;

/** Passed to slot `render` overrides. */
export interface InputState {
  variant: InputVariant;
  size: PinfoldSize;
  invalid: boolean;
  disabled: boolean;
  hasValue: boolean;
  labelPlacement: 'outside' | 'inside';
  readOnly: boolean;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

/** A node, or a function of the field's live state. */
export type InputContent = React.ReactNode | ((state: InputState) => React.ReactNode);

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
export interface InputConfig extends Omit<FieldConfig, 'error'>, FieldValidationConfig<string>, SlotOverrides<InputSlot, InputState> {
  /** @default 'text' */
  type?: InputType;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. A form reset returns to it. */
  defaultValue?: string;
  /** `event` is absent when the clear button did it. */
  onChange?: (value: string, event?: React.ChangeEvent<InputElement>) => void;
  /** The native element took focus. */
  onFocus?: (event: React.FocusEvent<InputElement>) => void;
  /** The native element lost focus (after validation on blur ran). */
  onBlur?: (event: React.FocusEvent<InputElement>) => void;
  /** Any key in the native element; `preventDefault()` stops `onEnter`. */
  onKeyDown?: (event: React.KeyboardEvent<InputElement>) => void;
  /** Enter in a one-line field, Ctrl or Cmd + Enter in a multiline one: `(value, event)`. The form still submits natively unless you prevent it. */
  onEnter?: (value: string, event: React.KeyboardEvent<InputElement>) => void;
  /** The clear button (or `clear()`) emptied the field. */
  onClear?: () => void;
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
  /**
   * Multiline: a drag handle in the corner to change the height. Not with `autosize`.
   * @default 'vertical'
   */
  resize?: 'vertical' | 'none';
  /** Multiline: the drag handle's icon, in place of the two lines. */
  resizeIcon?: React.ReactNode;
  /** Before the text: an icon, a unit, a button. A node or a function of state. */
  startContent?: InputContent;
  /** After the text. A node or a function of state. */
  endContent?: InputContent;
  /** @default false */
  clearable?: boolean;
  /** @default 'Clear' */
  clearLabel?: string;
  /** The clear button's icon, in place of the cross. */
  clearIcon?: React.ReactNode;
  /** Password: a button that shows and hides the text. @default false */
  revealable?: boolean;
  /** @default 'Show password' */
  revealLabel?: string;
  /** A character count under the field: "12/80" with `maxLength`, and "20 characters left" read once typing pauses. @default false */
  showCount?: boolean;
  /** What is read as the limit nears, for translation: `(left) => string`. Default "20 characters left". */
  countLabel?: (left: number) => string;
  /**
   * `outside`: above the field. `inside`: in the field, rising to its top edge on focus or once it
   * has a value (a floating label).
   * @default 'outside'
   */
  labelPlacement?: 'outside' | 'inside';
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

export interface InputApi extends FieldValidationApi {
  focus: () => void;
  /** Empty the field, as the clear button does. */
  clear: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: InputRootProps) => React.ReactElement;
}
export type InputComponent = PinfoldComponent<InputApi, InputRootProps>;
