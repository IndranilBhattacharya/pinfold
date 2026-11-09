import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type ProgressSlot = 'root' | 'label' | 'value' | 'track' | 'indicator';
export type ProgressKind = 'progress' | 'meter';
export type ProgressShape = 'bar' | 'circle';

/** Passed to slot `render` overrides. */
export interface ProgressState {
  kind: ProgressKind;
  shape: ProgressShape;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** 0–100, or `null` while indeterminate. */
  percent: number | null;
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
export interface ProgressConfig extends SlotOverrides<ProgressSlot, ProgressState> {
  /** Leave unset for an indeterminate progress. */
  value?: number;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** What is progressing; also the accessible name. */
  label?: React.ReactNode;
  /** @default false */
  hideLabel?: boolean;
  /** @default true */
  showValue?: boolean;
  /** The value text, shown and read. Default: a whole percentage in the reader's locale. */
  formatValue?: (value: number, range: { min: number; max: number; percent: number }) => string;
  /** @default 'progress' */
  kind?: ProgressKind;
  /** @default 'bar' */
  shape?: ProgressShape;
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
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ProgressRootProps) => React.ReactElement;
}
export type ProgressComponent = PinfoldComponent<ProgressApi, ProgressRootProps>;
