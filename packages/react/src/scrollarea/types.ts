import type * as React from 'react';
import type { Length, PinfoldTone, PropsBag, RadiusOption, ScrollEdges } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type ScrollAreaSlot = 'root' | 'viewport' | 'content' | 'indicator';
export type ScrollAreaIndicator = 'fade' | 'shadow' | 'glow' | 'line' | 'none';
export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export interface ScrollAreaDimensions {
  /** A fixed height. */
  height?: Length;
  /** Grow with the content up to this height, then scroll. */
  maxHeight?: Length;
  /** A fixed width. */
  width?: Length;
  /** Grow with the content up to this width, then scroll. */
  maxWidth?: Length;
  /** Space inside the viewport, around the content. */
  padding?: Length;
}

/** Passed to slot `render` overrides. */
export interface ScrollAreaState {
  orientation: ScrollAreaOrientation;
  indicator: ScrollAreaIndicator;
  /** Which edges hide content right now. */
  edges: ScrollEdges;
}

/**
 *   const Scroll = defineScrollArea({ dimensions: { maxHeight: 320 } });
 *   <Scroll label="Changelog">{entries}</Scroll>
 */
export interface ScrollAreaConfig extends SlotOverrides<ScrollAreaSlot, ScrollAreaState> {
  /** What scrolls. On the tag, `children` work too. */
  content?: React.ReactNode;
  /** Names the region for assistive technology. */
  label?: string;
  /** @default 'vertical' */
  orientation?: ScrollAreaOrientation;
  /** How an edge shows that it hides content. @default 'fade' */
  indicator?: ScrollAreaIndicator;
  /** How deep the fade, shadow or glow reaches. Default 2rem (a line: 2px). */
  indicatorSize?: Length;
  /** @default 'thin' */
  scrollbar?: 'auto' | 'thin' | 'hover' | 'hidden';
  /** Stay at the end as content arrives, unless the reader scrolled away. @default false */
  stickToEnd?: boolean;
  /** How close (px) to an end counts as reaching it. @default 48 */
  reachThreshold?: number;
  /** Scrolled to the start: load older content. */
  onReachStart?: () => void;
  /** Scrolled to the end: load more. */
  onReachEnd?: () => void;
  /** An edge started or stopped hiding content. */
  onEdgesChange?: (edges: ScrollEdges) => void;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  dimensions?: ScrollAreaDimensions;
  /** Corner radius: a preset or a length. Default the theme radius. */
  radius?: RadiusOption;
  /** Colour of the glow and the line. @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ScrollAreaRootProps = React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: unknown };
export type ScrollAreaTagProps = ScrollAreaConfig & Omit<ScrollAreaRootProps, keyof ScrollAreaConfig | 'children'> & { children?: React.ReactNode };

export interface ScrollToOptions {
  /** @default 'smooth' (instant under reduced motion or `disableAnimation`) */
  behavior?: 'smooth' | 'instant';
}

export interface ScrollAreaApi {
  /** Which edges hide content right now. */
  edges: ScrollEdges;
  /** The scrolling element, once mounted. */
  getViewport: () => HTMLDivElement | null;
  scrollToStart: (options?: ScrollToOptions) => void;
  scrollToEnd: (options?: ScrollToOptions) => void;
  /** Scroll to an offset in px (`top`, `left`), or bring an element inside the area into view. */
  scrollTo: (target: { top?: number; left?: number } | Element, options?: ScrollToOptions) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  getViewportProps: (props?: PropsBag) => PropsBag;
  render: (props?: ScrollAreaRootProps & { children?: React.ReactNode }) => React.ReactElement;
}
export type ScrollAreaComponent = PinfoldComponent<ScrollAreaApi, ScrollAreaRootProps & { children?: React.ReactNode }>;
