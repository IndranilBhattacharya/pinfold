import type * as React from 'react';
import { splitProps } from '../preset';
import { SIDEBAR_KEYS } from './keys';
import { useSidebar } from './useSidebar';
import type { SidebarConfig, SidebarTagProps } from './types';

/** The sidebar as a tag: the config as props, plus any attribute of the element. */
export function Sidebar(props: SidebarTagProps): React.ReactElement {
  const [config, root] = splitProps<SidebarConfig>(props as unknown as Record<string, unknown>, SIDEBAR_KEYS);
  return useSidebar(config).render(root);
}
