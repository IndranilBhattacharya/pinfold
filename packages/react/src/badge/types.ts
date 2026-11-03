import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type BadgeSlot = 'root' | 'icon' | 'label';
export type BadgeVariant = 'solid' | 'soft' | 'outline';
export type BadgeRadius = 'none' | 'sm' | 'md' | 'full';
export type BadgePlacement = 'inline' | 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';
export type BadgeKind = 'label' | 'count' | 'dot';

/** Passed to slot `render` overrides. */
export interface BadgeState {
  kind: BadgeKind;
  variant: BadgeVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** False when a zero count hides the badge. */
  visible: boolean;
}

export interface BadgeDimensions {
  height?: Length;
  paddingX?: Length;
  gap?: Length;
  fontSize?: Length;
  dotSize?: Length;
}

/**
 *   const Unread = defineBadge({ tone: 'danger', label: 'unread messages' });
 *   <Unread count={3} />      // shows "3", reads "3 unread messages"
 */
export interface BadgeConfig extends SlotOverrides<BadgeSlot, BadgeState> {
  /** The text. With `count` or `dot` it is read, not shown. */
  label?: React.ReactNode;
  /** A number instead of the label. Zero hides the badge unless `showZero`. */
  count?: number;
  /** @default 99 */
  max?: number;
  /** @default false */
  showZero?: boolean;
  /** @default false */
  dot?: boolean;
  /** Decorative icon before the text. */
  icon?: React.ReactNode;
  /** @default 'solid' */
  variant?: BadgeVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default 'full' */
  radius?: BadgeRadius;
  /**
   * In the text flow, or on a corner of the nearest positioned parent.
   * @default 'inline'
   */
  placement?: BadgePlacement;
  dimensions?: BadgeDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type BadgeRootProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type BadgeTagProps = BadgeConfig & Omit<BadgeRootProps, keyof BadgeConfig>;

export interface BadgeApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: BadgeRootProps) => React.ReactElement;
}
export type BadgeComponent = PinfoldComponent<BadgeApi, BadgeRootProps>;
