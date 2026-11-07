import * as React from 'react';
import { computePosition, mergeProps, pushOverlayLayer, type OverlayPlacement, type OverlayRect, type PropsBag } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from './hooks';
import { Button } from './button/Button';
import type { ButtonConfig } from './button/types';

/**
 * Shared overlay plumbing. A floating element stays where it is in the DOM, so it inherits the
 * theme and direction and keeps its place in the tab order (no portal, no react-dom). It is
 * `position: fixed`, and joins the top layer through the Popover API where the browser has it,
 * which also frees it from any clipping or transformed ancestor.
 */

export type OverlayTrigger = ButtonConfig | React.ReactElement;

const subscribe = () => () => {};
/** False on the server and during hydration: a floating element must not be in the server HTML. */
export const useMounted = () => React.useSyncExternalStore(subscribe, () => true, () => false);

const supportsPopover = () => typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

/** Put an element in the top layer (or lift it back to the top). A no-op on older browsers. */
export function raiseToTopLayer(el: HTMLElement): void {
  if (!supportsPopover()) return;
  if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual');
  try {
    if (el.matches(':popover-open')) el.hidePopover();
    el.showPopover();
  } catch {
    // Disconnected, or a browser quirk: it still works as a plain fixed element.
  }
}

interface FloatingOptions {
  open: boolean;
  /** The trigger element, or a point (a context menu). */
  anchor: () => Element | OverlayRect | null;
  floating: React.RefObject<HTMLElement | null>;
  placement?: OverlayPlacement;
  offset?: number;
  /** Changes when the anchor moves to a new place without closing (a second right-click). */
  key?: unknown;
}

/** While open: top layer, then keep the element next to its anchor through scrolling and resizing. */
export function useFloating({ open, anchor, floating, placement, offset, key }: FloatingOptions): void {
  useIsomorphicLayoutEffect(() => {
    const el = floating.current;
    if (!open || !el) return;
    el.style.position = 'fixed';
    el.style.inset = 'auto';
    el.style.margin = '0';
    raiseToTopLayer(el);

    const update = () => {
      const target = anchor();
      if (!target) return;
      const rect = target instanceof Element ? target.getBoundingClientRect() : target;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      // Its anchor scrolled out of view: hide rather than pin it to the edge, detached from its source.
      const out = vw > 0 && vh > 0 && (rect.y + rect.height < 0 || rect.y > vh || rect.x + rect.width < 0 || rect.x > vw);
      el.style.visibility = out ? 'hidden' : '';
      const box = el.getBoundingClientRect();
      const position = computePosition({
        anchor: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        floating: { width: box.width, height: box.height },
        viewport: { width: vw, height: vh },
        placement,
        offset,
        rtl: getComputedStyle(el).direction === 'rtl',
      });
      el.style.left = `${position.x}px`;
      el.style.top = `${position.y}px`;
      el.setAttribute('data-side', position.side);
      el.style.setProperty('--pinfold-overlay-arrow', `${position.arrow}px`);
    };
    update();

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(el);
    // The anchor resizing (text reflow, a panel opening) moves the floating element too.
    const target = anchor();
    if (target instanceof Element) observer?.observe(target);
    return () => {
      el.style.visibility = '';
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [open, placement, offset, key]);
}

/** While active: on the dismiss stack, so Escape and outside presses reach the topmost overlay first. */
export function useOverlayLayer(active: boolean, contains: (node: Node) => boolean, onEscape: (() => void) | undefined, onOutside: (() => void) | undefined): void {
  const latest = React.useRef({ contains, onEscape, onOutside });
  latest.current = { contains, onEscape, onOutside };
  React.useEffect(() => {
    if (!active) return;
    return pushOverlayLayer({
      contains: (node) => latest.current.contains(node),
      onEscape: () => latest.current.onEscape?.(),
      onOutside: () => latest.current.onOutside?.(),
    });
  }, [active]);
}

/** Hover with a delay, and a grace period so the pointer can cross to the floating element (WCAG 1.4.13). */
export function useHoverIntent(setOpen: (open: boolean) => void, delay: number, closeDelay: number) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clear = () => clearTimeout(timer.current);
  React.useEffect(() => clear, []);
  const later = (open: boolean, ms: number) => {
    clear();
    if (ms <= 0) setOpen(open);
    else timer.current = setTimeout(() => setOpen(open), ms);
  };
  return {
    show: (ms = delay) => later(true, ms),
    hide: (ms = closeDelay) => later(false, ms),
    clear,
    // A finger has no hover: touch opens through focus or a tap, never a stray pointerenter.
    triggerProps: {
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType !== 'touch') later(true, delay);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType !== 'touch') later(false, closeDelay);
      },
    },
    floatingProps: {
      onPointerEnter: clear,
      onPointerLeave: () => later(false, closeDelay),
    },
  };
}

/** Focus from the keyboard, not a mouse press. jsdom and old engines treat any focus as visible. */
export function isKeyboardFocus(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * Hand focus back to the trigger, unless the user already moved it elsewhere on purpose (an
 * outside press on another control).
 */
export function restoreFocus(trigger: Element | null, floating: HTMLElement | null): void {
  const active = document.activeElement;
  if (trigger instanceof HTMLElement && (!active || active === document.body || (floating && floating.contains(active)))) trigger.focus();
}

/**
 * The trigger: a button config, or any element that passes props to its root. `display: contents`
 * on the wrapper keeps it out of layout while giving us the rendered element without touching refs.
 */
export function renderTrigger(trigger: OverlayTrigger | undefined, props: PropsBag, anchor: ((el: HTMLSpanElement | null) => void) | null): React.ReactNode {
  if (trigger == null) return null;
  let node: React.ReactNode;
  if (React.isValidElement(trigger)) {
    const own = trigger.props as PropsBag;
    node = React.cloneElement(trigger, mergeProps(props, own));
  } else {
    const config = trigger as ButtonConfig;
    node = <Button {...config} slotProps={{ ...config.slotProps, root: mergeProps(props, config.slotProps?.root) }} />;
  }
  return (
    <span ref={anchor} style={{ display: 'contents' }}>
      {node}
    </span>
  );
}

/**
 * An action inside an overlay: runs, then closes it. Returning `false` keeps it open; a promise
 * closes when it resolves and stays open if it rejects (the button shows its loading state).
 */
export function closingAction(action: ButtonConfig, close: () => void): ButtonConfig {
  return {
    ...action,
    onClick: (event) => {
      const result = action.onClick?.(event);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') return (result as Promise<unknown>).then((value) => {
        if (value !== false) close();
      });
      if (result !== false) close();
      return undefined;
    },
  };
}

/** Reports the element a trigger wrapper rendered. */
export const triggerElement = (wrapper: HTMLElement | null): Element | null => wrapper?.firstElementChild ?? wrapper;
