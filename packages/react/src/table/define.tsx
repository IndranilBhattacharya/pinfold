import * as React from 'react';
import { mergeConfig } from '../preset';
import { Table } from './client';
import type { TableConfig, TableTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type TablePresetProps<P> = TableTagProps;

/** What `defineTable` returns: a component with the preset baked in. */
export type DefinedTable<P extends Partial<TableConfig> = Partial<TableConfig>> = ((props: TablePresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable table, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Invoices = defineTable({ striped: true });
 *
 * Props win over the preset, then `defaults.table`, the provider and the library defaults.
 */
export function defineTable<P extends Partial<TableConfig>>(preset: P = {} as P): DefinedTable<P> {
  const Defined = ((props: TablePresetProps<P>) =>
    React.createElement(Table as React.ElementType, mergeConfig<TableTagProps>(preset as unknown as Partial<TableTagProps>, props as unknown as Partial<TableTagProps>))) as DefinedTable<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTable';
  return Defined;
}
