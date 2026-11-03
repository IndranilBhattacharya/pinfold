/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/kbd.css'.
   Server-safe barrel: `defineKbd` here, the client module re-exported. */

export { Kbd, useKbd } from './client';
export { Kbd as default } from './client';
export { defineKbd, type DefinedKbd, type KbdPresetProps } from './define';
export type { KbdApi, KbdComponent, KbdConfig, KbdRootProps, KbdTagProps, KbdSlot, KbdState, KbdVariant, KbdDimensions } from './types';
