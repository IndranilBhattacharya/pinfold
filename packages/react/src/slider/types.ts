import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig, FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';
import type { SlotOverrides } from '../types';

export type SliderSlot = 'root' | 'label' | 'value' | 'control' | 'track' | 'range' | 'steps' | 'input' | 'thumb' | 'marks' | 'mark' | 'startContent' | 'endContent' | 'description' | 'error' | 'statusIcon' | 'validating';

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
  disabled: boolean;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

/** What a `thumbContent` function receives: the slider state plus this thumb. */
export interface SliderThumbState extends SliderState {
  value: number;
  /** 0, or 1 for a range's upper thumb. */
  index: number;
}

export interface SliderDimensions {
  thickness?: Length;
  thumbSize?: Length;
  /** Track length when vertical (default 12rem). */
  length?: Length;
}

/**
 *   const Price = defineSlider({ min: 0, max: 500, step: 10, formatValue: (v) => '$' + v });
 *   <Price label="Price" defaultValue={[50, 300]} />
 */
export interface SliderConfig extends Omit<FieldConfig, 'required' | 'nativeErrors' | 'error'>, Omit<FieldValidationConfig<number[]>, 'messages'>, SlotOverrides<SliderSlot, SliderState> {
  /** Controlled values: one number, or two for a range. */
  value?: readonly number[];
  /** Initial values when uncontrolled: `[40]`, or `[20, 80]` for a range. Default `[min]`. */
  defaultValue?: readonly number[];
  /** While dragging. */
  onChange?: (values: number[], event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Once the pointer or key is released after a change: the moment to save. */
  onChangeEnd?: (values: number[]) => void;
  /** The same moment as `onChangeEnd` (also on leaving a thumb after a change), named like the other fields. */
  onValueCommit?: (values: number[]) => void;
  /** A thumb took focus (`event.target.dataset.index` says which). */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** A thumb lost focus. */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Any key on a thumb; `preventDefault()` stops the mark-to-mark keys of `snapToMarks`. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Inside each thumb: an icon, a grip, the value. A node or a function of the thumb's state. */
  thumbContent?: React.ReactNode | ((state: SliderThumbState) => React.ReactNode);
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
  /** `vertical`: the track stands up, the minimum at the bottom (volume, equalisers). @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
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
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
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

export interface SliderApi extends FieldValidationApi {
  values: number[];
  setValues: (values: number[]) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SliderRootProps) => React.ReactElement;
}
export type SliderComponent = PinfoldComponent<SliderApi, SliderRootProps>;
