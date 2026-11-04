import type * as React from 'react';
import { splitProps } from '../preset';
import { DIALOG_KEYS } from './keys';
import { useDialog } from './useDialog';
import type { DialogConfig, DialogTagProps } from './types';

/** The dialog as a tag: the config as props, plus any attribute of the element. */
export function Dialog(props: DialogTagProps): React.ReactElement {
  const [config, root] = splitProps<DialogConfig>(props as unknown as Record<string, unknown>, DIALOG_KEYS);
  return useDialog(config).render(root);
}
