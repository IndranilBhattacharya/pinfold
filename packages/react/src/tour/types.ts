import type * as React from 'react';
import type { Length, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type TourSlot = 'root' | 'overlay' | 'spotlight' | 'card' | 'arrow' | 'header' | 'counter' | 'title' | 'content' | 'footer' | 'progress' | 'dot' | 'actions';
/** What a step points at: a CSS selector, a ref, or a function that finds the element. */
export type TourTarget = string | React.RefObject<Element | null> | (() => Element | null | undefined);

export interface TourStep {
  /** Names the step (handed back in events). */
  id?: string;
  /** None: the card sits in the middle. */
  target?: TourTarget;
  title?: React.ReactNode;
  content?: React.ReactNode;
  placement?: OverlayPlacement;
  spotlightPadding?: number;
  spotlightRadius?: number;
  /** This step's target can be used. */
  interactive?: boolean;
  /** Extra buttons before Back and Next. */
  actions?: ButtonConfig[];
}

/** Passed to slot `render` overrides. */
export interface TourState {
  open: boolean;
  /** The current step, from 0. */
  step: number;
  total: number;
  /** The current step has no target on the page. */
  centered: boolean;
  /** `beforeStep` is running. */
  pending: boolean;
  size: PinfoldSize;
  tone: PinfoldTone;
}

/** A progress dot's `item`. */
export interface TourDotContext {
  index: number;
  step: TourStep;
  current: boolean;
  done: boolean;
}

export interface TourLabels {
  next?: string;
  back?: string;
  skip?: string;
  done?: string;
  counter?: (step: number, total: number) => string;
  tour?: string;
}

export interface TourDimensions {
  /** The card's width. */
  width?: Length;
}

/**
 *   const Onboarding = defineTour({ mask: 'dim' });
 *   <Onboarding defaultOpen steps={[{ target: '#search', title: 'Search', content: 'Press / anywhere.' }]} />
 */
export interface TourConfig extends SlotOverrides<TourSlot, TourState, TourDotContext> {
  /** The stops, in order. */
  steps?: readonly TourStep[];
  /** Running, controlled. */
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  /** The current step, controlled. */
  step?: number;
  /** @default 0 */
  defaultStep?: number;
  /** Return false (or resolve false) to stay on the step. */
  beforeStep?: (from: number, to: number) => boolean | void | Promise<boolean | void>;
  /** @default 'bottom' */
  placement?: OverlayPlacement;
  /** @default 'dim' */
  mask?: 'dim' | 'blur' | 'none';
  /** Space around the target, px. @default 8 */
  spotlightPadding?: number;
  /** Corner radius of the hole, px. @default 12 */
  spotlightRadius?: number;
  /** The spotlighted target can be used. @default false */
  interactive?: boolean;
  /** @default true */
  arrow?: boolean;
  /** @default 'both' */
  progress?: 'both' | 'dots' | 'counter' | 'none';
  /** @default true */
  showSkip?: boolean;
  /** Escape skips the tour. @default true */
  closeOnEscape?: boolean;
  /** Scroll each target into view. @default true */
  scroll?: boolean;
  /** A step whose target is missing: in the middle, or passed over. @default 'center' */
  missingTarget?: 'center' | 'skip';
  onOpenChange?: (open: boolean) => void;
  onStepChange?: (index: number, step: TourStep) => void;
  onComplete?: () => void;
  onSkip?: (index: number, step: TourStep) => void;
  labels?: TourLabels;
  dimensions?: TourDimensions;
  /** Corner radius: a preset rescales the card's corners; a length sets them. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TourRootProps = React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: unknown };
export type TourTagProps = TourConfig & Omit<TourRootProps, keyof TourConfig | 'children'>;

export interface TourApi extends TourState {
  /** Open the tour, at a step (default the first). */
  start: (step?: number) => void;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
  skip: () => void;
  /** Close without `onSkip` or `onComplete`. */
  close: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  getCardProps: (props?: PropsBag) => PropsBag;
  render: (props?: TourRootProps) => React.ReactElement;
}
export type TourComponent = PinfoldComponent<TourApi, TourRootProps>;
