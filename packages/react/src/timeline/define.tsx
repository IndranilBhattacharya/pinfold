import * as React from 'react';
import { mergeConfig } from '../preset';
import { Timeline } from './client';
import type { TimelineConfig, TimelineTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type TimelinePresetProps<P> = TimelineTagProps;

/** What `defineTimeline` returns: a component with the preset baked in. */
export type DefinedTimeline<P extends Partial<TimelineConfig> = Partial<TimelineConfig>> = ((props: TimelinePresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable timeline, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const History = defineTimeline({ variant: 'card' });
 *
 * Props win over the preset, then `defaults.timeline`, the provider and the library defaults.
 */
export function defineTimeline<P extends Partial<TimelineConfig>>(preset: P = {} as P): DefinedTimeline<P> {
  const Defined = ((props: TimelinePresetProps<P>) =>
    React.createElement(Timeline, mergeConfig<TimelineTagProps>(preset as unknown as Partial<TimelineTagProps>, props as unknown as Partial<TimelineTagProps>))) as DefinedTimeline<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTimeline';
  return Defined;
}
