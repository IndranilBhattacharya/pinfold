/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/dialog.css'.
   Server-safe barrel: `defineDialog` here, the client module re-exported. */

export { Dialog, useDialog } from './client';
export { Dialog as default } from './client';
export { defineDialog, type DefinedDialog, type DialogPresetProps } from './define';
export type { DialogApi, DialogComponent, DialogConfig, DialogRootProps, DialogTagProps, DialogSlot, DialogState, DialogPlacement, DialogSize, DialogDimensions } from './types';
