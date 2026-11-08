/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/stepper.css'.
   Server-safe barrel: `defineStepper` here, the client module re-exported. */

export { Stepper, useStepper } from './client';
export { Stepper as default } from './client';
export { defineStepper, type DefinedStepper, type StepperPresetProps } from './define';
export type { StepperApi, StepperComponent, StepperConfig, StepperRootProps, StepperTagProps, StepperSlot, StepperState, StepperItem, StepperVariant } from './types';
