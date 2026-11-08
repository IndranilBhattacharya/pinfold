import type * as React from 'react';
import { splitProps } from '../preset';
import { PAGINATION_KEYS } from './keys';
import { usePagination } from './usePagination';
import type { PaginationConfig, PaginationTagProps } from './types';

/** The pagination as a tag: the config as props, plus any attribute of the element. */
export function Pagination(props: PaginationTagProps): React.ReactElement {
  const [config, root] = splitProps<PaginationConfig>(props as unknown as Record<string, unknown>, PAGINATION_KEYS);
  return usePagination(config).render(root);
}
