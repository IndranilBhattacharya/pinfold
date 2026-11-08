/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/resizable.css'.
   Server-safe barrel: `defineResizable` here, the client module re-exported. */

export { Resizable, useResizable } from './client';
export { Resizable as default } from './client';
export { defineResizable, type DefinedResizable, type ResizablePresetProps } from './define';
export type { ResizableApi, ResizableComponent, ResizableConfig, ResizableRootProps, ResizableTagProps, ResizableSlot, ResizableState, ResizablePanel } from './types';
