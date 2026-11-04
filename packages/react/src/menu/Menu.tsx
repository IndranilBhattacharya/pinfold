import type * as React from 'react';
import { splitProps } from '../preset';
import { MENU_KEYS } from './keys';
import { useMenu } from './useMenu';
import type { MenuConfig, MenuTagProps } from './types';

/** The menu as a tag: the config as props, plus any attribute of the element. */
export function Menu(props: MenuTagProps): React.ReactElement {
  const [config, root] = splitProps<MenuConfig>(props as unknown as Record<string, unknown>, MENU_KEYS);
  return useMenu(config).render(root);
}
