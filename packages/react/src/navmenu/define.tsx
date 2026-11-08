import * as React from 'react';
import { mergeConfig } from '../preset';
import { NavMenu } from './client';
import type { NavMenuConfig, NavMenuTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type NavMenuPresetProps<P> = NavMenuTagProps;

/** What `defineNavMenu` returns: a component with the preset baked in. */
export type DefinedNavMenu<P extends Partial<NavMenuConfig> = Partial<NavMenuConfig>> = ((props: NavMenuPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable navmenu, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const SiteNav = defineNavMenu({ variant: 'underline' });
 *
 * Props win over the preset, then `defaults.navmenu`, the provider and the library defaults.
 */
export function defineNavMenu<P extends Partial<NavMenuConfig>>(preset: P = {} as P): DefinedNavMenu<P> {
  const Defined = ((props: NavMenuPresetProps<P>) =>
    React.createElement(NavMenu, mergeConfig<NavMenuTagProps>(preset as unknown as Partial<NavMenuTagProps>, props as unknown as Partial<NavMenuTagProps>))) as DefinedNavMenu<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedNavMenu';
  return Defined;
}
