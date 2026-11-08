import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveCarouselOptions, mergeProps, slideFromScroll, stepIndex, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
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
 * Slides in a row that scrolls and snaps (a swipe, a trackpad and the arrow buttons all move it),
 * as a hook that hands back a component. Autoplay stops on hover, on focus and for reduced motion,
 * and always has a pause button.
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
  const perView = Math.max(1, config.slidesPerView ?? 1);
  const last = Math.max(0, count - Math.ceil(perView - 0.001));
  const [index, setIndexState] = useControllableState<number>({ value: config.index, defaultValue: config.defaultIndex ?? 0 });
  const [paused, setPaused] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const track = React.useRef<HTMLDivElement | null>(null);
  const fromButton = React.useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ carouselMeta, validateConfig }) => {
      for (const problem of validateConfig(carouselMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveCarouselOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Carousel: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Carousel: give it a `label`, e.g. "New arrivals".');
  }

  const playing = !!config.autoplay && !paused && !held;
  const state: CarouselState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, index, playing };
  const labels = config.labels ?? {};

  const setIndex = (next: number) => {
    if (next === index) return;
    setIndexState(next);
    config.onIndexChange?.(next);
  };
  const scrollTo = (i: number) => {
    const el = track.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (!el || !target) return;
    fromButton.current = true;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const left = rtl ? target.offsetLeft + target.offsetWidth - el.clientWidth : target.offsetLeft;
    el.scrollTo?.({ left, behavior: reducedMotion() || ctx.disableAnimation ? 'auto' : 'smooth' });
  };
  const goTo = (i: number) => {
    const next = Math.min(last, Math.max(0, i));
    setIndex(next);
    scrollTo(next);
  };
  const step = (by: 1 | -1) => goTo(stepIndex(index, by, last + 1, !!config.loop));

  // Scrolling by hand (swipe, trackpad, keyboard in the track) moves the index too.
  const onScroll = () => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const at = Math.min(last, slideFromScroll(el.scrollLeft, first.offsetWidth, gap, count));
    if (fromButton.current) {
      if (at === index) fromButton.current = false;
      return;
    }
    setIndex(at);
  };

  // A controlled index from outside scrolls the row to it.
  React.useEffect(() => {
    if (config.index !== undefined) scrollTo(config.index);
  }, [config.index]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!playing || reducedMotion()) return;
    const timer = setInterval(() => goTo(stepIndex(index, 1, last + 1, true)), Math.max(1500, config.autoplay!));
    return () => clearInterval(timer);
  });

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-roledescription': 'carousel',
        'aria-label': config.label,
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
    const content = (
      <>
        {slot(
          'viewport',
          <>
            {slot(
              'track',
              slides.map((s, i) => (
                <React.Fragment key={i}>
                  {slot('slide', s.content, 'div', { role: 'group', 'aria-roledescription': 'slide', 'aria-label': name(i), 'data-active': dataAttr(i >= index && i < index + Math.ceil(perView)) })}
                </React.Fragment>
              )),
              'div',
              // Focusable, so the keyboard can scroll it when the slides hold nothing focusable.
              { ref: track, id: trackId, tabIndex: 0, role: 'group', 'aria-label': config.label, 'aria-live': playing ? 'off' : 'polite', onScroll },
            )}
            {config.controls === false || count <= perView ? null : (
              <>
                {slot('previous', CHEVRON_ICON, 'button', { type: 'button', 'aria-label': labels.previous ?? 'Previous slide', 'aria-controls': trackId, 'aria-disabled': (!config.loop && index === 0) || undefined, 'data-flip': '', onClick: () => step(-1) })}
                {slot('next', CHEVRON_ICON, 'button', { type: 'button', 'aria-label': labels.next ?? 'Next slide', 'aria-controls': trackId, 'aria-disabled': (!config.loop && index >= last) || undefined, onClick: () => step(1) })}
              </>
            )}
          </>,
          'div',
        )}
        {config.indicators === false && !config.autoplay
          ? null
          : slot(
              'indicators',
              <>
                {config.autoplay
                  ? slot('play', paused ? PLAY : PAUSE, 'button', { type: 'button', 'aria-label': paused ? labels.play ?? 'Play' : labels.pause ?? 'Pause', onClick: () => setPaused(!paused) })
                  : null}
                {config.indicators === false
                  ? null
                  : Array.from({ length: last + 1 }, (_, i) => (
                      <React.Fragment key={i}>
                        {slot('indicator', null, 'button', { type: 'button', 'aria-label': labels.goTo ? labels.goTo(i + 1) : `Go to slide ${i + 1}`, 'aria-current': i === index || undefined, 'aria-controls': trackId, onClick: () => goTo(i) })}
                      </React.Fragment>
                    ))}
              </>,
              'div',
            )}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <section {...p}>{c}</section>) as React.ReactElement;
  };

  const api: CarouselApi = { index, goTo, next: () => step(1), previous: () => step(-1), getRootProps, render };
  return usePinfoldComponent<CarouselApi, CarouselRootProps>('Carousel', api, (props) => render(props));
}
