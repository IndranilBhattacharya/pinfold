import * as React from 'react';
import { mergeConfig } from '../preset';
import { Input } from './client';
import type { InputConfig, InputTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type InputPresetProps<P> = InputTagProps;

/** What `defineInput` returns: a component with the preset baked in. */
export type DefinedInput<P extends Partial<InputConfig> = Partial<InputConfig>> = ((props: InputPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable input, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Email = defineInput({ type: 'email', required: true });
 *
 * Props win over the preset, then `defaults.input`, the provider and the library defaults.
 */
export function defineInput<P extends Partial<InputConfig>>(preset: P = {} as P): DefinedInput<P> {
  const Defined = ((props: InputPresetProps<P>) =>
    React.createElement(Input, mergeConfig<InputTagProps>(preset as unknown as Partial<InputTagProps>, props as unknown as Partial<InputTagProps>))) as DefinedInput<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedInput';
  return Defined;
}
