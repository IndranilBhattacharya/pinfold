import * as React from 'react';
import { mergeConfig } from '../preset';
import { Rating } from './client';
import type { RatingConfig, RatingTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type RatingPresetProps<P> = RatingTagProps;

/** What `defineRating` returns: a component with the preset baked in. */
export type DefinedRating<P extends Partial<RatingConfig> = Partial<RatingConfig>> = ((props: RatingPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable rating, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Stars = defineRating({ allowHalf: true });
 *
 * Props win over the preset, then `defaults.rating`, the provider and the library defaults.
 */
export function defineRating<P extends Partial<RatingConfig>>(preset: P = {} as P): DefinedRating<P> {
  const Defined = ((props: RatingPresetProps<P>) =>
    React.createElement(Rating, mergeConfig<RatingTagProps>(preset as unknown as Partial<RatingTagProps>, props as unknown as Partial<RatingTagProps>))) as DefinedRating<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedRating';
  return Defined;
}
