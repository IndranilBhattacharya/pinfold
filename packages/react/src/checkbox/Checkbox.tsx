import type * as React from 'react';
import { splitProps } from '../preset';
import { CHECKBOX_KEYS } from './keys';
import { useCheckbox } from './useCheckbox';
import type { CheckboxConfig, CheckboxTagProps } from './types';

/** The checkbox as a tag: the config as props, plus any attribute of the element. */
export function Checkbox(props: CheckboxTagProps): React.ReactElement {
  const [config, root] = splitProps<CheckboxConfig>(props as unknown as Record<string, unknown>, CHECKBOX_KEYS);
  return useCheckbox(config).render(root);
}
