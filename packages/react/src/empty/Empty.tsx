import type * as React from 'react';
import { splitProps } from '../preset';
import { EMPTY_KEYS } from './keys';
import { useEmpty } from './useEmpty';
import type { EmptyConfig, EmptyTagProps } from './types';

/** The empty state as a tag: the config as props, plus any attribute of the element. */
export function Empty(props: EmptyTagProps): React.ReactElement {
  const [config, root] = splitProps<EmptyConfig>(props as unknown as Record<string, unknown>, EMPTY_KEYS);
  return useEmpty(config).render(root);
}
