import * as React from 'react';
import { mergeConfig } from '../preset';
import { Tabs } from './client';
import type { TabsConfig, TabsTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type TabsPresetProps<P> = TabsTagProps;

/** What `defineTabs` returns: a component with the preset baked in. */
export type DefinedTabs<P extends Partial<TabsConfig> = Partial<TabsConfig>> = ((props: TabsPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable tab set, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Settings = defineTabs({ variant: 'segmented' });
 *
 * Props win over the preset, then `defaults.tabs`, the provider and the library defaults.
 */
export function defineTabs<P extends Partial<TabsConfig>>(preset: P = {} as P): DefinedTabs<P> {
  const Defined = ((props: TabsPresetProps<P>) =>
    React.createElement(Tabs, mergeConfig<TabsTagProps>(preset as unknown as Partial<TabsTagProps>, props as unknown as Partial<TabsTagProps>))) as DefinedTabs<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTabs';
  return Defined;
}
