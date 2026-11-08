import type * as React from 'react';
import { splitProps } from '../preset';
import { RATING_KEYS } from './keys';
import { useRating } from './useRating';
import type { RatingConfig, RatingTagProps } from './types';

/** The rating as a tag: the config as props, plus any attribute of the element. */
export function Rating(props: RatingTagProps): React.ReactElement {
  const [config, root] = splitProps<RatingConfig>(props as unknown as Record<string, unknown>, RATING_KEYS);
  return useRating(config).render(root);
}
