import * as React from 'react';
import { mergeConfig } from '../preset';
import { Table } from './client';
import type { TableConfig, TableTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type TablePresetProps<T extends object = Record<string, unknown>> = TableTagProps<T>;

/**
 * What `defineTable` returns: a component with the preset baked in. It is generic over the row: name the
 * row once (`defineTable<Order>()`) or let each use infer it from its `rows`; either way columns, cells
 * and callbacks know the row's shape.
 */
export interface DefinedTable<T extends object = Record<string, unknown>> {
  <R extends object = T>(props: TablePresetProps<R>): React.ReactElement;
  config: Partial<TableConfig<T>>;
  displayName?: string;
}

/**
 * A reusable table, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Grid = defineTable({ striped: true });            // rows inferred at each use
 *   const Orders = defineTable<Order>({ sortable: true });  // or named once
 *
 * Props win over the preset, then `defaults.table`, the provider and the library defaults.
 */
export function defineTable<T extends object = Record<string, unknown>>(preset: Partial<TableConfig<T>> = {}): DefinedTable<T> {
  const Defined = ((props: TablePresetProps<T>) =>
    React.createElement(Table as React.ElementType, mergeConfig<TableTagProps>(preset as unknown as Partial<TableTagProps>, props as unknown as Partial<TableTagProps>))) as unknown as DefinedTable<T>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTable';
  return Defined;
}
