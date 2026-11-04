import type * as React from 'react';
import { splitProps } from '../preset';
import { RADIO_KEYS } from './keys';
import { useRadio } from './useRadio';
import type { RadioConfig, RadioTagProps } from './types';

/** The radio as a tag: the config as props, plus any attribute of the element. */
export function Radio(props: RadioTagProps): React.ReactElement {
  const [config, root] = splitProps<RadioConfig>(props as unknown as Record<string, unknown>, RADIO_KEYS);
  return useRadio(config).render(root);
}
