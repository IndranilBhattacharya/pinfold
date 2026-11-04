import type * as React from 'react';
import { splitProps } from '../preset';
import { POPOVER_KEYS } from './keys';
import { usePopover } from './usePopover';
import type { PopoverConfig, PopoverTagProps } from './types';

/** The popover as a tag: the config as props, plus any attribute of the element. */
export function Popover(props: PopoverTagProps): React.ReactElement {
  const [config, root] = splitProps<PopoverConfig>(props as unknown as Record<string, unknown>, POPOVER_KEYS);
  return usePopover(config).render(root);
}
