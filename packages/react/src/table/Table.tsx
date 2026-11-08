import type * as React from 'react';
import { splitProps } from '../preset';
import { TABLE_KEYS } from './keys';
import { useTable } from './useTable';
import type { TableConfig, TableTagProps } from './types';

/** The table as a tag: the config as props, plus any attribute of the element. */
export function Table<T extends object = Record<string, unknown>>(props: TableTagProps<T>): React.ReactElement {
  const [config, root] = splitProps<TableConfig<T>>(props as unknown as Record<string, unknown>, TABLE_KEYS);
  return useTable(config).render(root);
}
