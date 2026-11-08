import * as React from 'react';
import { mergeConfig } from '../preset';
import { Command } from './client';
import type { CommandConfig, CommandTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type CommandPresetProps<P> = CommandTagProps;

/** What `defineCommand` returns: a component with the preset baked in. */
export type DefinedCommand<P extends Partial<CommandConfig> = Partial<CommandConfig>> = ((props: CommandPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable command, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Palette = defineCommand({ mode: 'dialog' });
 *
 * Props win over the preset, then `defaults.command`, the provider and the library defaults.
 */
export function defineCommand<P extends Partial<CommandConfig>>(preset: P = {} as P): DefinedCommand<P> {
  const Defined = ((props: CommandPresetProps<P>) =>
    React.createElement(Command, mergeConfig<CommandTagProps>(preset as unknown as Partial<CommandTagProps>, props as unknown as Partial<CommandTagProps>))) as DefinedCommand<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCommand';
  return Defined;
}
