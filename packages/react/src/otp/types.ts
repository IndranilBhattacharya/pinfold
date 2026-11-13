import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { SlotOverrides } from '../types';

export type OtpSlot = 'root' | 'label' | 'control' | 'input' | 'slots' | 'slot' | 'caret' | 'separator' | 'description' | 'error' | 'statusIcon' | 'validating';
export type OtpVariant = 'outline' | 'filled' | 'underline';

/** Passed to slot `render` overrides. */
export interface OtpState {
  value: string;
  complete: boolean;
  variant: OtpVariant;
  size: PinfoldSize;
  invalid: boolean;
  focused: boolean;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

export interface OtpDimensions {
  slotSize?: Length;
  gap?: Length;
}

/**
 *   const Code = defineOtp({ groups: [3, 3] });
 *   <Code label="Verification code" name="code" onComplete={verify} />
 */
export interface OtpConfig extends Omit<FieldConfig, 'error'>, FieldValidationConfig<string>, SlotOverrides<OtpSlot, OtpState> {
  /** @default 6 */
  length?: number;
  /** @default 'numeric' */
  type?: 'numeric' | 'alphanumeric';
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Once every box is filled: the moment to verify. */
  onComplete?: (value: string) => void;
  /** Text was pasted: `(text, event)`, before it is sanitized. `event.preventDefault()` cancels the paste. */
  onPaste?: (text: string, event: React.ClipboardEvent<HTMLInputElement>) => void;
  /** The code took focus. */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** The code lost focus (after validation on blur ran). */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Any key in the code. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Box groups with a separator between, e.g. `[3, 3]`. */
  groups?: readonly number[];
  /**
   * What sits between groups: a node, or `(index) => node` for each separator (0 first).
   * @default '–'
   */
  separator?: React.ReactNode | ((index: number) => React.ReactNode);
  /** @default false */
  mask?: boolean;
  /**
   * What a masked box shows.
   * @default '•'
   */
  maskChar?: React.ReactNode;
  /** A faint mark in each empty box, e.g. `'·'`. */
  placeholder?: string;
  /** @default 'outline' */
  variant?: OtpVariant;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  dimensions?: OtpDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type OtpRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue' | 'id'> & { [key: `data-${string}`]: unknown };
export type OtpTagProps = OtpConfig & Omit<OtpRootProps, keyof OtpConfig>;

export interface OtpApi extends FieldValidationApi {
  value: string;
  clear: () => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: OtpRootProps) => React.ReactElement;
}
export type OtpComponent = PinfoldComponent<OtpApi, OtpRootProps>;
