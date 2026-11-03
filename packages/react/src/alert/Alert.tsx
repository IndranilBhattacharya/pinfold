import type * as React from 'react';
import { splitProps } from '../preset';
import { ALERT_KEYS } from './keys';
import { useAlert } from './useAlert';
import type { AlertConfig, AlertTagProps } from './types';

/** The alert as a tag: the config as props, plus any attribute of the element. */
export function Alert(props: AlertTagProps): React.ReactElement {
  const [config, root] = splitProps<AlertConfig>(props as unknown as Record<string, unknown>, ALERT_KEYS);
  return useAlert(config).render(root);
}
