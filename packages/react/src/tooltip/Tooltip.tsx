import type * as React from 'react';
import { splitProps } from '../preset';
import { TOOLTIP_KEYS } from './keys';
import { useTooltip } from './useTooltip';
import type { TooltipConfig, TooltipTagProps } from './types';

/** The tooltip as a tag: the config as props, plus any attribute of the element. */
export function Tooltip(props: TooltipTagProps): React.ReactElement {
  const [config, root] = splitProps<TooltipConfig>(props as unknown as Record<string, unknown>, TOOLTIP_KEYS);
  return useTooltip(config).render(root);
}
