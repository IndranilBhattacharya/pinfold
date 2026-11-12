/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/scrollarea.css'.
   Server-safe barrel: `defineScrollArea` here, the client module re-exported. */

export { ScrollArea, useScrollArea } from './client';
export { ScrollArea as default } from './client';
export { defineScrollArea, type DefinedScrollArea, type ScrollAreaPresetProps } from './define';
export type { ScrollAreaApi, ScrollAreaComponent, ScrollAreaConfig, ScrollAreaRootProps, ScrollAreaTagProps, ScrollAreaSlot, ScrollAreaState, ScrollAreaDimensions, ScrollAreaIndicator, ScrollAreaOrientation, ScrollToOptions } from './types';
