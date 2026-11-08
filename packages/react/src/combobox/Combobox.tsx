import type * as React from 'react';
import { splitProps } from '../preset';
import { COMBOBOX_KEYS } from './keys';
import { useCombobox } from './useCombobox';
import type { ComboboxConfig, ComboboxTagProps } from './types';

/** The combobox as a tag: the config as props, plus any attribute of the element. */
export function Combobox<V extends string = string>(props: ComboboxTagProps<V>): React.ReactElement {
  const [config, root] = splitProps<ComboboxConfig>(props as unknown as Record<string, unknown>, COMBOBOX_KEYS);
  return useCombobox(config).render(root);
}
