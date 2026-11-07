import type * as React from 'react';
import { splitProps } from '../preset';
import { SLIDER_KEYS } from './keys';
import { useSlider } from './useSlider';
import type { SliderConfig, SliderTagProps } from './types';

/** The slider as a tag: the config as props, plus any attribute of the element. */
export function Slider(props: SliderTagProps): React.ReactElement {
  const [config, root] = splitProps<SliderConfig>(props as unknown as Record<string, unknown>, SLIDER_KEYS);
  return useSlider(config).render(root);
}
