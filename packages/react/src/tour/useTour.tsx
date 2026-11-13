import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveTourOptions, mergeProps, radiusProps, spotlightPath, spotlightRect, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useControllableState, useEvent, useId, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { raiseToTopLayer, useFloating, useMounted, useOverlayLayer } from '../overlay';
import { Button } from '../button/Button';
import type { TourApi, TourComponent, TourConfig, TourDotContext, TourRootProps, TourSlot, TourState, TourStep, TourTarget } from './types';

function find(target: TourTarget | undefined): Element | null {
  if (target == null || typeof document === 'undefined') return null;
  try {
    if (typeof target === 'string') return document.querySelector(target);
    if (typeof target === 'function') return target() ?? null;
    return target.current ?? null;
  } catch {
    return null;
  }
}
const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A guided tour over the real interface, as a hook that hands back a component (and its controller). A
 * spotlight cuts a rounded hole around each step's target in a dimmed or blurred cover and glides to the
 * next; a card beside the target explains the step. Nothing is portalled: the cover and the card join the
 * top layer where the browser has it, and are `position: fixed` otherwise.
 *
 *   const Onboarding = useTour({ steps });
 *   return <><button onClick={() => Onboarding.start()}>Tour</button><Onboarding /></>;
 *
 * Precedence: this config, then `defaults.tour`, then the provider (size, tone), then the library default.
 */
