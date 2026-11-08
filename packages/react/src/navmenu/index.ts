/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/navmenu.css'.
   Server-safe barrel: `defineNavMenu` here, the client module re-exported. */

export { NavMenu, useNavMenu } from './client';
export { NavMenu as default } from './client';
export { defineNavMenu, type DefinedNavMenu, type NavMenuPresetProps } from './define';
export type { NavMenuApi, NavMenuComponent, NavMenuConfig, NavMenuRootProps, NavMenuTagProps, NavMenuSlot, NavMenuState, NavMenuVariant, NavMenuItem, NavMenuLink, NavMenuDimensions } from './types';
