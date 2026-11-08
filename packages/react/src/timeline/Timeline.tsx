import type * as React from 'react';
import { splitProps } from '../preset';
import { TIMELINE_KEYS } from './keys';
import { useTimeline } from './useTimeline';
import type { TimelineConfig, TimelineTagProps } from './types';

/** The timeline as a tag: the config as props, plus any attribute of the element. */
export function Timeline(props: TimelineTagProps): React.ReactElement {
  const [config, root] = splitProps<TimelineConfig>(props as unknown as Record<string, unknown>, TIMELINE_KEYS);
  return useTimeline(config).render(root);
}
