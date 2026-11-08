import * as React from 'react';
import { mergeConfig } from '../preset';
import { Breadcrumb } from './client';
import type { BreadcrumbConfig, BreadcrumbTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type BreadcrumbPresetProps<P> = BreadcrumbTagProps;

/** What `defineBreadcrumb` returns: a component with the preset baked in. */
export type DefinedBreadcrumb<P extends Partial<BreadcrumbConfig> = Partial<BreadcrumbConfig>> = ((props: BreadcrumbPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable breadcrumb, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Trail = defineBreadcrumb({ maxItems: 4 });
 *
 * Props win over the preset, then `defaults.breadcrumb`, the provider and the library defaults.
 */
export function defineBreadcrumb<P extends Partial<BreadcrumbConfig>>(preset: P = {} as P): DefinedBreadcrumb<P> {
  const Defined = ((props: BreadcrumbPresetProps<P>) =>
    React.createElement(Breadcrumb, mergeConfig<BreadcrumbTagProps>(preset as unknown as Partial<BreadcrumbTagProps>, props as unknown as Partial<BreadcrumbTagProps>))) as DefinedBreadcrumb<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedBreadcrumb';
  return Defined;
}
