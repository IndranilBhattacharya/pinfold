import type * as React from 'react';
import { splitProps } from '../preset';
import { NAVMENU_KEYS } from './keys';
import { useNavMenu } from './useNavMenu';
import type { NavMenuConfig, NavMenuTagProps } from './types';

/** The navmenu as a tag: the config as props, plus any attribute of the element. */
export function NavMenu(props: NavMenuTagProps): React.ReactElement {
  const [config, root] = splitProps<NavMenuConfig>(props as unknown as Record<string, unknown>, NAVMENU_KEYS);
  return useNavMenu(config).render(root);
}
