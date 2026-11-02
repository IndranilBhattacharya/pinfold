import type * as React from 'react';
import type { Length, PinfoldRadius, PinfoldSize, PinfoldTone } from '@pinfold/core';
import type { SlotOverrides } from '../types';

/*
 * Typing rules (CONTRIBUTING.md, "Typed API"): every option with a default carries `@default`,
 * checked against the meta. `size` and `tone` have none: unset, they follow the nearest
 * provider through CSS (D-23). No option is conditionally required; an icon-only button
 * without `aria-label` is a dev warning.
 */

export type ButtonSlot = 'root' | 'icon' | 'label' | 'endIcon' | 'spinner';
export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
/** A radius preset (scales the size's radius) or a length: `20` is px, strings pass through. */
export type ButtonRadius = PinfoldRadius | number | (string & {});

/** Passed to every slot `render` override. */
export interface ButtonState {
  variant: ButtonVariant;
  disabled: boolean;
  loading: boolean;
  /** An icon and no label. */
  iconOnly: boolean;
}

export interface ButtonDimensions {
  height?: Length;
  minWidth?: Length;
  paddingX?: Length;
  gap?: Length;
  radius?: Length;
  fontSize?: Length;
  iconSize?: Length;
}

/** The button's own options. Every other attribute goes to the element. */
export interface ButtonOptions extends SlotOverrides<ButtonSlot, ButtonState> {
  /** The label. */
  children?: React.ReactNode;
  /**
   * Surface: filled, tinted, framed, none, or underlined text.
   * @default 'solid'
   */
  variant?: ButtonVariant;
  /** Size preset. Unset follows the nearest provider (md by default). */
  size?: PinfoldSize;
  /** Colour role. Unset follows the nearest provider (primary by default). */
  tone?: PinfoldTone;
  /** Corner radius: a preset or a length. Unset follows the theme radius. */
  radius?: ButtonRadius;
  /** A visual before the label. With no label the button is icon-only: give it `aria-label`. */
  icon?: React.ReactNode;
  /** A visual after the label. */
  endIcon?: React.ReactNode;
  /**
   * A spinner over the content, same width, `aria-busy`, activation blocked, still focusable.
   * @default false
   */
  loading?: boolean;
  /** Announced instead of the label while loading, e.g. "Saving". */
  loadingText?: string;
  /**
   * Blocks activation with `aria-disabled`; the button stays focusable.
   * @default false
   */
  disabled?: boolean;
  /**
   * Fill the width of the parent.
   * @default false
   */
  fullWidth?: boolean;
  /** Renders an `<a>`. `target="_blank"` adds `rel="noopener noreferrer"`. */
  href?: string;
  /**
   * The native button type. `button`, so a button in a form never submits it by accident.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  /** Exact measurements over the size preset. Numbers are px. */
  dimensions?: ButtonDimensions;
  /**
   * Drop Pinfold classes; keep behaviour, ARIA and data attributes.
   * @default false
   */
  unstyled?: boolean;
  /** Class on the root. */
  className?: string;
}

type AnchorExtras = Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel' | 'download' | 'hrefLang' | 'referrerPolicy' | 'ping'>;

/** Everything `<Button>` accepts: its options, any button attribute, and the link attributes for `href`. */
export interface ButtonProps
  extends ButtonOptions,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOptions>,
    AnchorExtras {}
