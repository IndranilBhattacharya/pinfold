import type * as React from 'react';
import { splitProps } from '../preset';
import { TREEVIEW_KEYS } from './keys';
import { useTreeView } from './useTreeView';
import type { TreeViewConfig, TreeViewTagProps } from './types';

/** The tree view as a tag: the config as props, plus any attribute of the element. */
export function TreeView(props: TreeViewTagProps): React.ReactElement {
  const [config, root] = splitProps<TreeViewConfig>(props as unknown as Record<string, unknown>, TREEVIEW_KEYS);
  return useTreeView(config).render(root);
}
