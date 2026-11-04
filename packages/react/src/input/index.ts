/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/input.css'.
   Server-safe barrel: `defineInput` here, the client module re-exported. */

export { Input, useInput } from './client';
export { Input as default } from './client';
export { defineInput, type DefinedInput, type InputPresetProps } from './define';
export type { InputApi, InputComponent, InputConfig, InputRootProps, InputTagProps, InputSlot, InputState, InputType, InputVariant, InputElement, InputDimensions } from './types';
