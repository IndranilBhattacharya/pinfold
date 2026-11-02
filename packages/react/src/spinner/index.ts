/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/spinner.css'.
   Server-safe barrel: `defineSpinner` here, the client module re-exported. */

export { Spinner, useSpinner } from './client';
export { Spinner as default } from './client';
export { defineSpinner, type DefinedSpinner } from './define';
export type { SpinnerApi, SpinnerComponent, SpinnerConfig, SpinnerDimensions, SpinnerRootProps, SpinnerSlot, SpinnerState, SpinnerTone, SpinnerTagProps } from './types';
