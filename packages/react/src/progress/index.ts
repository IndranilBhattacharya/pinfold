/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/progress.css'.
   Server-safe barrel: `defineProgress` here, the client module re-exported. */

export { Progress, useProgress } from './client';
export { Progress as default } from './client';
export { defineProgress, type DefinedProgress, type ProgressPresetProps } from './define';
export type { ProgressApi, ProgressComponent, ProgressConfig, ProgressRootProps, ProgressTagProps, ProgressSlot, ProgressState, ProgressKind, ProgressShape, ProgressDimensions } from './types';
