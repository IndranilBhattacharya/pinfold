import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type StepperSlot = 'root' | 'list' | 'step' | 'button' | 'indicator' | 'connector' | 'text' | 'label' | 'description' | 'panel' | 'actions';
export type StepperVariant = 'circle' | 'dot' | 'bar';

/** One step. */
export interface StepperItem {
  /** The step name. */
  label: React.ReactNode;
  /** A line under it. */
  description?: React.ReactNode;
  /** In the circle instead of the number. */
  icon?: React.ReactNode;
  /** What the step shows while it is current: a form, a summary. */
  content?: React.ReactNode;
  /** Marked "Optional". */
  optional?: boolean;
  /** Something needs fixing here: drawn in the danger tone, read as "error". */
  error?: boolean;
  /** Never a button, even with `linear: false`. */
  disabled?: boolean;
}

/** Text shown and read, for translation. */
export interface StepperLabels {
  /** @default 'Back' */
  back?: string;
  /** @default 'Next' */
  next?: string;
  /** @default 'Finish' */
  finish?: string;
  /** @default 'Optional' */
  optional?: string;
  /** Spoken after each step name. Default "done", "current", "not started", "error". */
  status?: Partial<Record<'complete' | 'current' | 'upcoming' | 'error', string>>;
}

/** Passed to slot `render` overrides. */
export interface StepperState {
  variant: StepperVariant;
  orientation: 'horizontal' | 'vertical';
  labelPlacement: 'bottom' | 'end';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The current step, from 0; the length of `items` once every step is done. */
  value: number;
}

/**
 *   const Checkout = defineStepper();
 *   <Checkout items={[
 *     { label: 'Cart', content: <Cart /> },
 *     { label: 'Shipping', content: <ShippingForm /> },
 *     { label: 'Payment', content: <Payment /> },
 *   ]} onNext={validate} onComplete={placeOrder} doneContent={<Receipt />} />
 */
export interface StepperConfig extends SlotOverrides<StepperSlot, StepperState> {
  /** One step each; a string is a step with that name. */
  items: ReadonlyArray<StepperItem | string>;
  /** @default 'Progress' */
  label?: string;
  /** The current step (from 0), controlled. The length of `items` marks every step done. */
  value?: number;
  /** @default 0 */
  defaultValue?: number;
  /** The step changed (Back, Next, or a click on a step). With it, steps can be clicked: done ones, or any with `linear: false`. */
  onChange?: (step: number, event: React.SyntheticEvent) => void;
  /** Before Next leaves `step`: return `false` (or a promise of it) to stay, e.g. when a form is invalid. A promise shows Next as loading. */
  onNext?: (step: number) => boolean | void | Promise<boolean | void>;
  /** Finish was pressed on the last step (after `onNext`). A promise shows Finish as loading. */
  onComplete?: () => void | Promise<void>;
  /** @default true */
  linear?: boolean;
  /** @default true */
  showActions?: boolean;
  /** Shown in the panel once every step is done. */
  doneContent?: React.ReactNode;
  labels?: StepperLabels;
  /** @default 'circle' */
  variant?: StepperVariant;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** @default 'bottom' */
  labelPlacement?: 'bottom' | 'end';
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type StepperRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type StepperTagProps = StepperConfig & Omit<StepperRootProps, keyof StepperConfig>;

export interface StepperApi {
  /** The current step, from 0. */
  value: number;
  /** The first step is current. */
  isFirst: boolean;
  /** The last step is current. */
  isLast: boolean;
  /** Every step is done. */
  isComplete: boolean;
  /** Go to a step (any, unlike a click: the app decides). */
  setValue: (step: number) => void;
  /** The next step, without `onNext`. */
  next: () => void;
  previous: () => void;
  /** Back to `defaultValue`. */
  reset: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: StepperRootProps) => React.ReactElement;
}
export type StepperComponent = PinfoldComponent<StepperApi, StepperRootProps>;
