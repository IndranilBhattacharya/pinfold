import type * as React from 'react';
import type { Length, PinfoldTone, PropsBag, ToastStore } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type ToastSlot = 'root' | 'item' | 'icon' | 'content' | 'title' | 'description' | 'action' | 'dismiss';
export type ToastPlacement = 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';

/** One message: what `show()` takes. */
export interface ToastMessage {
  /** Showing an id again updates that toast in place and restarts its timer. */
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  tone?: PinfoldTone;
  /** Replaces the tone icon; `false` removes it. */
  icon?: React.ReactNode;
  /** Milliseconds; 0 stays. Unset: the region's `duration`, or stays for an error or a toast with an action. */
  duration?: number;
  /** A button. Closes the toast unless its `onClick` returns `false`. */
  action?: ButtonConfig;
  /** @default true */
  dismissible?: boolean;
  onDismiss?: () => void;
}

/** Passed to slot `render` overrides. */
export interface ToastState {
  placement: ToastPlacement;
  count: number;
}

export interface ToastDimensions {
  width?: Length;
  gap?: Length;
  inset?: Length;
}

/**
 *   export const Toasts = defineToast({ placement: 'bottom-end' });
 *   <Toasts />                                // once, near the root
 *   Toasts.show({ title: 'Saved', tone: 'success' });
 */
export interface ToastConfig extends SlotOverrides<ToastSlot, ToastState> {
  /** @default 'bottom-end' */
  placement?: ToastPlacement;
  /** @default 5000 */
  duration?: number;
  /** @default 5 */
  max?: number;
  /** @default 'Notifications' */
  label?: string;
  /** @default 'Dismiss' */
  dismissLabel?: string;
  /** A store from `createToastStore()`, to show toasts from outside React. */
  store?: ToastStore<ToastMessage>;
  dimensions?: ToastDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ToastRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type ToastTagProps = ToastConfig & Omit<ToastRootProps, keyof ToastConfig>;

export interface ToastApi {
  /** Returns the toast's id. */
  show: (toast: ToastMessage) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ToastRootProps) => React.ReactElement;
}
export type ToastComponent = PinfoldComponent<ToastApi, ToastRootProps>;
