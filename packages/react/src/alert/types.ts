import type * as React from 'react';
import type { Length, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides, Slottable } from '../types';
import type { ButtonConfig } from '../button/types';

export type AlertSlot = 'root' | 'icon' | 'content' | 'title' | 'description' | 'actions' | 'dismiss';
export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
export type AlertVariant = 'soft' | 'solid' | 'outline' | 'accent' | 'banner';
export type AlertIconPlacement = 'start' | 'top' | 'end';
export type AlertIconAlign = 'title' | 'center';
export type AlertIconVariant = 'tile' | 'plain' | 'solid';
export type AlertActionsPlacement = 'below' | 'end';
export type AlertDensity = 'comfortable' | 'compact';
export type AlertLive = 'off' | 'polite' | 'assertive';

/** Passed to slot `render` overrides. */
export interface AlertState {
  tone: AlertTone;
  variant: AlertVariant;
  dismissed: boolean;
}

/** Anything renderable, or a function of the live state. */
export type AlertNode = Slottable<AlertState>;

/** Your own icon per tone. */
export type AlertIcons = Partial<Record<AlertTone, React.ReactNode>>;

export interface AlertDimensions {
  padding?: Length;
  gap?: Length;
  iconSize?: Length;
  radius?: Length;
}

/**
 *   const Problem = defineAlert({ tone: 'danger', live: 'assertive' });
 *   <Problem title="Payment failed" actions={[{ label: 'Retry', onClick: retry }]} />
 */
export interface AlertConfig extends SlotOverrides<AlertSlot, AlertState> {
  /** The headline, or a function of the live state. */
  title?: AlertNode;
  /** The detail under the title, or a function of the live state. */
  description?: AlertNode;
  /** Replaces the tone icon (a node or a function of the live state); `false` removes it. */
  icon?: AlertNode;
  /** Your own icon per tone, for presets and `defaults.alert`. `icon` wins. */
  icons?: AlertIcons;
  /** @default 'start' */
  iconPlacement?: AlertIconPlacement;
  /**
   * Level with the title's first line, or centred on the whole message.
   * @default 'title'
   */
  iconAlign?: AlertIconAlign;
  /** @default 'tile' */
  iconVariant?: AlertIconVariant;
  /** @default 'info' */
  tone?: AlertTone;
  /** @default 'soft' */
  variant?: AlertVariant;
  /** @default 'comfortable' */
  density?: AlertDensity;
  /**
   * Announce it when it appears: `polite` = `role="status"`, `assertive` = `role="alert"`.
   * @default 'off'
   */
  live?: AlertLive;
  /** Buttons, each a button config. Small; the first tinted in the alert tone, the rest quiet. */
  actions?: readonly ButtonConfig[];
  /** @default 'below' */
  actionsPlacement?: AlertActionsPlacement;
  /** @default false */
  dismissible?: boolean;
  /** @default 'Dismiss' */
  dismissLabel?: string;
  onDismiss?: () => void;
  dimensions?: AlertDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type AlertRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & { [key: `data-${string}`]: unknown };
export type AlertTagProps = AlertConfig & Omit<AlertRootProps, keyof AlertConfig>;

export interface AlertApi {
  /** True after the dismiss button (or `dismiss()`) hid it. */
  dismissed: boolean;
  dismiss: () => void;
  /** Show it again after a dismiss. */
  show: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: AlertRootProps) => React.ReactElement;
}
export type AlertComponent = PinfoldComponent<AlertApi, AlertRootProps>;
