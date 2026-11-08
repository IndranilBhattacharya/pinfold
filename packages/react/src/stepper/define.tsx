import * as React from 'react';
import { mergeConfig } from '../preset';
import { Stepper } from './client';
import type { StepperConfig, StepperTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type StepperPresetProps<P> = StepperTagProps;

/** What `defineStepper` returns: a component with the preset baked in. */
export type DefinedStepper<P extends Partial<StepperConfig> = Partial<StepperConfig>> = ((props: StepperPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable stepper, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Checkout = defineStepper({ variant: 'dot' });
 *
 * Props win over the preset, then `defaults.stepper`, the provider and the library defaults.
 */
export function defineStepper<P extends Partial<StepperConfig>>(preset: P = {} as P): DefinedStepper<P> {
  const Defined = ((props: StepperPresetProps<P>) =>
    React.createElement(Stepper, mergeConfig<StepperTagProps>(preset as unknown as Partial<StepperTagProps>, props as unknown as Partial<StepperTagProps>))) as DefinedStepper<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedStepper';
  return Defined;
}
