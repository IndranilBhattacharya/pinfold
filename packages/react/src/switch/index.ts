/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/switch.css'.
   Server-safe barrel: `defineSwitch` here, the client module re-exported. */

export { Switch, useSwitch } from './client';
export { Switch as default } from './client';
export { defineSwitch, type DefinedSwitch, type SwitchPresetProps } from './define';
export type { SwitchApi, SwitchComponent, SwitchConfig, SwitchRootProps, SwitchTagProps, SwitchSlot, SwitchState, SwitchDimensions } from './types';
