import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type CarouselSlot = 'root' | 'viewport' | 'track' | 'slide' | 'previous' | 'next' | 'indicators' | 'indicator' | 'play';

/** One slide: what it shows and, for screen readers, what it is. */
export interface CarouselSlide {
  content: React.ReactNode;
  /** Read with the slide, e.g. "Winter jackets". Default "3 of 8". */
  label?: string;
}

/** Text read, for translation. */
export interface CarouselLabels {
  /** @default 'Previous slide' */
  previous?: string;
  /** @default 'Next slide' */
  next?: string;
  /** Default "3 of 8". */
  slide?: (index: number, count: number) => string;
  /** Default "Go to slide 3". */
  goTo?: (index: number) => string;
  /** @default 'Pause' */
  pause?: string;
  /** @default 'Play' */
  play?: string;
}

/** Passed to slot `render` overrides. */
export interface CarouselState {
  size: PinfoldSize;
  tone: PinfoldTone;
  index: number;
  playing: boolean;
}

export interface CarouselDimensions {
  /** Space between slides. */
  gap?: Length;
}

/**
 *   const Gallery = defineCarousel({ slidesPerView: 2 });
 *   <Gallery label="New arrivals" slides={products.map((p) => ({ label: p.name, content: <ProductCard {...p} /> }))} />
 */
export interface CarouselConfig extends SlotOverrides<CarouselSlot, CarouselState> {
  /** Names the carousel, e.g. "New arrivals". */
  label: string;
  /** The slides: any nodes, or `{ content, label }`. */
  slides: ReadonlyArray<CarouselSlide | React.ReactNode>;
  /** The first slide in view, controlled. */
  index?: number;
  /** @default 0 */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Slides in view at once; a fraction shows the edge of the next one. @default 1 */
  slidesPerView?: number;
  /** Previous and next wrap around. @default false */
  loop?: boolean;
  /** Turns on its own every this many milliseconds, with a pause button; stops on hover, focus and reduced motion. */
  autoplay?: number;
  /** Previous and next buttons. @default true */
  controls?: boolean;
  /** A dot per position. @default true */
  indicators?: boolean;
  labels?: CarouselLabels;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: CarouselDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type CarouselRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type CarouselTagProps = CarouselConfig & Omit<CarouselRootProps, keyof CarouselConfig>;

export interface CarouselApi {
  index: number;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CarouselRootProps) => React.ReactElement;
}
export type CarouselComponent = PinfoldComponent<CarouselApi, CarouselRootProps>;
