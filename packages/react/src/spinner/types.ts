import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type SpinnerSlot = 'root';
/** A colour role, or `current` to follow the surrounding text colour. */
export type SpinnerTone = PinfoldTone | 'current';

/** Passed to the `render.root` override. */
export interface SpinnerState {
  size: PinfoldSize;
  tone: SpinnerTone;
  /** `label: ''`: no role, hidden from assistive tech. */
  decorative: boolean;
}

export interface SpinnerDimensions {
  size?: Length;
  thickness?: Length;
}

/**
 *   const Loading = useSpinner({ label: 'Loading invoices' });
 *   return <Loading />;
 */
export interface SpinnerConfig extends SlotOverrides<SpinnerSlot, SpinnerState> {
  /**
   * What a screen reader announces. `''` makes the spinner decorative.
   * @default 'Loading'
   */
  label?: string;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: SpinnerTone;
  /** Exact measurements over the size preset. Numbers are px. */
  dimensions?: SpinnerDimensions;
  /**
   * Drop Pinfold classes; keep the role, label and data attributes.
   * @default false
   */
  unstyled?: boolean;
  /** Class on the root. */
  className?: string;
  /** Inline style on the root. */
  style?: React.CSSProperties;
}

export type SpinnerRootProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & { [key: `data-${string}`]: unknown };

export interface SpinnerApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SpinnerRootProps) => React.ReactElement;
}

export type SpinnerComponent = PinfoldComponent<SpinnerApi, SpinnerRootProps>;
