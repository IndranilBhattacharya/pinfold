import type * as React from 'react';
import { useSpinner } from './useSpinner';
import type { SpinnerConfig } from './types';

/** Thin JSX wrapper over `useSpinner()`. */
export function Spinner(config: SpinnerConfig): React.ReactElement {
  return useSpinner(config).render();
}

Spinner.displayName = 'Spinner';
