/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/sidebar.css'.
   Server-safe barrel: `defineSidebar` here, the client module re-exported. */

export { Sidebar, useSidebar } from './client';
export { Sidebar as default } from './client';
export { defineSidebar, type DefinedSidebar, type SidebarPresetProps } from './define';
export type { SidebarApi, SidebarComponent, SidebarConfig, SidebarRootProps, SidebarTagProps, SidebarSlot, SidebarState, SidebarVariant, SidebarItem, SidebarDimensions } from './types';
