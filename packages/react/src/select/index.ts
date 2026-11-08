/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/select.css'.
   Server-safe barrel: `defineSelect` here, the client module re-exported. */

export { Select, useSelect } from './client';
export { Select as default } from './client';
export { defineSelect, type DefinedSelect, type SelectPresetProps } from './define';
export type { SelectApi, SelectComponent, SelectConfig, SelectSingleConfig, SelectMultipleConfig, SelectRootProps, SelectTagProps, SelectSlot, SelectState, SelectItem, SelectVariant, SelectDimensions } from './types';
