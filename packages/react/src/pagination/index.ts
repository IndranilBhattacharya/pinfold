/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/pagination.css'.
   Server-safe barrel: `definePagination` here, the client module re-exported. */

export { Pagination, usePagination } from './client';
export { Pagination as default } from './client';
export { definePagination, type DefinedPagination, type PaginationPresetProps } from './define';
export type { PaginationApi, PaginationComponent, PaginationConfig, PaginationRootProps, PaginationTagProps, PaginationSlot, PaginationState, PaginationVariant, PaginationLabels } from './types';
