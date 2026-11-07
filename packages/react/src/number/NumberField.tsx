import type * as React from 'react';
import { splitProps } from '../preset';
import { NUMBER_KEYS } from './keys';
import { useNumberField } from './useNumberField';
import type { NumberFieldConfig, NumberFieldTagProps } from './types';

/** The number as a tag: the config as props, plus any attribute of the element. */
export function NumberField(props: NumberFieldTagProps): React.ReactElement {
  const [config, root] = splitProps<NumberFieldConfig>(props as unknown as Record<string, unknown>, NUMBER_KEYS);
  return useNumberField(config).render(root);
}
