import * as React from 'react';
import { mergeConfig } from '../preset';
import { Alert } from './client';
import type { AlertConfig, AlertTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type AlertPresetProps<P> = AlertTagProps;

/** What `defineAlert` returns: a component with the preset baked in. */
export type DefinedAlert<P extends Partial<AlertConfig> = Partial<AlertConfig>> = ((props: AlertPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable alert, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Problem = defineAlert({ tone: 'danger', live: 'assertive' });
 *
 * Props win over the preset, then `defaults.alert`, the provider and the library defaults.
 */
export function defineAlert<P extends Partial<AlertConfig>>(preset: P = {} as P): DefinedAlert<P> {
  const Defined = ((props: AlertPresetProps<P>) =>
    React.createElement(Alert, mergeConfig<AlertTagProps>(preset as unknown as Partial<AlertTagProps>, props as unknown as Partial<AlertTagProps>))) as DefinedAlert<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedAlert';
  return Defined;
}
