import type * as React from 'react';
import { splitProps } from '../preset';
import { PROGRESS_KEYS } from './keys';
import { useProgress } from './useProgress';
import type { ProgressConfig, ProgressTagProps } from './types';

/** The progress as a tag: the config as props, plus any attribute of the element. */
export function Progress(props: ProgressTagProps): React.ReactElement {
  const [config, root] = splitProps<ProgressConfig>(props as unknown as Record<string, unknown>, PROGRESS_KEYS);
  return useProgress(config).render(root);
}
