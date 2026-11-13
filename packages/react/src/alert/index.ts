/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/alert.css'.
   Server-safe barrel: `defineAlert` here, the client module re-exported. */

export { Alert, useAlert } from './client';
export { Alert as default } from './client';
export { defineAlert, type DefinedAlert, type AlertPresetProps } from './define';
export type { AlertApi, AlertComponent, AlertConfig, AlertRootProps, AlertTagProps, AlertSlot, AlertState, AlertTone, AlertIconPlacement, AlertIconAlign, AlertIconVariant, AlertActionsPlacement, AlertDensity, AlertNode, AlertIcons, AlertVariant, AlertLive, AlertDimensions } from './types';
