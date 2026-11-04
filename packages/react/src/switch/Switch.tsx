import type * as React from 'react';
import { splitProps } from '../preset';
import { SWITCH_KEYS } from './keys';
import { useSwitch } from './useSwitch';
import type { SwitchConfig, SwitchTagProps } from './types';

/** The switch as a tag: the config as props, plus any attribute of the element. */
export function Switch(props: SwitchTagProps): React.ReactElement {
  const [config, root] = splitProps<SwitchConfig>(props as unknown as Record<string, unknown>, SWITCH_KEYS);
  return useSwitch(config).render(root);
}
