import type * as React from 'react';
import { splitProps } from '../preset';
import { SKELETON_KEYS } from './keys';
import { useSkeleton } from './useSkeleton';
import type { SkeletonConfig, SkeletonTagProps } from './types';

/** The skeleton as a tag: the config as props, plus any attribute of the element. */
export function Skeleton(props: SkeletonTagProps): React.ReactElement {
  const [config, root] = splitProps<SkeletonConfig>(props as unknown as Record<string, unknown>, SKELETON_KEYS);
  return useSkeleton(config).render(root);
}
