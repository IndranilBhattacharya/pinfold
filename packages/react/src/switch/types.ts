import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type SwitchSlot = 'root' | 'item' | 'input' | 'box' | 'thumb' | 'itemLabel' | 'description' | 'error';

/** Passed to slot `render` overrides. */
export interface SwitchState {
  size: PinfoldSize;
  tone: PinfoldTone;
  invalid: boolean;
}

export interface SwitchDimensions {
  width?: Length;
  height?: Length;
}

/**
 *   const Setting = defineSwitch({ labelPosition: 'start' });
 *   <Setting label="Email alerts" defaultChecked onChange={save} />
 */
export interface SwitchConfig extends FieldConfig, SlotOverrides<SwitchSlot, SwitchState> {
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
  /** @default 'end' */
  labelPosition?: 'end' | 'start';
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

export interface SwitchApi {
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SwitchRootProps) => React.ReactElement;
}
export type SwitchComponent = PinfoldComponent<SwitchApi, SwitchRootProps>;
