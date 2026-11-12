import * as React from 'react';
import { mergeConfig } from '../preset';
import { Navbar } from './client';
import type { NavbarConfig, NavbarTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type NavbarPresetProps<P> = NavbarTagProps;

/** What `defineNavbar` returns: a component with the preset baked in. */
export type DefinedNavbar<P extends Partial<NavbarConfig> = Partial<NavbarConfig>> = ((props: NavbarPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable navbar, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.navbar`, the provider and the library defaults.
 */
export function defineNavbar<P extends Partial<NavbarConfig>>(preset: P = {} as P): DefinedNavbar<P> {
  const Defined = ((props: NavbarPresetProps<P>) =>
    React.createElement(Navbar, mergeConfig<NavbarTagProps>(preset as unknown as Partial<NavbarTagProps>, props as unknown as Partial<NavbarTagProps>))) as DefinedNavbar<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedNavbar';
  return Defined;
}
