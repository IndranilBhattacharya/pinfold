import type * as React from 'react';
import { splitProps } from '../preset';
import { APPSHELL_KEYS } from './keys';
import { useAppShell } from './useAppShell';
import type { AppShellConfig, AppShellTagProps } from './types';

/** The app shell as a tag: the config as props, plus any attribute of the element. */
export function AppShell(props: AppShellTagProps): React.ReactElement {
  const [config, root] = splitProps<AppShellConfig>(props as unknown as Record<string, unknown>, APPSHELL_KEYS);
  return useAppShell(config).render(root);
}
