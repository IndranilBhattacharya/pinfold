import type * as React from 'react';
import type { Length, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides, Slottable } from '../types';
import type { ButtonConfig } from '../button/types';

export type CardSlot =
  | 'root'
  | 'media'
  | 'image'
  | 'body'
  | 'header'
  | 'avatar'
  | 'eyebrow'
  | 'title'
  | 'subtitle'
  | 'headerAction'
  | 'description'
  | 'content'
  | 'footer'
  | 'actions'
  | 'badge'
  | 'ribbon'
  | 'select'
  | 'indicator'
  | 'placeholder';
export type CardVariant = 'outline' | 'elevated' | 'filled' | 'soft' | 'ghost' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardOrientation = 'vertical' | 'horizontal';
export type CardMediaPosition = 'top' | 'bottom' | 'start' | 'end' | 'cover';
export type CardScrim = 'gradient' | 'full' | 'none';
export type CardActionsAlign = 'start' | 'end' | 'stretch' | 'between';
export type CardHoverEffect = 'auto' | 'none' | 'lift' | 'glow' | 'border' | 'zoom';
export type CardSelectable = boolean | 'checkbox' | 'radio';

export interface CardImage {
  src: string;
  /** What the picture shows, or `''` when it is decoration. Required on purpose. */
  alt: string;
}

/** Live state, passed to function-valued fields and slot `render` overrides. */
export interface CardState {
  variant: CardVariant;
  orientation: CardOrientation;
  /** Where the media sits. */
  mediaPosition: CardMediaPosition;
  /** The card is a link. */
  linked: boolean;
  /** The card is a button. */
  pressable: boolean;
  /** `checkbox` or `radio` for a selection card, else `false`. */
  selectable: false | 'checkbox' | 'radio';
  selected: boolean;
  disabled: boolean;
  loading: boolean;
}

/** Anything renderable, or a function of the live state. */
export type CardNode = Slottable<CardState>;

export interface CardDimensions {
  padding?: Length;
  gap?: Length;
  radius?: Length;
  mediaSize?: Length;
  headerGap?: Length;
}

/**
 *   const Plan = defineCard({ variant: 'elevated', as: 'article' });
 *   <Plan title="Pro" description="For growing teams" actions={[{ label: 'Upgrade', onClick: upgrade }]} />
 */
export interface CardConfig extends SlotOverrides<CardSlot, CardState> {
  /** The heading, or a function of the live state; with `href` or `pressable`, also the link or button text. */
  title?: CardNode;
  /** A small label above the title. */
  eyebrow?: React.ReactNode;
  /** A muted line under the title. */
  subtitle?: React.ReactNode;
  /** Before the title in the header: an avatar, an icon, a logo. */
  avatar?: React.ReactNode;
  /** At the end of the header: a menu button, a toggle. */
  headerAction?: React.ReactNode;
  /** A line under the header, or a function of the live state. */
  description?: CardNode;
  /** Anything below. `children` on the tag is the same. */
  content?: React.ReactNode;
  /** The bottom row, before the actions. */
  footer?: React.ReactNode;
  image?: CardImage;
  /** Any media instead of `image`, or a function of the live state. */
  media?: CardNode;
  /** Where the media goes. Unset: `top`, or `start` when horizontal. */
  mediaPosition?: CardMediaPosition;
  /** Aspect ratio of the media: `1.78` or `'16 / 9'`. */
  mediaRatio?: Length;
  /** @default 'gradient' */
  scrim?: CardScrim;
  /** Pinned in the top-end corner. */
  badge?: React.ReactNode;
  /** A diagonal ribbon across the top-end corner. */
  ribbon?: React.ReactNode;
  /** Buttons in the footer. Small; the first solid, the rest outline. */
  actions?: readonly ButtonConfig[];
  /** @default 'start' */
  actionsAlign?: CardActionsAlign;
  /** @default false */
  dividers?: boolean;
  /** The whole card becomes a link (through its title). */
  href?: string;
  target?: string;
  rel?: string;
  /**
   * The whole card becomes a button (through its title). `onPress` alone does too.
   * @default false
   */
  pressable?: boolean;
  onPress?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Accessible name of the card's control when it has no title. */
  label?: string;
  /**
   * A selection card: `true` or `'checkbox'`, or `'radio'`.
   * @default false
   */
  selectable?: CardSelectable;
  /** Controlled selection. */
  selected?: boolean;
  /** @default false */
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Form field name of a selectable card. */
  name?: string;
  /** Form value of a selectable card. */
  value?: string;
  /** Called after any action button's own `onClick`. */
  onAction?: (action: ButtonConfig, index: number, event: React.MouseEvent<HTMLElement>) => void;
  /** @default 'auto' */
  hoverEffect?: CardHoverEffect;
  /** @default false */
  loading?: boolean;
  /** @default false */
  disabled?: boolean;
  /** @default 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** @default 'div' */
  as?: 'div' | 'article' | 'section' | 'li';
  /** @default 'outline' */
  variant?: CardVariant;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default 'md' */
  padding?: CardPadding;
  /** @default 'vertical' */
  orientation?: CardOrientation;
  dimensions?: CardDimensions;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. `dimensions.radius` still wins. Default the theme radius. */
  radius?: RadiusOption;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type CardRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'title' | 'content'> & { [key: `data-${string}`]: unknown; children?: React.ReactNode };
export type CardTagProps = CardConfig & Omit<CardRootProps, keyof CardConfig>;

export interface CardApi {
  /** The current selection of a selectable card. */
  selected: boolean;
  setSelected: (selected: boolean) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CardRootProps) => React.ReactElement;
}
export type CardComponent = PinfoldComponent<CardApi, CardRootProps>;
