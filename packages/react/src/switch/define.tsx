import * as React from 'react';
import { mergeConfig } from '../preset';
import { Switch } from './client';
import type { SwitchConfig, SwitchTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type SwitchPresetProps<P> = SwitchTagProps;

/** What `defineSwitch` returns: a component with the preset baked in. */
export type DefinedSwitch<P extends Partial<SwitchConfig> = Partial<SwitchConfig>> = ((props: SwitchPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable switch, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Setting = defineSwitch({ labelPosition: 'start' });
 *
 * Props win over the preset, then `defaults.switch`, the provider and the library defaults.
 */
export function defineSwitch<P extends Partial<SwitchConfig>>(preset: P = {} as P): DefinedSwitch<P> {
  const Defined = ((props: SwitchPresetProps<P>) =>
    React.createElement(Switch, mergeConfig<SwitchTagProps>(preset as unknown as Partial<SwitchTagProps>, props as unknown as Partial<SwitchTagProps>))) as DefinedSwitch<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSwitch';
  return Defined;
}
