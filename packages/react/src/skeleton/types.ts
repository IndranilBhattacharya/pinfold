import type * as React from 'react';
import type { Length, PinfoldSize, PropsBag, SkeletonNode, SkeletonPresetName } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type SkeletonSlot = 'root' | 'line' | 'shape';
export type SkeletonVariant = 'text' | 'rect' | 'circle' | 'pill' | 'square';
export type { SkeletonNode, SkeletonPresetName };
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
export interface SkeletonConfig extends SlotOverrides<SkeletonSlot, SkeletonState, SkeletonNode | SkeletonShape> {
  /** @default 'text' */
  variant?: SkeletonVariant;
  /** @default 1 */
  lines?: number;
  /**
   * Width of the last of several text lines.
   * @default '62%'
   */
  lastLine?: Length;
  /** Aspect ratio of a rect, square or circle (`'16/9'` or `1.78`); replaces the height. */
  ratio?: number | string;
  /** A ready-made layout. Tune it with `rows`, `columns` and `count`. */
  preset?: SkeletonPresetName;
  /** Copies of the preset or layout, laid out in `columns`. Default 1. */
  count?: number;
  /** Rows inside a preset: text lines, list items, table rows, form fields, sidebar entries, tabs. */
  rows?: number;
  /** Columns of a preset: table columns, dashboard tiles, or the grid of `count` copies. */
  columns?: number;
  /**
   * Any layout as data. Each node has one shape key and any options:
   * `[{ row: [{ circle: 40 }, { stack: [{ line: '60%' }, { line: '40%' }] }] }, { rect: 160 }]`.
   */
  layout?: readonly SkeletonNode[];
  /** The earlier layout form: `[{ variant: 'circle' }, { lines: 2 }]`. `layout` is shorter and does more. */
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
  /** The real content, shown when `loading` is false. On the tag, `children` work too. */
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

export type SkeletonRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content'> & { children?: React.ReactNode } & { [key: `data-${string}`]: unknown };
export type SkeletonTagProps = SkeletonConfig & Omit<SkeletonRootProps, keyof SkeletonConfig>;

export interface SkeletonApi {
  /** Whether the placeholder is showing. */
  loading: boolean;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SkeletonRootProps) => React.ReactElement;
}
export type SkeletonComponent = PinfoldComponent<SkeletonApi, SkeletonRootProps>;
