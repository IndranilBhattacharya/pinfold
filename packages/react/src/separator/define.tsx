import * as React from 'react';
import { mergeConfig } from '../preset';
import { Separator } from './client';
import type { SeparatorConfig, SeparatorRootProps, SeparatorTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type SeparatorPresetProps<P> = SeparatorTagProps;

/** What `defineSeparator` returns: a component with the preset baked in. */
export type DefinedSeparator<P extends Partial<SeparatorConfig> = Partial<SeparatorConfig>> = ((props: SeparatorPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable separator, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Or = defineSeparator({ label: 'or', spacing: 'lg' });
 *
 * Props win over the preset, then `defaults.separator`, the provider and the library defaults.
 */
export function defineSeparator<P extends Partial<SeparatorConfig>>(preset: P = {} as P): DefinedSeparator<P> {
  const Defined = ((props: SeparatorPresetProps<P>) =>
    React.createElement(Separator, mergeConfig<SeparatorTagProps>(preset as unknown as Partial<SeparatorTagProps>, props as unknown as Partial<SeparatorTagProps>))) as DefinedSeparator<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSeparator';
  return Defined;
}
