import * as React from 'react';
import { mergeConfig } from '../preset';
import { Slider } from './client';
import type { SliderConfig, SliderTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type SliderPresetProps<P> = SliderTagProps;

/** What `defineSlider` returns: a component with the preset baked in. */
export type DefinedSlider<P extends Partial<SliderConfig> = Partial<SliderConfig>> = ((props: SliderPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable slider, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Volume = defineSlider({ showValue: 'tooltip' });
 *
 * Props win over the preset, then `defaults.slider`, the provider and the library defaults.
 */
export function defineSlider<P extends Partial<SliderConfig>>(preset: P = {} as P): DefinedSlider<P> {
  const Defined = ((props: SliderPresetProps<P>) =>
    React.createElement(Slider, mergeConfig<SliderTagProps>(preset as unknown as Partial<SliderTagProps>, props as unknown as Partial<SliderTagProps>))) as DefinedSlider<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSlider';
  return Defined;
}
