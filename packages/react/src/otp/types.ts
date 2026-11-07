import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type OtpSlot = 'root' | 'label' | 'control' | 'input' | 'slots' | 'slot' | 'caret' | 'separator' | 'description' | 'error';
export type OtpVariant = 'outline' | 'filled' | 'underline';

/** Passed to slot `render` overrides. */
export interface OtpState {
  value: string;
  complete: boolean;
  variant: OtpVariant;
  size: PinfoldSize;
  invalid: boolean;
}

export interface OtpDimensions {
  slotSize?: Length;
  gap?: Length;
}

/**
 *   const Code = defineOtp({ groups: [3, 3] });
 *   <Code label="Verification code" name="code" onComplete={verify} />
 */
export interface OtpConfig extends FieldConfig, SlotOverrides<OtpSlot, OtpState> {
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
  /** Box groups with a separator between, e.g. `[3, 3]`. */
  groups?: readonly number[];
  /** @default '–' */
  separator?: React.ReactNode;
  /** @default false */
  mask?: boolean;
  /** @default 'outline' */
  variant?: OtpVariant;
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

export interface OtpApi {
  value: string;
  clear: () => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: OtpRootProps) => React.ReactElement;
}
export type OtpComponent = PinfoldComponent<OtpApi, OtpRootProps>;
