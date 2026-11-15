import * as React from 'react';
import { cn, dataAttr, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useEvent, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { NoInfer } from '../types';
import type { CursorApi, CursorBuiltInState, CursorComponent, CursorConfig, CursorPointerState, CursorRootProps, CursorSlot, CursorState } from './types';

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
export function useCursor<S extends string = string>(input: CursorConfig<S> = {}): CursorComponent<S> {
  const ctx = usePinfold();
  const config = ctx.defaults.cursor ? mergeConfig<CursorConfig<S>>(ctx.defaults.cursor as CursorConfig<S>, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ cursorMeta, validateConfig }) => {
      for (const problem of validateConfig(cursorMeta, input)) warnOnce(true, problem.message);
    });
  }

  const attribute = config.attribute ?? 'data-cursor';
  const attributeLabel = `${attribute}-label`;
  const variant = config.variant ?? 'dot-ring';
  const trail = Math.max(0, Math.min(12, Math.floor(config.trail ?? 0)));
  const smoothing = Math.max(0, Math.min(0.95, config.smoothing ?? 0.8));
  const hides = config.hideNative ?? variant !== 'spotlight';
  const [visible, setVisible] = React.useState(false);
  const [pointer, setPointer] = React.useState<CursorPointerState>('default');
  const [pressed, setPressed] = React.useState(false);
  const [hint, setHint] = React.useState<React.ReactNode | null>(null);
  const root = React.useRef<HTMLDivElement | null>(null);
  const area = React.useRef<HTMLDivElement | null>(null);
  const position = React.useRef<{ x: number; y: number } | null>(null);
  // The area, once it is in the page (children can arrive on the returned component, after this hook ran).
  const [scopeEl, setScopeEl] = React.useState<HTMLDivElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (area.current !== scopeEl) setScopeEl(area.current);
  });
  const scoped = scopeEl !== null;

  const activeStyle = config.states?.[pointer as keyof typeof config.states];
  const activeVariant = activeStyle?.variant ?? variant;
  const activeTone = activeStyle?.tone ?? config.tone ?? ctx.tone;
  const activeBlend = activeStyle?.blend ?? config.blend ?? 'normal';
  const activeShape = activeStyle?.shape !== undefined ? activeStyle.shape : config.shape;
  const activeScale = activeStyle?.scale;
  const activeClassName = activeStyle?.className;

  const state: CursorState = { variant: activeVariant, size: config.size ?? ctx.size, tone: activeTone, visible, state: pointer, pressed };

  const report = useEvent((next: NoInfer<S> | CursorBuiltInState, element: Element | null) => config.onStateChange?.(next, element));
  const show = useEvent((next: boolean) => config.onVisibleChange?.(next));
  const pressable = config.interactive ?? PRESSABLE;
  const lazy = smoothing;
  const still = !!ctx.disableAnimation;
  const disabled = !!config.disabled;
  const states = React.useRef(config.states);
  states.current = config.states;

  React.useEffect(() => {
    const el = root.current;
    // In scope: its wrapper; else the page. Listening on the document keeps one listener for either.
    const scope: Element = scopeEl ?? document.documentElement;
    if (!el || disabled || !fine()) return;
    const target: EventTarget = scoped ? scope : document;
    // A state's variant or shape can add or drop a part, and the label comes and goes with what is
    // pointed at: each part is looked up again once it is gone.
    const part = (name: string) => el.querySelector<HTMLElement>(`[data-part="${name}"]`);
    let dot = part('dot');
    let follower = part('follower');
    let label = part('label');
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
    let current: string = 'default';
    let currentHint: React.ReactNode | null = null;

    const place = (node: HTMLElement | null, px: number, py: number) => {
      if (node) node.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    };
    const tick = () => {
      frame = 0;
      fx += (x - fx) * k;
      fy += (y - fy) * k;
      if (!follower?.isConnected) follower = part('follower');
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
    // The system cursor steps aside only with a pointer that really moved, per state when one says so.
    const native = (name: string) => {
      const own = states.current?.[name as keyof typeof states.current]?.hideNative;
      if (own ?? hides) {
        if (!restore) restore = hideNative(scope);
      } else if (restore) {
        restore();
        restore = null;
      }
    };
    const enter = () => {
      inside = true;
      setVisible(true);
      show(true);
      native(current);
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
      let next: string = 'default';
      let elementLabel: string | null = null;
      let targetEl: Element | null = null;
      if (node) {
        const marked = node.closest(`[${attribute}]`);
        targetEl = marked ?? node;
        elementLabel = node.closest(`[${attributeLabel}]`)?.getAttribute(attributeLabel) ?? null;
        if (marked && scope.contains(marked)) next = marked.getAttribute(attribute) || 'default';
        else if (node.closest(TEXT)) next = 'text';
        else if (node.closest(pressable)) next = 'pointer';
      }
      if (next !== current) {
        current = next;
        setPointer(next as CursorPointerState);
        report(next as NoInfer<S> | CursorBuiltInState, node);
      }
      // The element's own label, then the state's (text, or worked out from the element).
      const own = states.current?.[next as keyof typeof states.current]?.label;
      const hintVal: React.ReactNode | null = elementLabel ?? (typeof own === 'function' ? (targetEl ? own({ element: targetEl }) : null) : own ?? null);
      if (hintVal !== currentHint) {
        currentHint = hintVal;
        setHint(hintVal);
      }
      if (inside) native(next);
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
      if (!dot?.isConnected) dot = part('dot');
      place(dot, x, y);
      if (!label?.isConnected) label = part('label');
      place(label, x, y);
      if (!inside) enter();
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
  }, [scopeEl, scoped, disabled, hides, pressable, lazy, still, trail, variant, attribute, attributeLabel, report, show]);

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
        'data-variant': activeVariant,
        'data-blend': activeBlend,
        'data-size': state.size,
        'data-tone': activeTone,

        'data-visible': dataAttr(visible && !disabled),
        'data-state': pointer,
        'data-pressed': dataAttr(pressed),
        'data-labelled': dataAttr(hint != null || config.label != null),
        'data-custom': dataAttr(activeShape != null),
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
    const bagStyle = activeScale !== undefined ? { '--pinfold-cursor-i-scale': String(activeScale), ...config.style } : config.style;
    const bag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? cn(activeClassName, config.className) : cn('pinfold pinfold-cursor', activeClassName, config.className), style: bagStyle }, rest as PropsBag)),
    );
    const text = hint ?? config.label;
    const hasFollower = activeVariant !== 'dot' && activeVariant !== 'arrow' && activeVariant !== 'crosshair';
    const parts = (
      <>
        {Array.from({ length: trail }, (_, i) => (
          <React.Fragment key={i}>{slot('trail', null, { 'data-part': 'trail', style: { '--pinfold-cursor-i-n': String(i + 1), '--pinfold-cursor-i-of': String(trail) } })}</React.Fragment>
        ))}
        {hasFollower ? slot('follower', null, { 'data-part': 'follower' }) : null}
        {activeVariant === 'ring' || activeVariant === 'blob' || activeVariant === 'spotlight' ? (
          activeShape != null ? slot('dot', <span className={cls('pinfold-cursor__shape')}>{activeShape}</span>, { 'data-part': 'dot' }) : null
        ) : (
          slot('dot', activeShape != null ? <span className={cls('pinfold-cursor__shape')}>{activeShape}</span> : activeVariant === 'arrow' ? ARROW : null, { 'data-part': 'dot' })
        )}
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

  const api: CursorApi<S> = { visible, state: pointer as S | CursorBuiltInState, pressed, getPosition: () => position.current, getRootProps, render };
  return usePinfoldComponent<CursorApi<S>, CursorRootProps & { children?: React.ReactNode }>('Cursor', api, (props) => render(props));
}
