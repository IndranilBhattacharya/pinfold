import type * as React from 'react';
import type { Length, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type AlertSlot = 'root' | 'icon' | 'content' | 'title' | 'description' | 'actions' | 'dismiss';
export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
export type AlertVariant = 'soft' | 'outline' | 'accent';
export type AlertLive = 'off' | 'polite' | 'assertive';

/** Passed to slot `render` overrides. */
export interface AlertState {
  tone: AlertTone;
  variant: AlertVariant;
  dismissed: boolean;
}

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
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Replaces the tone icon; `false` removes it. */
  icon?: React.ReactNode;
  /** @default 'info' */
  tone?: AlertTone;
  /** @default 'soft' */
  variant?: AlertVariant;
  /**
   * Announce it when it appears: `polite` = `role="status"`, `assertive` = `role="alert"`.
   * @default 'off'
   */
  live?: AlertLive;
  /** Buttons, each a button config. Small, in the alert tone; the first solid, the rest ghost. */
  actions?: readonly ButtonConfig[];
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
