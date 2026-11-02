/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/button.css';
   `npx pinfold add button` wires this up for you.

   This barrel is server-safe (no 'use client'): it carries `defineButton` and re-exports the
   client module, so one import path works in Server and Client Components alike. */

export { Button, useButton } from './client';
export { Button as default } from './client';
export { defineButton, type DefinedButton } from './define';
export type {
  ButtonApi,
  ButtonComponent,
  ButtonConfig,
  ButtonDimensions,
  ButtonNode,
  ButtonRadius,
  ButtonRootProps,
  ButtonSlot,
  ButtonState,
  ButtonVariant,
} from './types';
