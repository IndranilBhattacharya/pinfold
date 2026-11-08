/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/combobox.css'.
   Server-safe barrel: `defineCombobox` here, the client module re-exported. */

export { Combobox, useCombobox } from './client';
export { Combobox as default } from './client';
export { defineCombobox, type DefinedCombobox, type ComboboxPresetProps } from './define';
export type { ComboboxApi, ComboboxComponent, ComboboxConfig, ComboboxSingleConfig, ComboboxMultipleConfig, ComboboxRootProps, ComboboxTagProps, ComboboxSlot, ComboboxState, ComboboxLabels, ComboboxDimensions } from './types';
