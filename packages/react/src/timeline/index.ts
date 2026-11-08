/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/timeline.css'.
   Server-safe barrel: `defineTimeline` here, the client module re-exported. */

export { Timeline, useTimeline } from './client';
export { Timeline as default } from './client';
export { defineTimeline, type DefinedTimeline, type TimelinePresetProps } from './define';
export type { TimelineApi, TimelineComponent, TimelineConfig, TimelineRootProps, TimelineTagProps, TimelineSlot, TimelineState, TimelineItem, TimelineVariant } from './types';
