import type * as React from 'react';
import { splitProps } from '../preset';
import { TOOLBAR_KEYS } from './keys';
import { useToolbar } from './useToolbar';
import type { ToolbarConfig, ToolbarTagProps } from './types';

/** The toolbar as a tag: the config as props, plus any attribute of the element. */
export function Toolbar(props: ToolbarTagProps): React.ReactElement {
  const [config, root] = splitProps<ToolbarConfig>(props as unknown as Record<string, unknown>, TOOLBAR_KEYS);
  return useToolbar(config).render(root);
}
