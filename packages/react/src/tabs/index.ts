/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/tabs.css'.
   Server-safe barrel: `defineTabs` here, the client module re-exported. */

export { Tabs, useTabs } from './client';
export { Tabs as default } from './client';
export { defineTabs, type DefinedTabs, type TabsPresetProps } from './define';
export type { TabsApi, TabsComponent, TabsConfig, TabsRootProps, TabsTagProps, TabsSlot, TabsState, TabsItem, TabsVariant, TabsDimensions } from './types';
