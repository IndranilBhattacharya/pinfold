import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type ProgressSlot = 'root' | 'label' | 'value' | 'track' | 'indicator' | 'buffer' | 'segment' | 'description' | 'start' | 'end';
export type ProgressKind = 'progress' | 'meter';
export type ProgressShape = 'bar' | 'circle' | 'semicircle';
export type ProgressVariant = 'solid' | 'striped' | 'segmented';
export type ProgressValuePosition = 'auto' | 'top' | 'bottom' | 'end' | 'inside';
/** A node, or a function of the progress state that returns one. */
export type ProgressContent = React.ReactNode | ((state: ProgressState) => React.ReactNode);
/** One step of `tones`: from `at` (in value units) up, the progress takes `tone`. */
export interface ProgressToneStep {
  at: number;
  tone: PinfoldTone;
}
/** A segment's entry, handed to `render.segment` / `render.indicator` overrides as `item`. */
export interface ProgressSegmentItem {
  index: number;
  /** How full this segment is, 0–100. */
  fill: number;
}

/** Passed to slot `render` overrides. */
export interface ProgressState {
  kind: ProgressKind;
  shape: ProgressShape;
  size: PinfoldSize;
  /** The resolved tone, after `tones`. */
  tone: PinfoldTone;
  variant: ProgressVariant;
  /** 0–100, or `null` while indeterminate. */
  percent: number | null;
  /** The value as given (a meter without one reads `min`). */
  value: number | undefined;
  min: number;
  max: number;
  /** The buffer as 0–100, or `null`. */
  bufferPercent: number | null;
  /** The value text, as read (`aria-valuetext`). */
  text: string | undefined;
  indeterminate: boolean;
  /** The value is at `max`. */
  complete: boolean;
  /** The resolved value position. */
  valuePosition: Exclude<ProgressValuePosition, 'auto'>;
}

export interface ProgressDimensions {
  thickness?: Length;
  size?: Length;
  width?: Length;
}

/**
 *   const Upload = defineProgress({ showValue: true });
 *   <Upload label="Uploading report.pdf" value={progress} />
 */
export interface ProgressConfig extends SlotOverrides<ProgressSlot, ProgressState, ProgressSegmentItem> {
  /** Leave unset for an indeterminate progress. */
  value?: number;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** A secondary value ahead of `value` (loaded vs played), drawn lighter behind the indicator. */
  buffer?: number;
  /** What is progressing, or a function of the state; also the accessible name. */
  label?: ProgressContent;
  /** A line under the progress ("3 of 12 files"), or a function of the state. Linked with `aria-describedby`. */
  description?: ProgressContent;
  /** A node before the bar or ring (an icon), or a function of the state. */
  startContent?: ProgressContent;
  /** A node after the bar or ring (a cancel button), or a function of the state. */
  endContent?: ProgressContent;
  /** @default false */
  hideLabel?: boolean;
  /** @default true */
  showValue?: boolean;
  /**
   * Where the value text goes. `auto`: above a bar, inside a ring or gauge.
   * @default 'auto'
   */
  valuePosition?: ProgressValuePosition;
  /** The visible value: a node or `(state) => node`. Screen readers still hear `formatValue`. */
  valueLabel?: ProgressContent;
  /** The value text, shown and read. Default: a whole percentage in the reader's locale. */
  formatValue?: (value: number, range: { min: number; max: number; percent: number }) => string;
  /** @default 'progress' */
  kind?: ProgressKind;
  /**
   * A bar, a ring, or a half ring (a gauge).
   * @default 'bar'
   */
  shape?: ProgressShape;
  /**
   * `solid`; `striped` (moving stripes, bar only); `segmented` (`segments` equal steps).
   * @default 'solid'
   */
  variant?: ProgressVariant;
  /**
   * Steps of a segmented progress (2 to 48).
   * @default 5
   */
  segments?: number;
  /** Tone by value: `[{ at: 90, tone: 'danger' }]`. Below every step, `tone` applies. */
  tones?: readonly ProgressToneStep[];
  /** Called once each time the value reaches `max` from below. */
  onComplete?: () => void;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: ProgressDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ProgressRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type ProgressTagProps = ProgressConfig & Omit<ProgressRootProps, keyof ProgressConfig>;

export interface ProgressApi {
  /** The live state: percent, tone, completion. */
  state: ProgressState;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ProgressRootProps) => React.ReactElement;
}
export type ProgressComponent = PinfoldComponent<ProgressApi, ProgressRootProps>;
