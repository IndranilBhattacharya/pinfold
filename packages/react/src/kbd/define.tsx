import * as React from 'react';
import { mergeConfig } from '../preset';
import { Kbd } from './client';
import type { KbdConfig, KbdRootProps, KbdTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. `keys` is required unless the preset has it. */
export type KbdPresetProps<P> = Omit<Partial<KbdConfig>, 'keys'> & Omit<KbdRootProps, keyof KbdConfig> & ('keys' extends keyof P ? { keys?: KbdConfig['keys'] } : { keys: KbdConfig['keys'] });

/** What `defineKbd` returns: a component with the preset baked in. */
export type DefinedKbd<P extends Partial<KbdConfig> = Partial<KbdConfig>> = ((props: KbdPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable kbd, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Shortcut = defineKbd({ size: 'sm' });  // <Shortcut keys={['mod', 'k']} />
 *
 * Props win over the preset, then `defaults.kbd`, the provider and the library defaults.
 */
export function defineKbd<P extends Partial<KbdConfig>>(preset: P = {} as P): DefinedKbd<P> {
  const Defined = ((props: KbdPresetProps<P>) =>
    React.createElement(Kbd, mergeConfig<KbdTagProps>(preset as unknown as Partial<KbdTagProps>, props as unknown as Partial<KbdTagProps>))) as DefinedKbd<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedKbd';
  return Defined;
}
