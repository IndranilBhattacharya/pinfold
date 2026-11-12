import * as React from 'react';
import { cn, dataAttr, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useEvent, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { CursorApi, CursorComponent, CursorConfig, CursorPointerState, CursorRootProps, CursorSlot, CursorState } from './types';

const PRESSABLE = 'a[href], button, summary, label, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [tabindex]:not([tabindex="-1"])';
const TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]), textarea, [contenteditable=""], [contenteditable="true"]';
const HIDE = 'data-pinfold-cursor-hidden';
const ARROW = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M5 3.5 19.5 11l-6.2 1.7L11.2 19z" fill="currentColor" stroke="var(--pinfold-color-surface)" strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
);

/** The system cursor is hidden by an attribute that counts its users: two cursors on one area never fight over it. */
function hideNative(el: Element): () => void {
  el.setAttribute(HIDE, String(Number(el.getAttribute(HIDE) ?? 0) + 1));
  return () => {
    const left = Number(el.getAttribute(HIDE) ?? 1) - 1;
    if (left > 0) el.setAttribute(HIDE, String(left));
    else el.removeAttribute(HIDE);
  };
}
const fine = () => typeof matchMedia !== 'function' || matchMedia('(pointer: fine)').matches;
const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A pointer of your own design for the whole page or one area, as a hook that hands back a component.
 * It follows the real pointer by writing transforms straight to its elements (no re-render per move),
 * changes state over links, text and anything marked `data-cursor`, and is decoration only.
 *
 *   const Pointer = useCursor({ variant: 'blob' });
 *   return <Pointer>{gallery}</Pointer>;
 *
 * Precedence: this config, then `defaults.cursor`, then the provider (size, tone), then the library default.
 */
