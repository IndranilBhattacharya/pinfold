import * as React from 'react';
import { mergeConfig } from '../preset';
import { Sidebar } from './client';
import type { SidebarConfig, SidebarTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type SidebarPresetProps<P> = SidebarTagProps;

/** What `defineSidebar` returns: a component with the preset baked in. */
export type DefinedSidebar<P extends Partial<SidebarConfig> = Partial<SidebarConfig>> = ((props: SidebarPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable sidebar, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const AppNav = defineSidebar({ collapsible: true });
 *
 * Props win over the preset, then `defaults.sidebar`, the provider and the library defaults.
 */
export function defineSidebar<P extends Partial<SidebarConfig>>(preset: P = {} as P): DefinedSidebar<P> {
  const Defined = ((props: SidebarPresetProps<P>) =>
    React.createElement(Sidebar, mergeConfig<SidebarTagProps>(preset as unknown as Partial<SidebarTagProps>, props as unknown as Partial<SidebarTagProps>))) as DefinedSidebar<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSidebar';
  return Defined;
}
