/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/toast.css'.
   Server-safe barrel: `defineToast` here, the client module re-exported. */

export { Toast, useToast } from './client';
export { Toast as default } from './client';
export { defineToast, type DefinedToast, type ToastPresetProps } from './define';
export { createToastStore, type ToastStore } from '@pinfold/core';
export type { ToastApi, ToastComponent, ToastConfig, ToastRootProps, ToastTagProps, ToastSlot, ToastState, ToastMessage, ToastPlacement, ToastDimensions } from './types';