export function useCursor(input: CursorConfig = {}): CursorComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.cursor ? mergeConfig<CursorConfig>(ctx.defaults.cursor, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ cursorMeta, validateConfig }) => {
      for (const problem of validateConfig(cursorMeta, input)) warnOnce(true, problem.message);
    });
  }

  const variant = config.variant ?? 'dot-ring';
  const trail = Math.max(0, Math.min(12, Math.floor(config.trail ?? 0)));
  const smoothing = Math.max(0, Math.min(0.95, config.smoothing ?? 0.8));
  const hides = config.hideNative ?? variant !== 'spotlight';
  const [visible, setVisible] = React.useState(false);
  const [pointer, setPointer] = React.useState<CursorPointerState>('default');
  const [pressed, setPressed] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);
  const root = React.useRef<HTMLDivElement | null>(null);
  const area = React.useRef<HTMLDivElement | null>(null);
  const position = React.useRef<{ x: number; y: number } | null>(null);
  // The area, once it is in the page (children can arrive on the returned component, after this hook ran).
  const [scopeEl, setScopeEl] = React.useState<HTMLDivElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (area.current !== scopeEl) setScopeEl(area.current);
  });
  const scoped = scopeEl !== null;
  const state: CursorState = { variant, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, visible, state: pointer, pressed };

  const report = useEvent((next: CursorPointerState, element: Element | null) => config.onStateChange?.(next, element));
  const show = useEvent((next: boolean) => config.onVisibleChange?.(next));
  const pressable = config.interactive ?? PRESSABLE;
  const lazy = smoothing;
  const still = !!ctx.disableAnimation;
  const disabled = !!config.disabled;

  React.useEffect(() => {
    const el = root.current;
    // In scope: its wrapper; else the page. Listening on the document keeps one listener for either.
    const scope: Element = scopeEl ?? document.documentElement;
    if (!el || disabled || !fine()) return;
    const target: EventTarget = scoped ? scope : document;
    const dot = el.querySelector<HTMLElement>('[data-part="dot"]');
    const follower = el.querySelector<HTMLElement>('[data-part="follower"]');
    // The label comes and goes with what is pointed at: looked up when needed.
    let label = el.querySelector<HTMLElement>('[data-part="label"]');
    const dots = Array.from(el.querySelectorAll<HTMLElement>('[data-part="trail"]'));
    const k = still || calm() ? 1 : 1 - lazy;
    let x = 0;
    let y = 0;
    let fx = 0;
    let fy = 0;
    const tail = dots.map(() => ({ x: 0, y: 0 }));
    let frame = 0;
    let seen = false;
    let inside = false;
    let restore: (() => void) | null = null;
    let current: CursorPointerState = 'default';
    let currentHint: string | null = null;

    const place = (node: HTMLElement | null, px: number, py: number) => {
      if (node) node.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    };
    const tick = () => {
      frame = 0;
      fx += (x - fx) * k;
      fy += (y - fy) * k;
      place(follower, fx, fy);
      let px = fx;
      let py = fy;
      let moving = Math.abs(x - fx) > 0.1 || Math.abs(y - fy) > 0.1;
      tail.forEach((t, i) => {
        t.x += (px - t.x) * 0.35;
        t.y += (py - t.y) * 0.35;
        place(dots[i], t.x, t.y);
        if (Math.abs(px - t.x) > 0.1 || Math.abs(py - t.y) > 0.1) moving = true;
        px = t.x;
        py = t.y;
      });
      if (moving) frame = requestAnimationFrame(tick);
    };
    const enter = () => {
      if (inside) return;
      inside = true;
      setVisible(true);
      show(true);
      // Only now, with a pointer that really moved, does the system cursor step aside.
      if (hides && !restore) restore = hideNative(scope);
    };
    const leave = () => {
      if (!inside) return;
      inside = false;
      setVisible(false);
      show(false);
      restore?.();
      restore = null;
    };
    const read = (node: Element | null) => {
      let next: CursorPointerState = 'default';
      let text: string | null = null;
      if (node) {
        const marked = node.closest('[data-cursor]');
        text = node.closest('[data-cursor-label]')?.getAttribute('data-cursor-label') ?? null;
        if (marked && scope.contains(marked)) next = marked.getAttribute('data-cursor') || 'default';
        else if (node.closest(TEXT)) next = 'text';
        else if (node.closest(pressable)) next = 'pointer';
      }
      if (next !== current) {
        current = next;
        setPointer(next);
        report(next, node);
      }
      if (text !== currentHint) {
        currentHint = text;
        setHint(text);
      }
    };
    const onMove = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      x = e.clientX;
      y = e.clientY;
      position.current = { x, y };
      if (!seen) {
        // The first move: everything starts where the pointer is, not at the corner.
        seen = true;
        fx = x;
        fy = y;
        tail.forEach((t) => {
          t.x = x;
          t.y = y;
        });
      }
      place(dot, x, y);
      if (!label || !label.isConnected) label = el.querySelector<HTMLElement>('[data-part="label"]');
      place(label, x, y);
      enter();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onOver = (event: Event) => read(event.target as Element | null);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => leave();
    // The page: the pointer left the window. An area: it left the wrapper.
    const out: EventTarget = scoped ? scope : document.documentElement;

    target.addEventListener('pointermove', onMove, { passive: true });
    target.addEventListener('pointerover', onOver, { passive: true });
    target.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    out.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerover', onOver);
      target.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      out.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (frame) cancelAnimationFrame(frame);
      restore?.();
      setVisible(false);
      setPressed(false);
    };
  }, [scopeEl, scoped, disabled, hides, pressable, lazy, still, trail, variant, report, show]);

  // A label that has just appeared starts at the pointer, not at the corner, before the next move.
  useIsomorphicLayoutEffect(() => {
    const el = root.current?.querySelector<HTMLElement>('[data-part="label"]');
    if (el && position.current) el.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
  }, [hint, config.label != null]);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: root,
        'aria-hidden': true,
        'data-variant': variant,
        'data-blend': config.blend ?? 'normal',
        'data-size': state.size,
        'data-tone': state.tone,

        'data-visible': dataAttr(visible && !disabled),
        'data-state': pointer,
        'data-pressed': dataAttr(pressed),
        'data-labelled': dataAttr(hint != null || config.label != null),
        'data-custom': dataAttr(config.shape != null),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: CursorRootProps & { children?: React.ReactNode }): React.ReactElement => {
    const { children, ...rest } = rootProps ?? {};
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: CursorSlot, content: React.ReactNode, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-cursor__${name}`), ...own }), state, content, (p, c) => React.createElement('div', p, c));
    const bag = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-cursor', config.className), style: config.style }, rest as PropsBag)));
    const text = hint ?? config.label;
    const hasFollower = variant !== 'dot' && variant !== 'arrow' && variant !== 'crosshair';
    const parts = (
      <>
        {Array.from({ length: trail }, (_, i) => (
          <React.Fragment key={i}>{slot('trail', null, { 'data-part': 'trail', style: { '--pinfold-cursor-i-n': String(i + 1), '--pinfold-cursor-i-of': String(trail) } })}</React.Fragment>
        ))}
        {hasFollower ? slot('follower', null, { 'data-part': 'follower' }) : null}
        {variant === 'ring' || variant === 'blob' || variant === 'spotlight' ? (config.shape != null ? slot('dot', <span className={cls('pinfold-cursor__shape')}>{config.shape}</span>, { 'data-part': 'dot' }) : null) : slot('dot', config.shape != null ? <span className={cls('pinfold-cursor__shape')}>{config.shape}</span> : variant === 'arrow' ? ARROW : null, { 'data-part': 'dot' })}
        {text != null && text !== '' ? slot('label', <span>{text}</span>, { 'data-part': 'label' }) : null}
      </>
    );
    const overlay = renderSlot(config, 'root', bag, state, parts, (p, c) => <div {...p}>{c}</div>);
    const body = config.content ?? children;
    if (body === undefined) return overlay as React.ReactElement;
    return slot(
      'area',
      <>
        {body}
        {overlay}
      </>,
      { ref: area },
    ) as React.ReactElement;
  };

  const api: CursorApi = { visible, state: pointer, pressed, getPosition: () => position.current, getRootProps, render };
  return usePinfoldComponent<CursorApi, CursorRootProps & { children?: React.ReactNode }>('Cursor', api, (props) => render(props));
}
