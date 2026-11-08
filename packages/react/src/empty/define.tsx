import * as React from 'react';
import { mergeConfig } from '../preset';
import { Empty } from './client';
import type { EmptyConfig, EmptyTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type EmptyPresetProps<P> = EmptyTagProps;

/** What `defineEmpty` returns: a component with the preset baked in. */
export type DefinedEmpty<P extends Partial<EmptyConfig> = Partial<EmptyConfig>> = ((props: EmptyPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable empty, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const NoResults = defineEmpty({ variant: 'dashed' });
 *
 * Props win over the preset, then `defaults.empty`, the provider and the library defaults.
 */
export function defineEmpty<P extends Partial<EmptyConfig>>(preset: P = {} as P): DefinedEmpty<P> {
  const Defined = ((props: EmptyPresetProps<P>) =>
    React.createElement(Empty, mergeConfig<EmptyTagProps>(preset as unknown as Partial<EmptyTagProps>, props as unknown as Partial<EmptyTagProps>))) as DefinedEmpty<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedEmpty';
  return Defined;
}
