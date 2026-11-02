import * as React from 'react';
import { Spinner } from './client';
import type { SpinnerConfig, SpinnerRootProps } from './types';

export type DefinedSpinner = ((props: SpinnerRootProps) => React.ReactElement) & { config: SpinnerConfig; displayName?: string };

/** The non-hook twin of `useSpinner`, for Server Components: `const Loading = defineSpinner({ label: 'Loading' })`. */
export function defineSpinner(config: SpinnerConfig = {}): DefinedSpinner {
  const Tag = Spinner as unknown as (props: SpinnerConfig & SpinnerRootProps) => React.ReactElement;
  const Defined = ((props: SpinnerRootProps) => React.createElement(Tag, { ...config, ...props })) as unknown as DefinedSpinner;
  Defined.config = config;
  Defined.displayName = 'DefinedSpinner';
  return Defined;
}
