import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type BadgeSlot = 'root' | 'dot' | 'icon' | 'label' | 'count' | 'anchor';
export type BadgeVariant = 'soft' | 'solid' | 'outline';
export type BadgeRadius = 'none' | 'sm' | 'md' | 'full';
export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

/** Passed to slot `render` overrides. */
export interface BadgeState {
  variant: BadgeVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** A dot with nothing beside it. */
  dotOnly: boolean;
  /** False when there is nothing to show (a count of zero and no label). */
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
 *   const Unread = defineBadge({ tone: 'danger', variant: 'solid', srLabel: 'unread messages' });
 *   <Unread label="Inbox" count={3} />                  // Inbox 3
 *   <Unread count={3} anchor={<Avatar name="Ada" />} /> // pinned to the avatar
 */
export interface BadgeConfig extends SlotOverrides<BadgeSlot, BadgeState> {
  /** The text. Always shown. */
  label?: React.ReactNode;
  /** A number, shown after the label. Zero does not show unless `showZero`. */
  count?: number;
  /** @default 99 */
  max?: number;
  /** @default false */
  showZero?: boolean;
  /** A status dot: before the label, or on its own. @default false */
  dot?: boolean;
  /** Decorative icon before the label. */
  icon?: React.ReactNode;
  /** Read by screen readers, never shown: what a bare number or dot means. */
  srLabel?: string;
  /** Pin the badge to this: an avatar, an icon button, anything. */
  anchor?: React.ReactNode;
  /** @default 'top-end' */
  placement?: BadgePlacement;
  /** @default 'rect' */
  anchorShape?: 'rect' | 'circle';
  /** @default 'soft' */
  variant?: BadgeVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default 'full' */
  radius?: BadgeRadius;
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
