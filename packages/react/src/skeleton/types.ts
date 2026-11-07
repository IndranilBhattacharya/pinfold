import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type SkeletonSlot = 'root' | 'line';
export type SkeletonVariant = 'text' | 'rect' | 'circle';
export type SkeletonAnimation = 'shimmer' | 'wave' | 'pulse' | 'stagger' | 'none';
export type SkeletonDirection = 'column' | 'row';

/** One piece of a layout: a shape, or a nested group of them. */
export interface SkeletonShape {
  variant?: SkeletonVariant;
  lines?: number;
  size?: PinfoldSize;
  dimensions?: SkeletonDimensions;
  items?: readonly SkeletonShape[];
  direction?: SkeletonDirection;
}

/** Passed to slot `render` overrides. */
export interface SkeletonState {
  variant: SkeletonVariant;
  size: PinfoldSize;
  loading: boolean;
}

export interface SkeletonDimensions {
  width?: Length;
  height?: Length;
  radius?: Length;
  gap?: Length;
}

/**
 *   const Paragraph = defineSkeleton({ lines: 3 });
 *   <Paragraph loading={!data} content={<p>{data?.bio}</p>} />
 */
export interface SkeletonConfig extends SlotOverrides<SkeletonSlot, SkeletonState> {
  /** @default 'text' */
  variant?: SkeletonVariant;
  /** @default 1 */
  lines?: number;
  /** A layout from one config: `[{ variant: 'circle' }, { lines: 2 }]`. */
  items?: readonly SkeletonShape[];
  /** @default 'column' */
  direction?: SkeletonDirection;
  /** @default 'shimmer' */
  animation?: SkeletonAnimation;
  /** @default 'md' */
  size?: PinfoldSize;
  /**
   * While true the placeholder shows; false shows `content`.
   * @default true
   */
  loading?: boolean;
  /** The real content, shown when `loading` is false. */
  content?: React.ReactNode;
  /**
   * Announced while loading (visually hidden). Empty: silent, the root is still `aria-busy`.
   * @default ''
   */
  label?: string;
  dimensions?: SkeletonDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type SkeletonRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content'> & { [key: `data-${string}`]: unknown };
export type SkeletonTagProps = SkeletonConfig & Omit<SkeletonRootProps, keyof SkeletonConfig>;

export interface SkeletonApi {
  /** Whether the placeholder is showing. */
  loading: boolean;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SkeletonRootProps) => React.ReactElement;
}
export type SkeletonComponent = PinfoldComponent<SkeletonApi, SkeletonRootProps>;
