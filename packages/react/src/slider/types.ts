import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type SliderSlot = 'root' | 'label' | 'value' | 'control' | 'track' | 'range' | 'steps' | 'input' | 'thumb' | 'marks' | 'mark' | 'startContent' | 'endContent' | 'description' | 'error';

/** A tick on the track. */
export interface SliderMark {
  value: number;
  label?: React.ReactNode;
}

/** Passed to slot `render` overrides. */
export interface SliderState {
  size: PinfoldSize;
  tone: PinfoldTone;
  values: number[];
  range: boolean;
  variant: 'line' | 'bar' | 'minimal';
  invalid: boolean;
}

export interface SliderDimensions {
  thickness?: Length;
  thumbSize?: Length;
}

/**
 *   const Price = defineSlider({ min: 0, max: 500, step: 10, formatValue: (v) => '$' + v });
 *   <Price label="Price" defaultValue={[50, 300]} />
 */
export interface SliderConfig extends Omit<FieldConfig, 'required' | 'nativeErrors'>, SlotOverrides<SliderSlot, SliderState> {
  /** Controlled values: one number, or two for a range. */
  value?: readonly number[];
  /** Initial values when uncontrolled: `[40]`, or `[20, 80]` for a range. Default `[min]`. */
  defaultValue?: readonly number[];
  /** While dragging. */
  onChange?: (values: number[], event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Once the pointer or key is released: the moment to save. */
  onChangeEnd?: (values: number[]) => void;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** @default 1 */
  step?: number;
  /** @default 0 */
  minGap?: number;
  /** Ticks on the track. */
  marks?: readonly SliderMark[];
  /**
   * The thumbs stop only on `marks`; `step` is then unused.
   * @default false
   */
  snapToMarks?: boolean;
  /**
   * A dot at every step, up to 40 steps.
   * @default false
   */
  showSteps?: boolean;
  /** @default 'line' */
  variant?: 'line' | 'bar' | 'minimal';
  /** Before the track (decorative). */
  startContent?: React.ReactNode;
  /** After the track (decorative). */
  endContent?: React.ReactNode;
  /** @default 'label' */
  showValue?: 'label' | 'tooltip' | 'never';
  /** Shown, and read as `aria-valuetext`. */
  formatValue?: (value: number) => string;
  /** A range: the names of the two thumbs, after the label. Default "Minimum", "Maximum". */
  thumbLabels?: readonly [string, string];
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: SliderDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type SliderRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue' | 'id'> & { [key: `data-${string}`]: unknown };
export type SliderTagProps = SliderConfig & Omit<SliderRootProps, keyof SliderConfig>;

export interface SliderApi {
  values: number[];
  setValues: (values: number[]) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SliderRootProps) => React.ReactElement;
}
export type SliderComponent = PinfoldComponent<SliderApi, SliderRootProps>;
