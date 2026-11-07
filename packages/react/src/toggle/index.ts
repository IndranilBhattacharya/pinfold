/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/toggle.css'.
   Server-safe barrel: `defineToggle` here, the client module re-exported. */

export { Toggle, useToggle } from './client';
export { Toggle as default } from './client';
export { defineToggle, type DefinedToggle, type TogglePresetProps } from './define';
export type { ToggleApi, ToggleComponent, ToggleConfig, ToggleRootProps, ToggleTagProps, ToggleSlot, ToggleState, ToggleVariant, ToggleItem, ToggleDimensions } from './types';
