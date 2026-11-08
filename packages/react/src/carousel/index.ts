/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/carousel.css'.
   Server-safe barrel: `defineCarousel` here, the client module re-exported. */

export { Carousel, useCarousel } from './client';
export { Carousel as default } from './client';
export { defineCarousel, type DefinedCarousel, type CarouselPresetProps } from './define';
export type { CarouselApi, CarouselComponent, CarouselConfig, CarouselRootProps, CarouselTagProps, CarouselSlot, CarouselState, CarouselSlide, CarouselLabels, CarouselDimensions } from './types';
