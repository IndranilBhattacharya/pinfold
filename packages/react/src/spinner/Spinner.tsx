import type * as React from 'react';
import { splitProps } from '../preset';
import { SPINNER_KEYS } from './keys';
import { useSpinner } from './useSpinner';
import type { SpinnerConfig, SpinnerTagProps } from './types';

/** The spinner as a tag: the config as props, plus any attribute of the element. `<Spinner label="Loading" />` */
export function Spinner(props: SpinnerTagProps): React.ReactElement {
  const [config, root] = splitProps<SpinnerConfig>(props as unknown as Record<string, unknown>, SPINNER_KEYS);
  return useSpinner(config).render(root);
}

