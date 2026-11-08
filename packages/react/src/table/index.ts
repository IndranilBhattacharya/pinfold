/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/table.css'.
   Server-safe barrel: `defineTable` here, the client module re-exported. */

export { Table, useTable } from './client';
export { Table as default } from './client';
export { defineTable, type DefinedTable, type TablePresetProps } from './define';
export type { TableApi, TableComponent, TableConfig, TableRootProps, TableTagProps, TableSlot, TableState, TableColumn, TableSort, TableLabels, TableVariant, TableDimensions } from './types';
