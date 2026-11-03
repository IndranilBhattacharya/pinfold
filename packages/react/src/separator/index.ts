/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/separator.css'.
   Server-safe barrel: `defineSeparator` here, the client module re-exported. */

export { Separator, useSeparator } from './client';
export { Separator as default } from './client';
export { defineSeparator, type DefinedSeparator, type SeparatorPresetProps } from './define';
export type { SeparatorApi, SeparatorComponent, SeparatorConfig, SeparatorRootProps, SeparatorTagProps, SeparatorSlot, SeparatorState, SeparatorOrientation, SeparatorVariant, SeparatorSpacing, SeparatorDimensions } from './types';
