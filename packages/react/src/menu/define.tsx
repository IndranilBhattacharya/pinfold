import * as React from 'react';
import { mergeConfig } from '../preset';
import { Menu } from './client';
import type { MenuConfig, MenuTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type MenuPresetProps<P> = MenuTagProps;

/** What `defineMenu` returns: a component with the preset baked in. */
export type DefinedMenu<P extends Partial<MenuConfig> = Partial<MenuConfig>> = ((props: MenuPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable menu, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const RowActions = defineMenu({ placement: 'bottom-end' });
 *
 * Props win over the preset, then `defaults.menu`, the provider and the library defaults.
 */
export function defineMenu<P extends Partial<MenuConfig>>(preset: P = {} as P): DefinedMenu<P> {
  const Defined = ((props: MenuPresetProps<P>) =>
    React.createElement(Menu, mergeConfig<MenuTagProps>(preset as unknown as Partial<MenuTagProps>, props as unknown as Partial<MenuTagProps>))) as DefinedMenu<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedMenu';
  return Defined;
}
