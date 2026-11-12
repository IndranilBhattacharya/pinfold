import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
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
  variant: CarouselVariant;
  orientation: 'horizontal' | 'vertical';
  /** A mouse drag is under way. */
  dragging: boolean;
}

/**
 * How the slides sit. `slide`: a row (or column) that moves by a slide. `center`: the current slide in
 * the middle and larger, its neighbours peeking beside it. `coverflow`: the same, the neighbours turned
 * away in depth. `stagger`: a row whose slides step up and down in turn.
 */
export type CarouselVariant = 'slide' | 'center' | 'coverflow' | 'stagger';

/** One slide's place and state: `render` overrides of the slide get it as `item`. */
export interface CarouselSlideContext {
  index: number;
  active: boolean;
  /** How many slides it is from the current one: negative before it, positive after. */
  offset: number;
  label: string;
}

export interface CarouselDimensions {
  /** Space between slides. */
  gap?: Length;
  /** Height of the viewport (a vertical carousel needs one). */
  height?: Length;
}

/**
 *   const Gallery = defineCarousel({ slidesPerView: 2 });
 *   <Gallery label="New arrivals" slides={products.map((p) => ({ label: p.name, content: <ProductCard {...p} /> }))} />
 */
export interface CarouselConfig extends SlotOverrides<CarouselSlot, CarouselState, CarouselSlideContext> {
  /** Names the carousel, e.g. "New arrivals". */
  label: string;
  /** The slides: any nodes, or `{ content, label }`. */
  slides: ReadonlyArray<CarouselSlide | React.ReactNode>;
  /** The first slide in view, controlled. */
  index?: number;
  /** @default 0 */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** How the slides sit: a row, the current one centred and larger, a cover flow, or a staggered row. @default 'slide' */
  variant?: CarouselVariant;
  /** A row, or a column that moves up and down (set `dimensions.height`). @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Slides in view at once; a fraction shows the edge of the next one. Default 1 (`center` 1.4, `coverflow` 2, `stagger` 3). */
  slidesPerView?: number;
  /** A mouse can drag the slides (touch and trackpads always scroll them). @default true */
  draggable?: boolean;
  /** The edges of the viewport fade out, so slides arrive and leave softly. @default false */
  edgeFade?: boolean;
  /** Previous and next wrap around. @default false */
  loop?: boolean;
  /** Turns on its own every this many milliseconds, with a pause button; stops on hover, focus and reduced motion. */
  autoplay?: number;
  /** Previous and next buttons: over the slides, only while pointing at the carousel (or focused inside), under the slides, or none. `true` and `false` read as always and none. @default 'always' */
  controls?: 'always' | 'hover' | 'below' | 'none' | boolean;
  /** Where it is: a dot per position, thin lines, "3 / 8", or nothing. `true` and `false` read as dots and none. @default 'dots' */
  indicators?: 'dots' | 'lines' | 'fraction' | 'none' | boolean;
  labels?: CarouselLabels;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
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
  /** How many slides there are. */
  count: number;
  /** Autoplay is running right now. */
  playing: boolean;
  play: () => void;
  pause: () => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CarouselRootProps) => React.ReactElement;
}
export type CarouselComponent = PinfoldComponent<CarouselApi, CarouselRootProps>;
