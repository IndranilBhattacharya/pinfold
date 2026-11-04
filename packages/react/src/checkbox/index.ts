/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/checkbox.css'.
   Server-safe barrel: `defineCheckbox` here, the client module re-exported. */

export { Checkbox, useCheckbox } from './client';
export { Checkbox as default } from './client';
export { defineCheckbox, type DefinedCheckbox, type CheckboxPresetProps } from './define';
export type { CheckboxApi, CheckboxComponent, CheckboxConfig, CheckboxRootProps, CheckboxTagProps, CheckboxSlot, CheckboxState, CheckboxItem, CheckboxVariant, CheckboxDimensions } from './types';
