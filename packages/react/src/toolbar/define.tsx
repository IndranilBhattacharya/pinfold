import * as React from 'react';
import { mergeConfig } from '../preset';
import { Toolbar } from './client';
import type { ToolbarConfig, ToolbarTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type ToolbarPresetProps<P> = ToolbarTagProps;

/** What `defineToolbar` returns: a component with the preset baked in. */
export type DefinedToolbar<P extends Partial<ToolbarConfig> = Partial<ToolbarConfig>> = ((props: ToolbarPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable toolbar, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Editor = defineToolbar({ attached: false, variant: 'ghost' });
 *
 * Props win over the preset, then `defaults.toolbar`, the provider and the library defaults.
 */
export function defineToolbar<P extends Partial<ToolbarConfig>>(preset: P = {} as P): DefinedToolbar<P> {
  const Defined = ((props: ToolbarPresetProps<P>) =>
    React.createElement(Toolbar, mergeConfig<ToolbarTagProps>(preset as unknown as Partial<ToolbarTagProps>, props as unknown as Partial<ToolbarTagProps>))) as DefinedToolbar<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedToolbar';
  return Defined;
}
