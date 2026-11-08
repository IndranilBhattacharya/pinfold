/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/empty.css'.
   Server-safe barrel: `defineEmpty` here, the client module re-exported. */

export { Empty, useEmpty } from './client';
export { Empty as default } from './client';
export { defineEmpty, type DefinedEmpty, type EmptyPresetProps } from './define';
export type { EmptyApi, EmptyComponent, EmptyConfig, EmptyRootProps, EmptyTagProps, EmptySlot, EmptyState, EmptyVariant } from './types';
