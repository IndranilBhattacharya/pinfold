import * as React from 'react';
import { mergeConfig } from '../preset';
import { Select } from './client';
import type { SelectConfig, SelectTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type SelectPresetProps<P> = SelectTagProps;

/** What `defineSelect` returns: a component with the preset baked in. */
export type DefinedSelect<P extends Partial<SelectConfig> = Partial<SelectConfig>> = ((props: SelectPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable select, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Country = defineSelect({ variant: 'filled' });
 *
 * Props win over the preset, then `defaults.select`, the provider and the library defaults.
 */
export function defineSelect<P extends Partial<SelectConfig>>(preset: P = {} as P): DefinedSelect<P> {
  const Defined = ((props: SelectPresetProps<P>) =>
    React.createElement(Select, mergeConfig<SelectTagProps>(preset as unknown as Partial<SelectTagProps>, props as unknown as Partial<SelectTagProps>))) as DefinedSelect<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSelect';
  return Defined;
}
