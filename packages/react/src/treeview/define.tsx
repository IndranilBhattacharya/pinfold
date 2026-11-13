import * as React from 'react';
import { mergeConfig } from '../preset';
import { TreeView } from './client';
import type { TreeViewConfig, TreeViewTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type TreeViewPresetProps<P> = TreeViewTagProps;

/** What `defineTreeView` returns: a component with the preset baked in. */
export type DefinedTreeView<P extends Partial<TreeViewConfig> = Partial<TreeViewConfig>> = ((props: TreeViewPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable tree view, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.treeview`, the provider and the library defaults.
 */
export function defineTreeView<P extends Partial<TreeViewConfig>>(preset: P = {} as P): DefinedTreeView<P> {
  const Defined = ((props: TreeViewPresetProps<P>) =>
    React.createElement(TreeView, mergeConfig<TreeViewTagProps>(preset as unknown as Partial<TreeViewTagProps>, props as unknown as Partial<TreeViewTagProps>))) as DefinedTreeView<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTreeView';
  return Defined;
}
