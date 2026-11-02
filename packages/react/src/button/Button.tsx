import type * as React from 'react';
import { splitProps } from '../preset';
import { BUTTON_KEYS } from './keys';
import { useButton } from './useButton';
import type { ButtonConfig, ButtonTagProps } from './types';

/**
 * The button as a tag: the same config, as props, plus any attribute of the element.
 *
 *   <Button label="Save" tone="success" onClick={save} />
 *
 * For a look you repeat, make a preset once with `defineButton` and use it in one line.
 */
export function Button(props: ButtonTagProps): React.ReactElement {
  const [config, root] = splitProps<ButtonConfig>(props as unknown as Record<string, unknown>, BUTTON_KEYS);
  return useButton(config).render(root);
}

