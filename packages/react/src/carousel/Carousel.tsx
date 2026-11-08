import type * as React from 'react';
import { splitProps } from '../preset';
import { CAROUSEL_KEYS } from './keys';
import { useCarousel } from './useCarousel';
import type { CarouselConfig, CarouselTagProps } from './types';

/** The carousel as a tag: the config as props, plus any attribute of the element. */
export function Carousel(props: CarouselTagProps): React.ReactElement {
  const [config, root] = splitProps<CarouselConfig>(props as unknown as Record<string, unknown>, CAROUSEL_KEYS);
  return useCarousel(config).render(root);
}
