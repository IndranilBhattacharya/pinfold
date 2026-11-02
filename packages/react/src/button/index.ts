/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/button.css';
   `npx pinfold add button` wires this up for you.

   A stateless atom (D-23): no hooks and no 'use client', so it renders in Server
   Components and adds no client JavaScript of its own. */

export { Button, Button as default } from './Button';
export type { ButtonProps, ButtonOptions, ButtonSlot, ButtonState, ButtonVariant, ButtonRadius, ButtonDimensions } from './types';
