import * as React from 'react';
import { mergeConfig } from '../preset';
import { AppShell } from './client';
import type { AppShellConfig, AppShellTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type AppShellPresetProps<P> = AppShellTagProps;

/** What `defineAppShell` returns: a component with the preset baked in. */
export type DefinedAppShell<P extends Partial<AppShellConfig> = Partial<AppShellConfig>> = ((props: AppShellPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable app shell, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.appshell`, the provider and the library defaults.
 */
export function defineAppShell<P extends Partial<AppShellConfig>>(preset: P = {} as P): DefinedAppShell<P> {
  const Defined = ((props: AppShellPresetProps<P>) =>
    React.createElement(AppShell, mergeConfig<AppShellTagProps>(preset as unknown as Partial<AppShellTagProps>, props as unknown as Partial<AppShellTagProps>))) as DefinedAppShell<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedAppShell';
  return Defined;
}
