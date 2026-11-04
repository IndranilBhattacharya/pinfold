/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/menu.css'.
   Server-safe barrel: `defineMenu` here, the client module re-exported. */

export { Menu, useMenu } from './client';
export { Menu as default } from './client';
export { defineMenu, type DefinedMenu, type MenuPresetProps } from './define';
export type { MenuApi, MenuComponent, MenuConfig, MenuRootProps, MenuTagProps, MenuSlot, MenuState, MenuMode, MenuItem, MenuActionItem, MenuCheckItem, MenuSeparatorItem, MenuGroupItem, MenuDimensions } from './types';
