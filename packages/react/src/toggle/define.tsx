import * as React from 'react';
import { mergeConfig } from '../preset';
import { Toggle } from './client';
import type { ToggleConfig, ToggleTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type TogglePresetProps<P> = ToggleTagProps;

/** What `defineToggle` returns: a component with the preset baked in. */
export type DefinedToggle<P extends Partial<ToggleConfig> = Partial<ToggleConfig>> = ((props: TogglePresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable toggle, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const View = defineToggle({ fullWidth: true });
 *
 * Props win over the preset, then `defaults.toggle`, the provider and the library defaults.
 */
export function defineToggle<P extends Partial<ToggleConfig>>(preset: P = {} as P): DefinedToggle<P> {
  const Defined = ((props: TogglePresetProps<P>) =>
    React.createElement(Toggle, mergeConfig<ToggleTagProps>(preset as unknown as Partial<ToggleTagProps>, props as unknown as Partial<ToggleTagProps>))) as DefinedToggle<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedToggle';
  return Defined;
}
