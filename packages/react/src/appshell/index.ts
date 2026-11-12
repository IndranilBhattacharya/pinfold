/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/appshell.css'.
   Server-safe barrel: `defineAppShell` here, the client module re-exported. */

export { AppShell, useAppShell } from './client';
export { AppShell as default } from './client';
export { defineAppShell, type DefinedAppShell, type AppShellPresetProps } from './define';
export type { AppShellApi, AppShellComponent, AppShellConfig, AppShellRootProps, AppShellTagProps, AppShellSlot, AppShellState, AppShellDimensions } from './types';