export function useTour(input: TourConfig = {}): TourComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.tour ? mergeConfig<TourConfig>(ctx.defaults.tour, input) : input;
  const base = useId();
  const mounted = useMounted();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tourMeta, validateConfig }) => {
      for (const problem of validateConfig(tourMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTourOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Tour: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const steps = config.steps ?? [];
  const total = steps.length;
  const labels = config.labels ?? {};
  const mask = config.mask ?? 'dim';
  const [open, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const [rawIndex, setIndexState] = useControllableState<number>({ value: config.step, defaultValue: config.defaultStep ?? 0 });
  const index = Math.max(0, Math.min(total - 1, rawIndex));
  const current: TourStep | undefined = steps[index];
  const [pending, setPending] = React.useState(false);
  const [target, setTarget] = React.useState<Element | null>(null);
  const [moving, setMoving] = React.useState(false);
  const showing = open && mounted && total > 0;

  const card = React.useRef<HTMLDivElement | null>(null);
  const overlay = React.useRef<HTMLDivElement | null>(null);
  const spotlight = React.useRef<HTMLDivElement | null>(null);
  const returnTo = React.useRef<Element | null>(null);
  const alive = React.useRef(true);
  const ticket = React.useRef(0);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const padding = current?.spotlightPadding ?? config.spotlightPadding ?? 8;
  const radius = current?.spotlightRadius ?? config.spotlightRadius ?? 12;
  const interactive = current?.interactive ?? config.interactive ?? false;
  const centered = !target;

  const setOpen = useEvent((next: boolean) => {
    if (next === open) return;
    setOpenState(next);
    config.onOpenChange?.(next);
  });
  /** The step to land on going from `from` towards `to`: with `missingTarget: 'skip'`, past steps whose target is missing. */
  const landing = (from: number, to: number): number => {
    if (config.missingTarget !== 'skip') return to;
    const dir = to >= from ? 1 : -1;
    for (let i = to; i >= 0 && i < total; i += dir) {
      if (steps[i].target == null || find(steps[i].target)) return i;
      if (process.env.NODE_ENV !== 'production') warnOnce(true, `Tour: the target of step ${i + 1} is not on the page; the step is skipped.`);
    }
    return dir > 0 ? total : -1;
  };
  const complete = useEvent(() => {
    setOpen(false);
    config.onComplete?.();
  });
  const go = useEvent(async (to: number) => {
    if (pending || !total) return;
    const from = index;
    const land = landing(from, to);
    if (land >= total) return complete();
    if (land < 0 || land === from) return;
    const ticketNo = ++ticket.current;
    const guard = config.beforeStep?.(from, land);
    if (guard && typeof (guard as Promise<unknown>).then === 'function') {
      setPending(true);
      let ok: unknown = true;
      try {
        ok = await guard;
      } catch {
        ok = false;
      }
      if (!alive.current || ticketNo !== ticket.current) return;
      setPending(false);
      if (ok === false) return;
    } else if (guard === false) return;
    setIndexState(land);
    config.onStepChange?.(land, steps[land]);
  });
  const skip = useEvent(() => {
    if (!open) return;
    ticket.current++;
    setPending(false);
    setOpen(false);
    if (current) config.onSkip?.(index, current);
  });
  const start = useEvent((at = 0) => {
    const land = landing(-1, Math.max(0, at));
    if (land < 0 || land >= total) return;
    if (land !== index) {
      setIndexState(land);
      config.onStepChange?.(land, steps[land]);
    }
    setOpen(true);
  });

  // Where focus was, to give it back on close.
  useIsomorphicLayoutEffect(() => {
    if (!showing) return;
    const active = document.activeElement;
    if (active && !card.current?.contains(active)) returnTo.current = active;
    return () => {
      const back = returnTo.current as HTMLElement | null;
      returnTo.current = null;
      if (back && back.isConnected && typeof back.focus === 'function') back.focus({ preventScroll: true });
    };
  }, [showing]);

  // Each step: find the target, bring it into view, then keep the hole and the card on it.
  useIsomorphicLayoutEffect(() => {
    if (!showing || !current) return;
    const el = find(current.target);
    if (!el && current.target != null && process.env.NODE_ENV !== 'production') warnOnce(true, `Tour: the target of step ${index + 1} is not on the page; the card is shown in the middle.`);
    setTarget(el);
    if (el && config.scroll !== false && typeof el.scrollIntoView === 'function') {
      const box = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      const vw = document.documentElement.clientWidth;
      if (box.top < 0 || box.bottom > vh || box.left < 0 || box.right > vw) el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: calm() || ctx.disableAnimation ? 'auto' : 'smooth' });
    }
    setMoving(true);
    const timer = setTimeout(() => setMoving(false), 450);
    return () => clearTimeout(timer);
  }, [showing, index, current?.target]);

  useIsomorphicLayoutEffect(() => {
    if (!showing) return;
    const cover = overlay.current;
    const ring = spotlight.current;
    if (cover) raiseToTopLayer(cover);
    const measure = () => {
      const viewport = { width: document.documentElement.clientWidth || window.innerWidth, height: document.documentElement.clientHeight || window.innerHeight };
      const hole = target && target.isConnected ? spotlightRect(target.getBoundingClientRect(), padding, viewport) : null;
      if (cover) cover.style.clipPath = hole ? spotlightPath(viewport, hole, radius) : '';
      if (ring && hole) {
        ring.style.left = `${hole.x}px`;
        ring.style.top = `${hole.y}px`;
        ring.style.width = `${hole.width}px`;
        ring.style.height = `${hole.height}px`;
        ring.style.borderRadius = `${radius}px`;
      }
    };
    measure();
    const el = card.current;
    if (el && !target) {
      // In the middle: no anchor to follow.
      el.style.position = 'fixed';
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.margin = '0';
      el.removeAttribute('data-side');
      raiseToTopLayer(el);
    }
    let frame = 0;
    let refocus = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        measure();
        // The card is hidden while its target is out of view (it loses the focus); once it shows again, the focus comes back.
        cancelAnimationFrame(refocus);
        refocus = requestAnimationFrame(() => {
          const el = card.current;
          const active = document.activeElement;
          if (el && el.style.visibility !== 'hidden' && (!active || active === document.body)) el.focus({ preventScroll: true });
        });
      });
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const observer = target && typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    if (target) observer?.observe(target);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refocus);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [showing, target, padding, radius, mask]);

  useFloating({
    open: showing && !!target,
    anchor: () => {
      if (!target) return null;
      const r = target.getBoundingClientRect();
      return { x: r.x - padding, y: r.y - padding, width: r.width + padding * 2, height: r.height + padding * 2 };
    },
    floating: card,
    placement: current?.placement ?? config.placement ?? 'bottom',
    offset: 12,
    key: `${index}:${!!target}`,
  });

  // The focus moves into the card on every step.
  useIsomorphicLayoutEffect(() => {
    if (showing) card.current?.focus({ preventScroll: true });
  }, [showing, index, target]);

  useOverlayLayer(showing, (node) => !!card.current?.contains(node), config.closeOnEscape === false ? undefined : skip, undefined);

  const last = index === total - 1;
  const modal = mask !== 'none';
  const state: TourState = { open: showing, step: index, total, centered, pending, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone };

  const onCardKeyDown = (event: React.KeyboardEvent) => {
    const el = event.target as HTMLElement;
    const typing = el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
    const rtl = ctx.dir === 'rtl';
    if (!typing && !event.altKey && !event.ctrlKey && !event.metaKey) {
      if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || (event.key === 'Enter' && el === card.current)) {
        event.preventDefault();
        if (last) complete();
        else void go(index + 1);
        return;
      }
      if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
        event.preventDefault();
        void go(index - 1);
        return;
      }
    }
    // While the page is covered, Tab stays in the card.
    if (event.key === 'Tab' && modal && card.current) {
      const items = Array.from(card.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const end = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === card.current)) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && active === end) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-state': showing ? 'open' : 'closed',
        'data-mask': mask,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-centered': dataAttr(showing && centered),
        'data-pending': dataAttr(pending),
        'data-moving': dataAttr(moving),
        'data-interactive': dataAttr(interactive),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        ...radiusProps(config.radius),
      },
      props,
    );
  const titleId = `${base}-title`;
  const contentId = `${base}-content`;
  const getCardProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: card,
        role: 'dialog',
        'aria-modal': modal || undefined,
        'aria-labelledby': current?.title != null ? titleId : undefined,
        'aria-label': current?.title == null ? labels.tour ?? 'Tour' : undefined,
        'aria-describedby': current?.content != null ? contentId : undefined,
        tabIndex: -1,
        'data-centered': dataAttr(centered),
        onKeyDown: onCardKeyDown,
      },
      props,
    );

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const render = (rootProps?: TourRootProps): React.ReactElement => {
    const slot = (name: TourSlot, content: React.ReactNode, tag: string, own: PropsBag = {}, item?: TourDotContext) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-tour__${name}`), ...own, ...(item ? { [ITEM]: item } : null) }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('tour', config.dimensions);
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-tour', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps as PropsBag)),
    );
    const progress = config.progress ?? 'both';
    const counter = labels.counter ? labels.counter(index + 1, total) : `${index + 1} of ${total}`;
    const buttonSize = state.size === 'lg' ? 'md' : 'sm';
    const body =
      showing && current ? (
        <>
          {mask !== 'none' ? slot('overlay', null, 'div', { ref: overlay, 'aria-hidden': true, 'data-mask': mask }) : null}
          {target ? slot('spotlight', null, 'div', { ref: spotlight, 'aria-hidden': true }) : null}
          {slot(
            'card',
            <>
              {config.arrow !== false && target ? slot('arrow', null, 'span', { 'aria-hidden': true }) : null}
              {current.title != null || progress === 'both' || progress === 'counter' ? (
                slot(
                  'header',
                  <>
                    {(progress === 'both' || progress === 'counter') && total > 1 ? slot('counter', counter, 'span') : null}
                    {current.title != null ? slot('title', current.title, 'h2', { id: titleId }) : null}
                  </>,
                  'div',
                )
              ) : null}
              {current.content != null ? slot('content', current.content, 'div', { id: contentId }) : null}
              {slot(
                'footer',
                <>
                  {(progress === 'both' || progress === 'dots') && total > 1
                    ? slot(
                        'progress',
                        steps.map((step, i) => <React.Fragment key={i}>{slot('dot', null, 'span', { 'data-current': dataAttr(i === index), 'data-done': dataAttr(i < index) }, { index: i, step, current: i === index, done: i < index })}</React.Fragment>),
                        'div',
                        { 'aria-hidden': true },
                      )
                    : null}
                  {slot(
                    'actions',
                    <>
                      {(current.actions ?? []).map((action, i) => (
                        <Button key={`a${i}`} size={buttonSize} variant="ghost" tone="neutral" {...action} />
                      ))}
                      {config.showSkip !== false && !last ? <Button size={buttonSize} variant="ghost" tone="neutral" label={labels.skip ?? 'Skip'} onClick={skip} slotProps={{ root: { 'data-tour-action': 'skip' } }} /> : null}
                      {index > 0 ? <Button size={buttonSize} variant="outline" tone="neutral" label={labels.back ?? 'Back'} onClick={() => void go(index - 1)} slotProps={{ root: { 'data-tour-action': 'back' } }} /> : null}
                      <Button
                        size={buttonSize}
                        variant="solid"
                        tone={state.tone}
                        loading={pending}
                        label={last ? labels.done ?? 'Done' : labels.next ?? 'Next'}
                        onClick={() => (last ? complete() : void go(index + 1))}
                        slotProps={{ root: { 'data-tour-action': last ? 'done' : 'next' } }}
                      />
                    </>,
                    'div',
                  )}
                </>,
                'div',
              )}
            </>,
            'div',
            getCardProps(),
          )}
        </>
      ) : null;
    return renderSlot(config, 'root', rootBag, state, body, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TourApi = {
    ...state,
    start,
    next: () => (index === total - 1 ? complete() : void go(index + 1)),
    back: () => void go(index - 1),
    goTo: (step) => void go(step),
    skip,
    close: () => setOpen(false),
    getRootProps,
    getCardProps,
    render,
  };
  return usePinfoldComponent<TourApi, TourRootProps>('Tour', api, (props) => render(props));
}
