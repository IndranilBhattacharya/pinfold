import type * as React from 'react';
import { splitProps } from '../preset';
import { BADGE_KEYS } from './keys';
import { useBadge } from './useBadge';
import type { BadgeConfig, BadgeTagProps } from './types';

/** The badge as a tag: the config as props, plus any attribute of the element. */
export function Badge(props: BadgeTagProps): React.ReactElement {
  const [config, root] = splitProps<BadgeConfig>(props as unknown as Record<string, unknown>, BADGE_KEYS);
  return useBadge(config).render(root);
}
