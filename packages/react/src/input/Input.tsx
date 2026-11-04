import type * as React from 'react';
import { splitProps } from '../preset';
import { INPUT_KEYS } from './keys';
import { useInput } from './useInput';
import type { InputConfig, InputTagProps } from './types';

/** The input as a tag: the config as props, plus any attribute of the element. */
export function Input(props: InputTagProps): React.ReactElement {
  const [config, root] = splitProps<InputConfig>(props as unknown as Record<string, unknown>, INPUT_KEYS);
  return useInput(config).render(root);
}
