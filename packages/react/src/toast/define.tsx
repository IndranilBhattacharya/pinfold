import * as React from 'react';
import { createToastStore, type ToastStore } from '@pinfold/core';
import { mergeConfig } from '../preset';
import { Toast } from './client';
import type { ToastConfig, ToastMessage, ToastTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type ToastPresetProps = ToastTagProps;

/** What `defineToast` returns: the region, and the controller to show toasts from anywhere. */
export type DefinedToast<P extends Partial<ToastConfig> = Partial<ToastConfig>> = ((props: ToastPresetProps) => React.ReactElement) & {
  config: P;
  displayName?: string;
  store: ToastStore<ToastMessage>;
  show: (toast: ToastMessage) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

/**
 * A toast region with its own store, defined once at module scope (in a `'use client'` module):
 *
 *   export const Toasts = defineToast({ placement: 'bottom-end' });
 *   <Toasts />                                         // once, near the root
 *   Toasts.show({ title: 'Saved', tone: 'success' });  // anywhere, also outside React
 *
 * Props win over the preset, then `defaults.toast` and the library defaults.
 */
export function defineToast<P extends Partial<ToastConfig>>(preset: P = {} as P): DefinedToast<P> {
  const store = preset.store ?? createToastStore<ToastMessage>();
  const Defined = ((props: ToastPresetProps) =>
    React.createElement(Toast, mergeConfig<ToastTagProps>({ store, ...preset } as unknown as Partial<ToastTagProps>, props as unknown as Partial<ToastTagProps>))) as DefinedToast<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedToast';
  Defined.store = store;
  Defined.show = store.show;
  Defined.dismiss = store.dismiss;
  Defined.clear = store.clear;
  return Defined;
}
