import * as React from 'react';
import { mergeConfig } from '../preset';
import { Tour } from './client';
import type { TourConfig, TourTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type TourPresetProps<P> = TourTagProps;

/** What `defineTour` returns: a component with the preset baked in. */
export type DefinedTour<P extends Partial<TourConfig> = Partial<TourConfig>> = ((props: TourPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable tour, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.tour`, the provider and the library defaults.
 */
export function defineTour<P extends Partial<TourConfig>>(preset: P = {} as P): DefinedTour<P> {
  const Defined = ((props: TourPresetProps<P>) =>
    React.createElement(Tour, mergeConfig<TourTagProps>(preset as unknown as Partial<TourTagProps>, props as unknown as Partial<TourTagProps>))) as DefinedTour<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTour';
  return Defined;
}
