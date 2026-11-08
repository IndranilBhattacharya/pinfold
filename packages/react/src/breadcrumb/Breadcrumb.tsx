import type * as React from 'react';
import { splitProps } from '../preset';
import { BREADCRUMB_KEYS } from './keys';
import { useBreadcrumb } from './useBreadcrumb';
import type { BreadcrumbConfig, BreadcrumbTagProps } from './types';

/** The breadcrumb as a tag: the config as props, plus any attribute of the element. */
export function Breadcrumb(props: BreadcrumbTagProps): React.ReactElement {
  const [config, root] = splitProps<BreadcrumbConfig>(props as unknown as Record<string, unknown>, BREADCRUMB_KEYS);
  return useBreadcrumb(config).render(root);
}
