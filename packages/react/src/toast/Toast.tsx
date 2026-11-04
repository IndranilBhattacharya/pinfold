import type * as React from 'react';
import { splitProps } from '../preset';
import { TOAST_KEYS } from './keys';
import { useToast } from './useToast';
import type { ToastConfig, ToastTagProps } from './types';

/** The toast as a tag: the config as props, plus any attribute of the element. */
export function Toast(props: ToastTagProps): React.ReactElement {
  const [config, root] = splitProps<ToastConfig>(props as unknown as Record<string, unknown>, TOAST_KEYS);
  return useToast(config).render(root);
}
