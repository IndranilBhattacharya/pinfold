/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/breadcrumb.css'.
   Server-safe barrel: `defineBreadcrumb` here, the client module re-exported. */

export { Breadcrumb, useBreadcrumb } from './client';
export { Breadcrumb as default } from './client';
export { defineBreadcrumb, type DefinedBreadcrumb, type BreadcrumbPresetProps } from './define';
export type { BreadcrumbApi, BreadcrumbComponent, BreadcrumbConfig, BreadcrumbRootProps, BreadcrumbTagProps, BreadcrumbSlot, BreadcrumbState, BreadcrumbItem, BreadcrumbSeparator } from './types';
