import type * as React from 'react';
import { splitProps } from '../preset';
import { KBD_KEYS } from './keys';
import { useKbd } from './useKbd';
import type { KbdConfig, KbdTagProps } from './types';

/** The kbd as a tag: the config as props, plus any attribute of the element. */
export function Kbd(props: KbdTagProps): React.ReactElement {
  const [config, root] = splitProps<KbdConfig>(props as unknown as Record<string, unknown>, KBD_KEYS);
  return useKbd(config).render(root);
}
