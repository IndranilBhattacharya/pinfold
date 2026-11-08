import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type StepperSlot = 'root' | 'step' | 'button' | 'indicator' | 'connector' | 'text' | 'label' | 'description';
export type StepperVariant = 'circle' | 'dot' | 'bar';

/** One step. */
export interface StepperItem {
  /** The step name. */
  label: React.ReactNode;
  /** A line under it. */
  description?: React.ReactNode;
  /** In the circle instead of the number. */
  icon?: React.ReactNode;
}

/** Passed to slot `render` overrides. */
export interface StepperState {
  variant: StepperVariant;
  orientation: 'horizontal' | 'vertical';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The current step, from 0. */
  value: number;
}

/**
 *   const Checkout = defineStepper();
 *   <Checkout value={step} onChange={setStep} items={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]} />
 */
export interface StepperConfig extends SlotOverrides<StepperSlot, StepperState> {
  /** One step each. */
  items: readonly StepperItem[];
  /** @default 'Progress' */
  label?: string;
  /** The current step (from 0), controlled. The length of `items` marks every step done. */
  value?: number;
  /** @default 0 */
  defaultValue?: number;
  /** With it, done steps are buttons that go back to them. */
  onChange?: (step: number, event: React.MouseEvent) => void;
  /** @default 'circle' */
  variant?: StepperVariant;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type StepperRootProps = Omit<React.HTMLAttributes<HTMLOListElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type StepperTagProps = StepperConfig & Omit<StepperRootProps, keyof StepperConfig>;

export interface StepperApi {
  /** The current step, from 0. */
  value: number;
  /** Go to a step (any, unlike a click: the app decides). */
  setValue: (step: number) => void;
  next: () => void;
  previous: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: StepperRootProps) => React.ReactElement;
}
export type StepperComponent = PinfoldComponent<StepperApi, StepperRootProps>;
