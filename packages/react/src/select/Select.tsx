import type * as React from 'react';
import { splitProps } from '../preset';
import { SELECT_KEYS } from './keys';
import { useSelect } from './useSelect';
import type { SelectConfig, SelectTagProps } from './types';

/** The select as a tag: the config as props, plus any attribute of the element. */
export function Select<V extends string = string>(props: SelectTagProps<V>): React.ReactElement {
  const [config, root] = splitProps<SelectConfig>(props as unknown as Record<string, unknown>, SELECT_KEYS);
  return useSelect(config).render(root);
}
