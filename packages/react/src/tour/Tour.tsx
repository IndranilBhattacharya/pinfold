import type * as React from 'react';
import { splitProps } from '../preset';
import { TOUR_KEYS } from './keys';
import { useTour } from './useTour';
import type { TourConfig, TourTagProps } from './types';

/** The tour as a tag: the config as props, plus any attribute of the element. */
export function Tour(props: TourTagProps): React.ReactElement {
  const [config, root] = splitProps<TourConfig>(props as unknown as Record<string, unknown>, TOUR_KEYS);
  return useTour(config).render(root);
}
