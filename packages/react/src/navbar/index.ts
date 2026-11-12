/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/navbar.css' (and button.css, menu.css).
   Server-safe barrel: `defineNavbar` here, the client module re-exported. */

export { Navbar, useNavbar } from './client';
export { Navbar as default } from './client';
export { defineNavbar, type DefinedNavbar, type NavbarPresetProps } from './define';
export type { NavbarApi, NavbarComponent, NavbarConfig, NavbarRootProps, NavbarTagProps, NavbarSlot, NavbarState, NavbarItem, NavbarBrand, NavbarVariant, NavbarDimensions, NavbarItemContext } from './types';
