/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/number.css'.
   Server-safe barrel: `defineNumberField` here, the client module re-exported. */

export { NumberField, useNumberField } from './client';
export { NumberField as default } from './client';
export { defineNumberField, type DefinedNumberField, type NumberFieldPresetProps } from './define';
export type { NumberFieldApi, NumberFieldComponent, NumberFieldConfig, NumberFieldRootProps, NumberFieldTagProps, NumberFieldSlot, NumberFieldState, NumberFieldVariant, NumberFieldSteppers, NumberFieldDimensions, NumberFieldContent } from './types';
export type { FieldStatus, FieldValidateOutcome, FieldValidationResult, FieldMessages, FieldErrorState } from '../field';
