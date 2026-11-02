import type * as React from 'react';
import type { Length, PinfoldRadius, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides, Slottable } from '../types';

/*
 * Typing rules (CONTRIBUTING.md, "Typed API"): every option with a default carries `@default`,
 * checked against the meta. `label` is the one required option: it is the visible text, and the
 * accessible name of an icon-only button, so an unnamed button cannot be written.
 */

export type ButtonSlot = 'root' | 'icon' | 'label' | 'endIcon' | 'spinner';
export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
/** A radius preset (scales the size's radius) or a length: `20` is px, strings pass through. */
export type ButtonRadius = PinfoldRadius | number | (string & {});

/** Live state, passed to function-valued fields and slot `render` overrides. */
export interface ButtonState {
  variant: ButtonVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  disabled: boolean;
  loading: boolean;
  iconOnly: boolean;
}

/** Anything renderable, or a function of the live state. */
export type ButtonNode = Slottable<ButtonState>;

export interface ButtonDimensions {
  height?: Length;
  minWidth?: Length;
  paddingX?: Length;
  gap?: Length;
  radius?: Length;
  fontSize?: Length;
  iconSize?: Length;
}

/**
 * The whole button as one object:
 *
 *   const Save = useButton({ label: 'Save', tone: 'success', onClick: save });
 *   return <Save />;
 */
export interface ButtonConfig extends SlotOverrides<ButtonSlot, ButtonState> {
  /** The text. Required: it is also the accessible name when `iconOnly`. */
  label: ButtonNode;
  /**
   * Show only the icon, square; `label` becomes the accessible name and the tooltip.
   * @default false
   */
  iconOnly?: boolean;
  /** @default 'solid' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** Corner radius: a preset or a length. Unset follows the theme radius. */
  radius?: ButtonRadius;
  /** A visual before the label (a node, an emoji or an icon-font ligature). */
  icon?: ButtonNode;
  /** A visual after the label. */
  endIcon?: ButtonNode;
  /**
   * Shows a spinner in place of the icon and blocks activation; the label stays visible.
   * Unset, the button manages it: an `onClick` that returns a promise shows it until the promise settles.
   * @default false
   */
  loading?: boolean;
  /** Shown instead of the label while loading, e.g. "Saving…". */
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
  /** Renders a link (`<a>`). */
  href?: string;
  /** Link target. `_blank` gets `rel="noopener noreferrer"` added. */
  target?: string;
  /** Link relationship, kept and extended for new tabs. */
  rel?: string;
  /**
   * The native button type. `button`, so a button in a form never submits it by accident.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  /** Activation. Return a promise and the button shows its loading state until it settles. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => unknown;
  /** Exact measurements over the size preset. Numbers are px. */
  dimensions?: ButtonDimensions;
  /**
   * Drop Pinfold classes; keep behaviour, ARIA and data attributes.
   * @default false
   */
  unstyled?: boolean;
  /** Class on the root. */
  className?: string;
  /** Inline style on the root. */
  style?: React.CSSProperties;
}

/** What `<Save />` accepts: layout props and any attribute of the element (`form`, `name`, `aria-*`, `data-*`). */
export type ButtonRootProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'onClick' | 'disabled'> & {
  [key: `data-${string}`]: unknown;
};

/** The controller: the same value that renders as `<Save />`. */
export interface ButtonApi {
  /** Whether the button is loading right now (config, or a pending promise from `onClick`). */
  loading: boolean;
  /** Start or stop the loading state by hand. Ignored while `loading` is set in the config. */
  setLoading: (loading: boolean) => void;
  focus: () => void;
  /** Activate it from code, exactly as a click would (blocked while disabled or loading). */
  click: () => void;
  /** Rung 5 of the ladder: every attribute the root needs, merged over yours. */
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ButtonRootProps) => React.ReactElement;
}

export type ButtonComponent = PinfoldComponent<ButtonApi, ButtonRootProps>;
