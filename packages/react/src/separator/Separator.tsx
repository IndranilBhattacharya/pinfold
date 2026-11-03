import type * as React from 'react';
import { splitProps } from '../preset';
import { SEPARATOR_KEYS } from './keys';
import { useSeparator } from './useSeparator';
import type { SeparatorConfig, SeparatorTagProps } from './types';

/** The separator as a tag: the config as props, plus any attribute of the element. */
export function Separator(props: SeparatorTagProps): React.ReactElement {
  const [config, root] = splitProps<SeparatorConfig>(props as unknown as Record<string, unknown>, SEPARATOR_KEYS);
  return useSeparator(config).render(root);
}
