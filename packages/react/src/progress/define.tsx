import * as React from 'react';
import { mergeConfig } from '../preset';
import { Progress } from './client';
import type { ProgressConfig, ProgressTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type ProgressPresetProps<P> = ProgressTagProps;

/** What `defineProgress` returns: a component with the preset baked in. */
export type DefinedProgress<P extends Partial<ProgressConfig> = Partial<ProgressConfig>> = ((props: ProgressPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable progress, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Upload = defineProgress({ showValue: true });
 *
 * Props win over the preset, then `defaults.progress`, the provider and the library defaults.
 */
export function defineProgress<P extends Partial<ProgressConfig>>(preset: P = {} as P): DefinedProgress<P> {
  const Defined = ((props: ProgressPresetProps<P>) =>
    React.createElement(Progress, mergeConfig<ProgressTagProps>(preset as unknown as Partial<ProgressTagProps>, props as unknown as Partial<ProgressTagProps>))) as DefinedProgress<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedProgress';
  return Defined;
}
