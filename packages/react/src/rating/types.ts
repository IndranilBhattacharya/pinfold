import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type RatingSlot = 'root' | 'label' | 'symbols' | 'symbol' | 'value';

/** Passed to slot `render` overrides. */
export interface RatingState {
  size: PinfoldSize;
  tone: PinfoldTone;
  value: number;
  readOnly: boolean;
}

/**
 *   const Stars = defineRating({ allowHalf: true });
 *   <Stars label="Your rating" value={stars} onChange={setStars} />
 *   <Stars label="Average" value={4.3} readOnly showValue />
 */
export interface RatingConfig extends SlotOverrides<RatingSlot, RatingState> {
  /** Names the rating, e.g. "Rate this recipe". */
  label: string;
  /** @default false */
  hideLabel?: boolean;
  /** Controlled value (0 is none). */
  value?: number;
  /** @default 0 */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** @default 5 */
  max?: number;
  /** Half steps: 3.5. @default false */
  allowHalf?: boolean;
  /** Shown, not changed: the value is read as "4.3 out of 5". @default false */
  readOnly?: boolean;
  /** Choosing the current value again clears it. @default true */
  clearable?: boolean;
  /** @default false */
  disabled?: boolean;
  /** The number after the symbols, e.g. "4.5". @default false */
  showValue?: boolean;
  /** The symbol: a star by default; any node (a heart, an icon). */
  icon?: React.ReactNode;
  /** Spoken name of each value. Default "3 stars", "3.5 stars". */
  getValueLabel?: (value: number) => string;
  /** The form field name. */
  name?: string;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'warning' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type RatingRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type RatingTagProps = RatingConfig & Omit<RatingRootProps, keyof RatingConfig>;

export interface RatingApi {
  value: number;
  setValue: (value: number) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: RatingRootProps) => React.ReactElement;
}
export type RatingComponent = PinfoldComponent<RatingApi, RatingRootProps>;
