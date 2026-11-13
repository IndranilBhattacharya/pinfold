import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type SpinnerSlot = 'root';
export type SpinnerVariant = 'ring' | 'arc' | 'dots' | 'bars' | 'pulse' | 'orbit' | 'dual' | 'track';
export type SpinnerSpeed = 'slow' | 'normal' | 'fast';
export type SpinnerThickness = 'thin' | 'normal' | 'thick';
/** A colour role, or `current` to follow the surrounding text colour. */
export type SpinnerTone = PinfoldTone | 'current';

/** Passed to the `render.root` override. */
export interface SpinnerState {
  variant: SpinnerVariant;
  size: PinfoldSize;
  tone: SpinnerTone;
  speed: SpinnerSpeed;
  thickness: SpinnerThickness;
  /** `label: ''`: no role, hidden from assistive tech. */
  decorative: boolean;
}

export interface SpinnerDimensions {
  size?: Length;
  thickness?: Length;
  duration?: Length;
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
  /**
   * The animation: `ring`, `arc` (a comet), `dots`, `bars` (an equaliser), `pulse`, `orbit`,
   * `dual` (two counter-turning rings) or `track` (an arc that grows and shrinks on a visible track).
   * @default 'ring'
   */
  variant?: SpinnerVariant;
  /**
   * Pace of the cycle. `dimensions.duration` sets an exact one.
   * @default 'normal'
   */
  speed?: SpinnerSpeed;
  /**
   * Stroke weight of `ring`, `arc`, `dual`, `track` and `orbit`. `dimensions.thickness` sets an exact one.
   * @default 'normal'
   */
  thickness?: SpinnerThickness;
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

/** `<Spinner>` and preset props: the config plus any attribute of the element. */
export type SpinnerTagProps = SpinnerConfig & Omit<SpinnerRootProps, keyof SpinnerConfig>;

export interface SpinnerApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SpinnerRootProps) => React.ReactElement;
}

export type SpinnerComponent = PinfoldComponent<SpinnerApi, SpinnerRootProps>;
