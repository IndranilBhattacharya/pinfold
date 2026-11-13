import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides, Slottable } from '../types';

export type BadgeSlot = 'root' | 'action' | 'dot' | 'avatar' | 'icon' | 'label' | 'count' | 'endIcon' | 'dismiss' | 'anchor' | 'corner';
export type BadgeVariant = 'soft' | 'solid' | 'outline' | 'dot';
export type BadgeRadius = 'none' | 'sm' | 'md' | 'full';
export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';
export type BadgeAnchorShape = 'auto' | 'rect' | 'circle';

/** Live state, passed to function-valued fields and slot `render` overrides. */
export interface BadgeState {
  variant: BadgeVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** A dot with nothing beside it. */
  dotOnly: boolean;
  /** False when there is nothing to show (a count of zero and no label). */
  visible: boolean;
  /** Hidden by `invisible`, by a dismiss, or a pinned count of zero. */
  invisible: boolean;
  /** It has `onClick` or `href`. */
  clickable: boolean;
  /** The × button was pressed. */
  dismissed: boolean;
  /** The count as given. */
  count: number | undefined;
}

/** Anything renderable, or a function of the live state. */
export type BadgeNode = Slottable<BadgeState>;

export interface BadgeDimensions {
  height?: Length;
  paddingX?: Length;
  gap?: Length;
  fontSize?: Length;
  dotSize?: Length;
  /** Pinned: moves the badge from the edge toward the anchor's centre (negative moves it out). */
  offset?: Length;
}

/**
 *   const Unread = defineBadge({ tone: 'danger', variant: 'solid', srLabel: 'unread messages' });
 *   <Unread label="Inbox" count={3} />                  // Inbox 3
 *   <Unread count={3} anchor={<Avatar name="Ada" />} /> // pinned to the avatar's edge
 */
export interface BadgeConfig extends SlotOverrides<BadgeSlot, BadgeState> {
  /** The text, or a function of the live state. Always shown. */
  label?: BadgeNode;
  /** A number, shown after the label. Zero does not show unless `showZero`. */
  count?: number;
  /** @default 99 */
  max?: number;
  /** @default false */
  showZero?: boolean;
  /** Your own count text (`1.2k`); replaces the "max+" text. Called only when the count shows. */
  formatCount?: (count: number) => React.ReactNode;
  /** A status dot: before the label, or on its own. @default false */
  dot?: boolean;
  /** Decorative icon before the label. */
  icon?: BadgeNode;
  /** Decorative icon after the label and count. */
  endIcon?: BadgeNode;
  /** A small picture at the start: an `<Avatar size="sm" />` or an `<img>`. */
  avatar?: React.ReactNode;
  /** Read by screen readers, never shown: what a bare number or dot means. */
  srLabel?: string;
  /** Pin the badge to this: an avatar, an icon button, anything. */
  anchor?: React.ReactNode;
  /** @default 'top-end' */
  placement?: BadgePlacement;
  /**
   * `auto` reads the anchor's corner radius, so the badge sits on its curve; `rect` and `circle` fix it.
   * @default 'auto'
   */
  anchorShape?: BadgeAnchorShape;
  /** @default 'soft' */
  variant?: BadgeVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default 'full' */
  radius?: BadgeRadius;
  /**
   * Hide it, animated; it keeps its place.
   * @default false
   */
  invisible?: boolean;
  /**
   * A soft ping around the dot (or the badge) for live status.
   * @default false
   */
  pulse?: boolean;
  /** Makes the badge a button. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Makes the badge a link. */
  href?: string;
  /** Link target. `_blank` adds `rel="noopener noreferrer"`. */
  target?: string;
  /** Link rel, merged with the safe defaults. */
  rel?: string;
  /**
   * A × button that hides the badge and calls `onDismiss`.
   * @default false
   */
  dismissible?: boolean;
  /** @default 'Remove' */
  dismissLabel?: string;
  /** Called when the × button is pressed. */
  onDismiss?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  dimensions?: BadgeDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type BadgeRootProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'onClick'> & { [key: `data-${string}`]: unknown };
export type BadgeTagProps = BadgeConfig & Omit<BadgeRootProps, keyof BadgeConfig>;

export interface BadgeApi {
  /** True after the × button (or `dismiss()`) hid it. */
  dismissed: boolean;
  dismiss: () => void;
  /** Show it again after a dismiss. */
  show: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: BadgeRootProps) => React.ReactElement;
}
export type BadgeComponent = PinfoldComponent<BadgeApi, BadgeRootProps>;
