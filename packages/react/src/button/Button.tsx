import type * as React from 'react';
import { useButton } from './useButton';
import type { ButtonConfig } from './types';

/** Thin JSX wrapper over `useButton()`, for one-off buttons that never need the controller. */
export function Button(config: ButtonConfig): React.ReactElement {
  return useButton(config).render();
}

Button.displayName = 'Button';
