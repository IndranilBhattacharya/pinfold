import * as React from 'react';
import { mergeConfig } from '../preset';
import { Pagination } from './client';
import type { PaginationConfig, PaginationTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type PaginationPresetProps<P> = PaginationTagProps;

/** What `definePagination` returns: a component with the preset baked in. */
export type DefinedPagination<P extends Partial<PaginationConfig> = Partial<PaginationConfig>> = ((props: PaginationPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable pagination, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Pages = definePagination({ showEdges: true });
 *
 * Props win over the preset, then `defaults.pagination`, the provider and the library defaults.
 */
export function definePagination<P extends Partial<PaginationConfig>>(preset: P = {} as P): DefinedPagination<P> {
  const Defined = ((props: PaginationPresetProps<P>) =>
    React.createElement(Pagination, mergeConfig<PaginationTagProps>(preset as unknown as Partial<PaginationTagProps>, props as unknown as Partial<PaginationTagProps>))) as DefinedPagination<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedPagination';
  return Defined;
}
