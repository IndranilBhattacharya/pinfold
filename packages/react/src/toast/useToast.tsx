import * as React from 'react';
import { cn, createToastStore, dimensionVars, mergeProps, warnOnce, type PropsBag, type ToastStore, radiusProps } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import { CLOSE_ICON, ToneIcon } from '../icons';
import { closingAction, raiseToTopLayer } from '../overlay';
import type { ToastApi, ToastComponent, ToastConfig, ToastMessage, ToastRootProps, ToastSlot, ToastState } from './types';

type Shown = ToastMessage & { id: string };
const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const NONE: ReadonlyArray<Shown> = [];
const server = () => NONE;
/** How long a leaving toast takes; the same as its CSS transition. */
const LEAVE_MS = 240;
/** Cards that peek out behind the newest one; the rest hide behind it. */
const PEEK = 3;

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
  const list = React.useRef<HTMLDivElement | null>(null);
  const hovering = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const leaving = React.useRef(new Map<string, { toast: Shown; done: boolean }>());
  const last = React.useRef<Shown[]>([]);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ toastMeta, validateConfig }) => {
      for (const problem of validateConfig(toastMeta, input)) warnOnce(true, problem.message);
    });
  }

  store.configure({ duration: config.duration, max: config.max });
  const toasts = React.useSyncExternalStore(store.subscribe, store.getVisible, server);
  const stacked = config.stack !== false;
  const visible = Math.max(1, config.visible ?? 3);
  const state: ToastState = { placement: config.placement ?? 'bottom-end', count: toasts.length, expanded: !stacked || open };
  const animate = !ctx.disableAnimation;

  // Newest first. A toast that just left stays where it was for its exit transition.
  const current = [...toasts].reverse();
  const shown: Array<Shown & { leaving?: boolean }> = [...current];
  if (animate) {
    last.current.forEach((toast, i) => {
      if (current.some((t) => t.id === toast.id)) return;
      let entry = leaving.current.get(toast.id);
      if (!entry) {
        entry = { toast, done: false };
        leaving.current.set(toast.id, entry);
        const mark = entry;
        setTimeout(() => {
          mark.done = true;
          bump();
        }, LEAVE_MS);
      }
      if (!entry.done) shown.splice(Math.min(i, shown.length), 0, { ...toast, leaving: true });
    });
    leaving.current.forEach((entry, id) => {
      if (entry.done) leaving.current.delete(id);
    });
  }
  last.current = shown;

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

  // The pile is drawn from measured heights: each card behind the newest moves onto it, a little
  // smaller and peeking out at the far edge, squeezed to the newest card's height (its content
  // fades, as in a deck). Fanned out they sit in the list's own flow, so it can scroll.
  useIsomorphicLayoutEffect(() => {
    const box = list.current;
    if (!box) return;
    const items = Array.from(box.children) as HTMLElement[];
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    const staying = items.filter((el) => !el.hasAttribute('data-leaving'));
    const front = staying[0]?.offsetHeight ?? 0;
    const towardEdge = state.placement.startsWith('top') ? -1 : 1;
    let offset = 0;
    let room = 0;
    let index = 0;
    for (const el of items) {
      const height = el.offsetHeight;
      // The newest paints on top: it comes first in the DOM, so the order is set here.
      el.style.zIndex = String(items.length - index);
      if (el.hasAttribute('data-leaving')) {
        if (!el.hasAttribute('data-closing')) {
          el.style.blockSize = `${height}px`;
          void el.offsetHeight;
          // From its height to none: the transition needs both as lengths.
          el.style.blockSize = '0px';
          el.setAttribute('data-closing', '');
        }
        continue;
      }
      const scale = 1 - 0.05 * Math.min(index, PEEK);
      const squeeze = height ? (scale * front) / height : 1;
      const shift = offset - front * (1 - scale) - Math.min(index, PEEK - 1) * 10;
      el.style.setProperty('--pinfold-tst-pile', index ? `translateY(${towardEdge * shift}px) scale(${scale}, ${squeeze})` : 'none');
      if (index < visible) room += height + (index ? gap : 0);
      offset += height + gap;
      index++;
    }
    box.style.setProperty('--pinfold-tst-room', `${room}px`);
  });

  // Folding the pile up again starts from the newest.
  React.useEffect(() => {
    if (!state.expanded && list.current) list.current.scrollTop = 0;
  }, [state.expanded]);

  const hold = () => {
    hovering.current = true;
    store.pause();
    setOpen(true);
  };
  const release = () => {
    hovering.current = false;
    if (!document.hidden) store.resume();
    setOpen(false);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: region,
        role: 'region',
        'aria-label': config.label ?? 'Notifications',
        'aria-live': 'polite',
        'aria-relevant': 'additions',
        'data-placement': state.placement,
        'data-swipe': config.swipe !== false ? '' : undefined,
        'data-stack': stacked ? '' : undefined,
        'data-expanded': state.expanded ? '' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
        'data-animate': animate ? '' : undefined,
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
    // Drag toward the placement's edge (either way when centred); far or fast enough dismisses.
    const swipe = (event: React.PointerEvent<HTMLElement>, close: () => void) => {
      if (event.button !== 0 || (event.target as Element).closest('button, a, input, select, textarea')) return;
      const el = event.currentTarget;
      const rtl = getComputedStyle(el).direction === 'rtl';
      const edge = state.placement.endsWith('end') ? 1 : state.placement.endsWith('start') ? -1 : 0;
      const toward = edge * (rtl ? -1 : 1);
      const x0 = event.clientX;
      const t0 = performance.now();
      const motion = !ctx.disableAnimation && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      let dx = 0;
      el.setPointerCapture?.(event.pointerId);
      const move = (e: PointerEvent) => {
        const d = e.clientX - x0;
        // Against the edge it resists.
        dx = toward && d * toward < 0 ? d / 4 : d;
        if (Math.abs(dx) < 4) return;
        el.setAttribute('data-swiping', '');
        el.style.transition = 'none';
        el.style.translate = `${dx}px 0`;
        el.style.opacity = String(1 - Math.min(Math.abs(dx) / el.offsetWidth, 1) * 0.7);
      };
      const done = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', done);
        el.removeEventListener('pointercancel', cancel);
        el.removeAttribute('data-swiping');
        const fast = Math.abs(dx) > 24 && Math.abs(dx) / (performance.now() - t0) > 0.6;
        const out = (Math.abs(dx) > el.offsetWidth / 3 || fast) && (!toward || dx * toward > 0);
        el.style.transition = motion ? 'translate 200ms ease-out, opacity 200ms ease-out' : 'none';
        if (out) {
          el.style.translate = `${Math.sign(dx) * 110}%` + ' 0';
          el.style.opacity = '0';
          close();
        } else {
          el.style.translate = '';
          el.style.opacity = '';
          setTimeout(() => (el.style.transition = ''), 220);
        }
      };
      const cancel = () => {
        dx = 0;
        done();
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', done);
      el.addEventListener('pointercancel', cancel);
    };
    let index = 0;
    const items = shown.map((toast) => {
      const tone = toast.tone ?? 'neutral';
      const at = toast.leaving ? -1 : index++;
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
          role: tone === 'danger' && !toast.leaving ? 'alert' : undefined,
          'data-tone': tone,
          'data-index': at < 0 ? undefined : at,
          'data-behind': at > 0 ? '' : undefined,
          // Deeper in the pile than the peeking cards: hidden until the pile fans out.
          'data-buried': at >= PEEK ? '' : undefined,
          'data-leaving': toast.leaving ? '' : undefined,
          'aria-hidden': toast.leaving ? true : undefined,
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') close();
          },
          onPointerDown: config.swipe !== false && toast.dismissible !== false && !toast.leaving ? (event: React.PointerEvent<HTMLElement>) => swipe(event, close) : undefined,
        },
      );
    });
    const content = slot('list', items, 'div', { ref: list });
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ToastApi = { show: store.show, dismiss: store.dismiss, clear: store.clear, getRootProps, render };
  return usePinfoldComponent<ToastApi, ToastRootProps>('Toast', api, (props) => render(props));
}
