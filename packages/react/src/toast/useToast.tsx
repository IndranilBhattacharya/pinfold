import * as React from 'react';
import { cn, createToastStore, dimensionVars, mergeProps, warnOnce, type PropsBag, type ToastStore } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import { CLOSE_ICON, ToneIcon } from '../icons';
import { closingAction, raiseToTopLayer } from '../overlay';
import type { ToastApi, ToastComponent, ToastConfig, ToastMessage, ToastRootProps, ToastSlot, ToastState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const NONE: ReadonlyArray<ToastMessage & { id: string }> = [];
const server = () => NONE;

/**
 * A toast region, as a hook that hands back a component and its controller.
 *
 *   const Toasts = useToast();
 *   Toasts.show({ title: 'Saved', tone: 'success' });
 *   return <Toasts />;
 *
 * To show toasts from anywhere, also outside React, use `defineToast` at module scope.
 * Precedence: this config, then `defaults.toast`, then the library default.
 */
export function useToast(input: ToastConfig = {}): ToastComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.toast ? mergeConfig<ToastConfig>(ctx.defaults.toast, input) : input;
  const own = React.useRef<ToastStore<ToastMessage> | null>(null);
  if (!config.store && !own.current) own.current = createToastStore<ToastMessage>();
  const store = (config.store ?? own.current) as ToastStore<ToastMessage>;
  const region = React.useRef<HTMLDivElement | null>(null);
  const hovering = React.useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ toastMeta, validateConfig }) => {
      for (const problem of validateConfig(toastMeta, input)) warnOnce(true, problem.message);
    });
  }

  store.configure({ duration: config.duration, max: config.max });
  const toasts = React.useSyncExternalStore(store.subscribe, store.getVisible, server);
  const state: ToastState = { placement: config.placement ?? 'bottom-end', count: toasts.length };

  // A hidden tab reads nothing: its timers wait.
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) store.pause();
      else if (!hovering.current) store.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [store]);

  // A new toast goes above anything already in the top layer.
  const previous = React.useRef(0);
  useIsomorphicLayoutEffect(() => {
    if (toasts.length > previous.current && region.current) raiseToTopLayer(region.current);
    previous.current = toasts.length;
  }, [toasts.length]);

  const hold = () => {
    hovering.current = true;
    store.pause();
  };
  const release = () => {
    hovering.current = false;
    if (!document.hidden) store.resume();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: region,
        role: 'region',
        'aria-label': config.label ?? 'Notifications',
        'aria-live': 'polite',
        'aria-relevant': 'additions',
        'data-placement': state.placement,
        'data-unstyled': config.unstyled ? '' : undefined,
        'data-animate': ctx.disableAnimation ? undefined : '',
        onPointerEnter: hold,
        onPointerLeave: release,
        onFocus: hold,
        onBlur: (event: React.FocusEvent<HTMLElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) release();
        },
      },
      props,
    );

  const render = (rootProps?: ToastRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ToastSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-toast__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('toast', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-toast', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const content = toasts.map((toast) => {
      const tone = toast.tone ?? 'neutral';
      const close = () => {
        store.dismiss(toast.id);
        // The focused button is gone with its toast, and no blur event says so.
        if (!region.current?.matches(':hover') && !document.hidden) store.resume();
      };
      const icon = toast.icon === undefined ? <ToneIcon tone={tone} /> : toast.icon;
      return slot(
        'item',
        <>
          {filled(icon) ? slot('icon', icon, 'span', { 'aria-hidden': true }) : null}
          {slot(
            'content',
            <>
              {filled(toast.title) ? slot('title', toast.title, 'div') : null}
              {filled(toast.description) ? slot('description', toast.description, 'div') : null}
            </>,
            'div',
          )}
          {toast.action ? slot('action', <Button size="sm" variant="soft" tone={tone} {...closingAction(toast.action, close)} />, 'span') : null}
          {toast.dismissible !== false ? slot('dismiss', <Button label={config.dismissLabel ?? 'Dismiss'} icon={CLOSE_ICON} iconOnly variant="ghost" tone="neutral" size="sm" onClick={close} />, 'span') : null}
        </>,
        'div',
        {
          key: toast.id,
          // An error interrupts; everything else waits its turn in the polite region.
          role: tone === 'danger' ? 'alert' : undefined,
          'data-tone': tone,
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') close();
          },
        },
      );
    });
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ToastApi = { show: store.show, dismiss: store.dismiss, clear: store.clear, getRootProps, render };
  return usePinfoldComponent<ToastApi, ToastRootProps>('Toast', api, (props) => render(props));
}
