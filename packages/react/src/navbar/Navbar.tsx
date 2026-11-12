import type * as React from 'react';
import { splitProps } from '../preset';
import { NAVBAR_KEYS } from './keys';
import { useNavbar } from './useNavbar';
import type { NavbarConfig, NavbarTagProps } from './types';

/** The navbar as a tag: the config as props, plus any attribute of the element. */
export function Navbar(props: NavbarTagProps): React.ReactElement {
  const [config, root] = splitProps<NavbarConfig>(props as unknown as Record<string, unknown>, NAVBAR_KEYS);
  return useNavbar(config).render(root);
}
