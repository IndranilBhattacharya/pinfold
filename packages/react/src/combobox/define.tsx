import * as React from 'react';
import { mergeConfig } from '../preset';
import { Combobox } from './client';
import type { ComboboxConfig, ComboboxTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type ComboboxPresetProps<P> = ComboboxTagProps;

/** What `defineCombobox` returns: a component with the preset baked in. */
export type DefinedCombobox<P extends Partial<ComboboxConfig> = Partial<ComboboxConfig>> = ((props: ComboboxPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable combobox, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Search = defineCombobox({ filter: 'startsWith' });
 *
 * Props win over the preset, then `defaults.combobox`, the provider and the library defaults.
 */
export function defineCombobox<P extends Partial<ComboboxConfig>>(preset: P = {} as P): DefinedCombobox<P> {
  const Defined = ((props: ComboboxPresetProps<P>) =>
    React.createElement(Combobox, mergeConfig<ComboboxTagProps>(preset as unknown as Partial<ComboboxTagProps>, props as unknown as Partial<ComboboxTagProps>))) as DefinedCombobox<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCombobox';
  return Defined;
}
