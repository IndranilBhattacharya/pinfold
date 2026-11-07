import type * as React from 'react';
import { splitProps } from '../preset';
import { TOGGLE_KEYS } from './keys';
import { useToggle } from './useToggle';
import type { ToggleConfig, ToggleTagProps } from './types';

/** The toggle as a tag: the config as props, plus any attribute of the element. */
export function Toggle(props: ToggleTagProps): React.ReactElement {
  const [config, root] = splitProps<ToggleConfig>(props as unknown as Record<string, unknown>, TOGGLE_KEYS);
  return useToggle(config).render(root);
}
