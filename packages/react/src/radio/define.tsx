import * as React from 'react';
import { mergeConfig } from '../preset';
import { Radio } from './client';
import type { RadioConfig, RadioTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type RadioPresetProps<P> = RadioTagProps;

/** What `defineRadio` returns: a component with the preset baked in. */
export type DefinedRadio<P extends Partial<RadioConfig> = Partial<RadioConfig>> = ((props: RadioPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable radio, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Plan = defineRadio({ variant: 'card' });
 *
 * Props win over the preset, then `defaults.radio`, the provider and the library defaults.
 */
export function defineRadio<P extends Partial<RadioConfig>>(preset: P = {} as P): DefinedRadio<P> {
  const Defined = ((props: RadioPresetProps<P>) =>
    React.createElement(Radio, mergeConfig<RadioTagProps>(preset as unknown as Partial<RadioTagProps>, props as unknown as Partial<RadioTagProps>))) as DefinedRadio<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedRadio';
  return Defined;
}
