import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone } from '@pinfold/core';
import type { SlotOverrides } from '../types';

export type SpinnerSlot = 'root';

/** Passed to the `render.root` override. */
export interface SpinnerState {
  /** `label=""`: no role, hidden from assistive tech. */
  decorative: boolean;
}

export interface SpinnerDimensions {
  size?: Length;
  thickness?: Length;
}

/** The spinner's own options. Every other attribute goes to the element. */
export interface SpinnerOptions extends SlotOverrides<SpinnerSlot, SpinnerState> {
  /** Size preset. Unset follows the nearest control size. */
  size?: PinfoldSize;
  /** Colour role. Unset follows the surrounding text colour. */
  tone?: PinfoldTone;
  /**
   * What a screen reader announces. `''` makes the spinner decorative.
   * @default 'Loading'
   */
  label?: string;
  /** Exact measurements over the size preset. Numbers are px. */
  dimensions?: SpinnerDimensions;
  /**
   * Drop Pinfold classes; keep the role, label and data attributes.
   * @default false
   */
  unstyled?: boolean;
  /** Class on the root. */
  className?: string;
}

export interface SpinnerProps extends SpinnerOptions, Omit<React.HTMLAttributes<HTMLSpanElement>, keyof SpinnerOptions> {}
