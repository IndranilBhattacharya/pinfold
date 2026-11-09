import type * as React from 'react';
import type { Length, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type CardSlot = 'root' | 'media' | 'body' | 'title' | 'description' | 'content' | 'actions';
export type CardVariant = 'outline' | 'elevated' | 'filled' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardOrientation = 'vertical' | 'horizontal';

export interface CardImage {
  src: string;
  /** What the picture shows, or `''` when it is decoration. Required on purpose. */
  alt: string;
}

/** Passed to slot `render` overrides. */
export interface CardState {
  variant: CardVariant;
  orientation: CardOrientation;
  linked: boolean;
}

export interface CardDimensions {
  padding?: Length;
  gap?: Length;
  radius?: Length;
  mediaSize?: Length;
}

/**
 *   const Plan = defineCard({ variant: 'elevated', as: 'article' });
 *   <Plan title="Pro" description="For growing teams" actions={[{ label: 'Upgrade', onClick: upgrade }]} />
 */
export interface CardConfig extends SlotOverrides<CardSlot, CardState> {
  /** The heading; with `href`, also the link text. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  image?: CardImage;
  /** Buttons at the bottom. Small; the first solid, the rest outline. */
  actions?: readonly ButtonConfig[];
  /** The whole card becomes a link (through its title). */
  href?: string;
  target?: string;
  rel?: string;
  /** @default 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** @default 'div' */
  as?: 'div' | 'article' | 'section' | 'li';
  /** @default 'outline' */
  variant?: CardVariant;
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

export type CardRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'title' | 'content'> & { [key: `data-${string}`]: unknown };
export type CardTagProps = CardConfig & Omit<CardRootProps, keyof CardConfig>;

export interface CardApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CardRootProps) => React.ReactElement;
}
export type CardComponent = PinfoldComponent<CardApi, CardRootProps>;
