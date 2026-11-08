import type * as React from 'react';
import { splitProps } from '../preset';
import { COLORPICKER_KEYS } from './keys';
import { useColorPicker } from './useColorPicker';
import type { ColorPickerConfig, ColorPickerTagProps } from './types';

/** The colorpicker as a tag: the config as props, plus any attribute of the element. */
export function ColorPicker(props: ColorPickerTagProps): React.ReactElement {
  const [config, root] = splitProps<ColorPickerConfig>(props as unknown as Record<string, unknown>, COLORPICKER_KEYS);
  return useColorPicker(config).render(root);
}
