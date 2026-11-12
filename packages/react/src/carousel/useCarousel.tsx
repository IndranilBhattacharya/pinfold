import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveCarouselOptions, mergeProps, stepIndex, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { CHEVRON_ICON } from '../nav-icons';
import type { CarouselApi, CarouselComponent, CarouselConfig, CarouselRootProps, CarouselSlide, CarouselSlot, CarouselState } from './types';

const PAUSE = (
  <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
const PLAY = (
  <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" />
  </svg>
);
const isSlide = (s: unknown): s is CarouselSlide => !!s && typeof s === 'object' && !React.isValidElement(s) && 'content' in (s as object);
const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Slides that scroll and snap (a swipe, a trackpad, a mouse drag, the arrow keys and the buttons all
 * move it), as a hook that hands back a component. One row or one column; the usual row of slides, or
 * the current slide centred and larger with its neighbours beside it. Autoplay stops on hover, on
 * focus and for reduced motion, and always has a pause button.
 *
 *   const Gallery = useCarousel({ label: 'New arrivals', slides });
 *   return <Gallery />;
 *
 * Precedence: this config, then `defaults.carousel`, then the provider (size, tone), then the library default.
 */
export function useCarousel(input: CarouselConfig): CarouselComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.carousel ? mergeConfig<CarouselConfig>(ctx.defaults.carousel, input) : input;
  const base = useId();
  const slides: CarouselSlide[] = (config.slides ?? []).map((s) => (isSlide(s) ? s : { content: s as React.ReactNode }));
  const count = slides.length;
  const variant = config.variant ?? 'slide';
  const vertical = config.orientation === 'vertical';
  // Centred variants keep one slide in the middle: it is the current one, and every slide can be it.
  const centred = variant !== 'slide';
  const perView = Math.max(1, config.slidesPerView ?? (variant === 'center' ? 1.4 : variant === 'coverflow' ? 2 : variant === 'stagger' ? 3 : 1));
  const last = centred ? Math.max(0, count - 1) : Math.max(0, count - Math.ceil(perView - 0.001));
  const [index, setIndexState] = useControllableState<number>({ value: config.index, defaultValue: config.defaultIndex ?? 0 });
  const [paused, setPaused] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const track = React.useRef<HTMLDivElement | null>(null);
  const fromButton = React.useRef(false);
  // A drag that moved: the click that ends it must not press what is under the pointer.
  const dragged = React.useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ carouselMeta, validateConfig }) => {
      for (const problem of validateConfig(carouselMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveCarouselOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Carousel: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Carousel: give it a `label`, e.g. "New arrivals".');
  }

  const playing = !!config.autoplay && !paused && !held;
  const state: CarouselState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, index, playing, variant, orientation: vertical ? 'vertical' : 'horizontal', dragging };
  const labels = config.labels ?? {};
  const still = () => reducedMotion() || ctx.disableAnimation;

  const setIndex = (next: number) => {
    if (next === index) return;
    setIndexState(next);
    config.onIndexChange?.(next);
  };
  /** Where the track must scroll for slide `i` to take its place (the start, or the middle). */
  const offsetFor = (el: HTMLElement, target: HTMLElement): number => {
    if (vertical) return centred ? target.offsetTop - (el.clientHeight - target.offsetHeight) / 2 : target.offsetTop;
    const rtl = getComputedStyle(el).direction === 'rtl';
    if (centred) return target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2;
    return rtl ? target.offsetLeft + target.offsetWidth - el.clientWidth : target.offsetLeft;
  };
  const scrollTo = (i: number, instant = false) => {
    const el = track.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (!el || !target) return;
    fromButton.current = true;
    const to = offsetFor(el, target);
    el.scrollTo?.({ [vertical ? 'top' : 'left']: to, behavior: instant || still() ? 'auto' : 'smooth' });
  };
  const goTo = (i: number) => {
    const next = Math.min(last, Math.max(0, i));
    setIndex(next);
    scrollTo(next);
  };
  const step = (by: 1 | -1) => goTo(stepIndex(index, by, last + 1, !!config.loop));
  /** The slide nearest its place right now. */
  const nearest = (): number => {
    const el = track.current;
    if (!el) return index;
    const at = vertical ? el.scrollTop : el.scrollLeft;
    let best = 0;
    let distance = Infinity;
    for (let i = 0; i <= last; i++) {
      const d = Math.abs(offsetFor(el, el.children[i] as HTMLElement) - at);
      if (d < distance) {
        distance = d;
        best = i;
      }
    }
    return best;
  };

  // Scrolling by hand (swipe, trackpad, drag) moves the index too.
  const onScroll = () => {
    if (!track.current) return;
    const at = nearest();
    if (fromButton.current) {
      if (at === index) fromButton.current = false;
      return;
    }
    setIndex(at);
  };

  // A controlled index from outside scrolls to it; a centred carousel starts on its slide.
  React.useEffect(() => {
    if (config.index !== undefined) scrollTo(config.index);
  }, [config.index]); // eslint-disable-line react-hooks/exhaustive-deps
  useIsomorphicLayoutEffect(() => {
    if (centred || index > 0) scrollTo(index, true);
    fromButton.current = false;
  }, [centred, vertical]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!playing || reducedMotion()) return;
    const timer = setInterval(() => goTo(stepIndex(index, 1, last + 1, true)), Math.max(1500, config.autoplay!));
    return () => clearInterval(timer);
  });

  // ---- drag with a mouse (touch and trackpads scroll natively) ----
  const draggable = config.draggable !== false && count > 1;
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || event.pointerType !== 'mouse' || event.button !== 0) return;
    const el = event.currentTarget;
    const start = vertical ? event.clientY : event.clientX;
    const origin = vertical ? el.scrollTop : el.scrollLeft;
    let lastAt = start;
    let lastTime = event.timeStamp;
    let velocity = 0;
    let moved = false;
    dragged.current = false;
    const move = (e: PointerEvent) => {
      const at = vertical ? e.clientY : e.clientX;
      if (!moved && Math.abs(at - start) < 5) return;
      if (!moved) {
        moved = true;
        dragged.current = true;
        setDragging(true);
        // Snapping would fight the hand; text and images must not be picked up instead.
        el.style.scrollSnapType = 'none';
        el.style.scrollBehavior = 'auto';
        el.setPointerCapture?.(e.pointerId);
      }
      const dt = Math.max(1, e.timeStamp - lastTime);
      velocity = (at - lastAt) / dt;
      lastAt = at;
      lastTime = e.timeStamp;
      el[vertical ? 'scrollTop' : 'scrollLeft'] = origin - (at - start);
      e.preventDefault();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moved) return;
      setDragging(false);
      // A flick carries one slide further in its direction; otherwise the nearest slide wins.
      let to = nearest();
      const flick = Math.abs(velocity) > 0.4;
      const forward = (velocity < 0) !== (!vertical && getComputedStyle(el).direction === 'rtl');
      if (flick && to === index) to = Math.min(last, Math.max(0, index + (forward ? 1 : -1)));
      el.style.scrollSnapType = '';
      el.style.scrollBehavior = '';
      setIndex(to);
      scrollTo(to);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    // Keys typed into a slide's own field are that field's.
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    const rtl = !vertical && ctx.dir === 'rtl';
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forward) step(1);
    else if (event.key === back) step(-1);
    else if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(last);
    else return;
    event.preventDefault();
  };

  const controls = config.controls === false ? 'none' : config.controls === true || config.controls === undefined ? 'always' : config.controls;
  const indicators = config.indicators === false ? 'none' : config.indicators === true || config.indicators === undefined ? 'dots' : config.indicators;
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-roledescription': 'carousel',
        'aria-label': config.label,
        'data-variant': variant,
        'data-orientation': vertical ? 'vertical' : 'horizontal',
        'data-controls': controls,
        'data-indicators': indicators,
        'data-edge-fade': dataAttr(config.edgeFade),
        'data-dragging': dataAttr(dragging),
        'data-size': state.size,
        'data-tone': state.tone,
        'data-playing': dataAttr(playing),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        style: { '--pinfold-crs-per': String(perView) },
        onPointerEnter: () => setHeld(true),
        onPointerLeave: () => setHeld(false),
        onFocus: () => setHeld(true),
        onBlur: (event: React.FocusEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false);
        },
      },
      props,
    );

  const render = (rootProps?: CarouselRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: CarouselSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-carousel__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('carousel', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-carousel', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const trackId = `${base}-track`;
    const name = (i: number) => slides[i].label ?? (labels.slide ? labels.slide(i + 1, count) : `${i + 1} of ${count}`);
    const isActive = (i: number) => (centred ? i === index : i >= index && i < index + Math.ceil(perView));
    const content = (
      <>
        {slot(
          'viewport',
          <>
            {slot(
              'track',
              slides.map((s, i) => (
                <React.Fragment key={i}>
                  {slot('slide', s.content, 'div', {
                    [ITEM]: { index: i, active: isActive(i), offset: i - index, label: name(i) },
                    role: 'group',
                    'aria-roledescription': 'slide',
                    'aria-label': name(i),
                    'data-active': dataAttr(isActive(i)),
                    // Which side of the current slide it is on, and how far (capped), for the centred looks.
                    'data-side': i === index ? undefined : i < index ? 'before' : 'after',
                    'data-distance': centred ? Math.min(3, Math.abs(i - index)) : undefined,
                    // Pressing a neighbour in a centred carousel brings it to the middle.
                    onClick: centred && i !== index ? () => !dragged.current && goTo(i) : undefined,
                  })}
                </React.Fragment>
              )),
              'div',
              // Focusable, so the keyboard can move it when the slides hold nothing focusable.
              {
                ref: track,
                id: trackId,
                tabIndex: 0,
                role: 'group',
                'aria-label': config.label,
                'aria-live': playing ? 'off' : 'polite',
                onScroll,
                onKeyDown,
                onPointerDown,
                // A drag must not end as a click on the card under the pointer, nor start a native image drag.
                onClickCapture: (event: React.MouseEvent) => {
                  if (!dragged.current) return;
                  dragged.current = false;
                  event.preventDefault();
                  event.stopPropagation();
                },
                onDragStart: (event: React.DragEvent) => event.preventDefault(),
              },
            )}
            {controls === 'none' || count <= (centred ? 1 : perView) ? null : (
              <>
                {slot('previous', CHEVRON_ICON, 'button', { type: 'button', 'aria-label': labels.previous ?? 'Previous slide', 'aria-controls': trackId, 'aria-disabled': (!config.loop && index === 0) || undefined, 'data-flip': '', onClick: () => step(-1) })}
                {slot('next', CHEVRON_ICON, 'button', { type: 'button', 'aria-label': labels.next ?? 'Next slide', 'aria-controls': trackId, 'aria-disabled': (!config.loop && index >= last) || undefined, onClick: () => step(1) })}
              </>
            )}
          </>,
          'div',
        )}
        {indicators === 'none' && !config.autoplay
          ? null
          : slot(
              'indicators',
              <>
                {config.autoplay
                  ? slot('play', paused ? PLAY : PAUSE, 'button', { type: 'button', 'aria-label': paused ? labels.play ?? 'Play' : labels.pause ?? 'Pause', onClick: () => setPaused(!paused) })
                  : null}
                {indicators === 'none' ? null : indicators === 'fraction' ? (
                  <span className={cls('pinfold-carousel__fraction')} aria-hidden="true">
                    <b>{index + 1}</b> / {last + 1}
                  </span>
                ) : (
                  Array.from({ length: last + 1 }, (_, i) => (
                    <React.Fragment key={i}>
                      {slot('indicator', null, 'button', { type: 'button', 'aria-label': labels.goTo ? labels.goTo(i + 1) : `Go to slide ${i + 1}`, 'aria-current': i === index || undefined, 'aria-controls': trackId, onClick: () => goTo(i) })}
                    </React.Fragment>
                  ))
                )}
              </>,
              'div',
            )}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <section {...p}>{c}</section>) as React.ReactElement;
  };

  const api: CarouselApi = { index, count, goTo, next: () => step(1), previous: () => step(-1), playing, play: () => setPaused(false), pause: () => setPaused(true), getRootProps, render };
  return usePinfoldComponent<CarouselApi, CarouselRootProps>('Carousel', api, (props) => render(props));
}
