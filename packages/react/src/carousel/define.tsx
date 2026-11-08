import * as React from 'react';
import { mergeConfig } from '../preset';
import { Carousel } from './client';
import type { CarouselConfig, CarouselTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type CarouselPresetProps<P> = CarouselTagProps;

/** What `defineCarousel` returns: a component with the preset baked in. */
export type DefinedCarousel<P extends Partial<CarouselConfig> = Partial<CarouselConfig>> = ((props: CarouselPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable carousel, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Gallery = defineCarousel({ slidesPerView: 2 });
 *
 * Props win over the preset, then `defaults.carousel`, the provider and the library defaults.
 */
export function defineCarousel<P extends Partial<CarouselConfig>>(preset: P = {} as P): DefinedCarousel<P> {
  const Defined = ((props: CarouselPresetProps<P>) =>
    React.createElement(Carousel, mergeConfig<CarouselTagProps>(preset as unknown as Partial<CarouselTagProps>, props as unknown as Partial<CarouselTagProps>))) as DefinedCarousel<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCarousel';
  return Defined;
}
