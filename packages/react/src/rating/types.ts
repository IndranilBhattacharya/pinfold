import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type RatingSlot = 'root' | 'label' | 'symbols' | 'symbol' | 'value' | 'hint';

/** Passed to slot `render` overrides. */
export interface RatingState {
  size: PinfoldSize;
  tone: PinfoldTone;
  value: number;
  readOnly: boolean;
  /** The value under the pointer while it previews one, else null. */
  hover: number | null;
}

/** One symbol, as an `icon` / `emptyIcon` function and a `render.symbol` override get it. */
export interface RatingSymbolContext {
  /** 0 for the first symbol. */
  index: number;
  /** The value this symbol stands for (`index + 1`). */
  value: number;
  /** How full it is now: 0, 0.5 or 1 (the preview while hovering). */
  fill: number;
  /** The pointer is previewing a value. */
  previewing: boolean;
  /** Its label from `valueLabels`. */
  label?: string;
}

/** A symbol: a node, or a function of the symbol's state (a face per value, a different shape when full). */
export type RatingIcon = React.ReactNode | ((symbol: RatingSymbolContext) => React.ReactNode);

/**
 *   const Stars = defineRating({ allowHalf: true });
 *   <Stars label="Your rating" value={stars} onChange={setStars} />
 *   <Stars label="Average" value={4.3} readOnly showValue />
 */
export interface RatingConfig extends SlotOverrides<RatingSlot, RatingState, RatingSymbolContext> {
  /** Names the rating, e.g. "Rate this recipe". */
  label: string;
  /** @default false */
  hideLabel?: boolean;
  /** Controlled value (0 is none). */
  value?: number;
  /** @default 0 */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** The pointer previews a value: `(value)`, `null` when it leaves. */
  onHover?: (value: number | null) => void;
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
  /** The symbol: a star by default; any node (a heart, an icon), or a function of the symbol's state. */
  icon?: RatingIcon;
  /** The empty symbol, when it differs (an outline): a node or a function of the symbol's state. Default `icon`, faint. */
  emptyIcon?: RatingIcon;
  /** Spoken name of each value. Default "3 stars", "3.5 stars". */
  getValueLabel?: (value: number) => string;
  /**
   * A word per whole value, `['Poor', 'Fair', 'Good', 'Great', 'Superb']`: shown after the symbols
   * for the value under the pointer (else the chosen one), as each symbol's tooltip, and as the
   * spoken name when `getValueLabel` is not set.
   */
  valueLabels?: readonly string[];
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
