import type * as React from 'react';
import { splitProps } from '../preset';
import { SCROLLAREA_KEYS } from './keys';
import { useScrollArea } from './useScrollArea';
import type { ScrollAreaConfig, ScrollAreaTagProps } from './types';

/** The scroll area as a tag: the config as props, plus any attribute of the element. */
export function ScrollArea(props: ScrollAreaTagProps): React.ReactElement {
  const [config, root] = splitProps<ScrollAreaConfig>(props as unknown as Record<string, unknown>, SCROLLAREA_KEYS);
  return useScrollArea(config).render(root);
}
