import * as React from 'react';
import { NO_EDGES, atScrollEnd, cn, dataAttr, dimensionVars, inactiveScrollAreaOptions, mergeProps, radiusProps, warnOnce, watchScrollEdges, type PropsBag, type ScrollEdges } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useEvent, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { ScrollAreaApi, ScrollAreaComponent, ScrollAreaConfig, ScrollAreaRootProps, ScrollAreaSlot, ScrollAreaState, ScrollToOptions } from './types';

const SIDES = ['top', 'bottom', 'start', 'end'] as const;

/**
 * A scrolling region that shows where more content is, as a hook that hands back a component.
 *
 *   const Messages = useScrollArea({ stickToEnd: true, dimensions: { height: 480 } });
 *   return <Messages>{rows}</Messages>;   // Messages.scrollToEnd()
 *
 * Precedence: this config, then `defaults.scrollarea`, then the provider (tone), then the library default.
 */
export function useScrollArea(input: ScrollAreaConfig = {}): ScrollAreaComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.scrollarea ? mergeConfig<ScrollAreaConfig>(ctx.defaults.scrollarea, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ scrollareaMeta, validateConfig }) => {
      for (const problem of validateConfig(scrollareaMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveScrollAreaOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `ScrollArea: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const orientation = config.orientation ?? 'vertical';
  const indicator = config.indicator ?? 'fade';
  const [edges, setEdges] = React.useState<ScrollEdges>(NO_EDGES);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  // Whether the reader is at the end: decided on their scrolls, read when content grows.
  const pinned = React.useRef(true);
  const reached = React.useRef({ start: false, end: false });
  const state: ScrollAreaState = { orientation, indicator, edges };

  const onEdges = useEvent((next: ScrollEdges) => {
    setEdges(next);
    config.onEdgesChange?.(next);
  });
  const threshold = config.reachThreshold ?? 48;
  const checkReach = useEvent(() => {
    const el = viewportRef.current;
    if (!el) return;
    const horizontal = orientation === 'horizontal';
    const offset = horizontal ? Math.abs(el.scrollLeft) : el.scrollTop;
    const room = horizontal ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    if (room <= 0) return;
    const start = offset <= threshold;
    const end = room - offset <= threshold;
    // Fire once per arrival, not on every scroll event inside the threshold.
    if (start && !reached.current.start) config.onReachStart?.();
    if (end && !reached.current.end) config.onReachEnd?.();
    reached.current = { start, end };
  });

  useIsomorphicLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    return watchScrollEdges(viewport, { target: rootRef.current, onChange: onEdges });
  }, [onEdges]);

  // Follow the end as content arrives: observe the content's size, never poll.
  const stick = !!config.stickToEnd && orientation !== 'horizontal';
  useIsomorphicLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!stick || !viewport) return;
    const toEnd = () => {
      if (pinned.current) viewport.scrollTop = viewport.scrollHeight;
    };
    toEnd();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(toEnd);
    for (const child of Array.from(viewport.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [stick]);

  const behavior = (options?: ScrollToOptions): ScrollBehavior => {
    if (options?.behavior === 'instant' || ctx.disableAnimation) return 'auto';
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto';
    return 'smooth';
  };
  const scrollTo = useEvent((target: { top?: number; left?: number } | Element, options?: ScrollToOptions) => {
    const el = viewportRef.current;
    if (!el) return;
    if (typeof Element !== 'undefined' && target instanceof Element) {
      // Offsets relative to the viewport: never scrolls the page, unlike scrollIntoView.
      const a = target.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      el.scrollTo({ top: el.scrollTop + a.top - b.top - (b.height - a.height) / 2, left: el.scrollLeft + a.left - b.left - (b.width - a.width) / 2, behavior: behavior(options) });
    } else el.scrollTo({ ...(target as { top?: number; left?: number }), behavior: behavior(options) });
  });
  const scrollToStart = useEvent((options?: ScrollToOptions) => scrollTo({ top: 0, left: 0 }, options));
  const scrollToEnd = useEvent((options?: ScrollToOptions) => {
    const el = viewportRef.current;
    if (!el) return;
    pinned.current = true;
    const rtl = getComputedStyle(el).direction === 'rtl';
    scrollTo(orientation === 'horizontal' ? { left: (rtl ? -1 : 1) * el.scrollWidth } : { top: el.scrollHeight }, options);
  });

  const overflowing = edges.top || edges.bottom || edges.start || edges.end;
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: rootRef,
        'data-orientation': orientation,
        'data-indicator': indicator,
        'data-scrollbar': config.scrollbar ?? 'thin',
        'data-tone': config.tone ?? ctx.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        style: { ...radiusProps(config.radius).style, ...dimensionVars('scrollarea', config.dimensions), ...dimensionVars('scrollarea', { indicatorSize: config.indicatorSize }) },
      },
      props,
    );
  const getViewportProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: viewportRef,
        role: config.label ? 'region' : undefined,
        'aria-label': config.label,
        // Focusable only while there is something to scroll, so a keyboard can reach it and Tab never stops on a static box.
        tabIndex: overflowing ? 0 : undefined,
        onScroll: (event: React.UIEvent<HTMLDivElement>) => {
          const el = event.currentTarget;
          if (stick) pinned.current = atScrollEnd(el);
          checkReach();
          config.onScroll?.(event);
        },
      },
      props,
    );

  const render = (rootProps?: ScrollAreaRootProps & { children?: React.ReactNode }): React.ReactElement => {
    const { children, ...rest } = rootProps ?? {};
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ScrollAreaSlot, content: React.ReactNode, own: PropsBag = {}, tag = 'div') =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-scrollarea__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-scrollarea', config.className), style: config.style }, rest as PropsBag)));
    const body = (
      <>
        {slot('viewport', slot('content', config.content ?? children), getViewportProps())}
        {indicator === 'none' || indicator === 'fade'
          ? null
          : SIDES.map((side) => <React.Fragment key={side}>{slot('indicator', null, { 'aria-hidden': true, 'data-side': side }, 'span')}</React.Fragment>)}
      </>
    );
    return renderSlot(config, 'root', root, state, body, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ScrollAreaApi = { edges, getViewport: () => viewportRef.current, scrollToStart, scrollToEnd, scrollTo, getRootProps, getViewportProps, render };
  return usePinfoldComponent<ScrollAreaApi, ScrollAreaRootProps & { children?: React.ReactNode }>('ScrollArea', api, (props) => render(props));
}
