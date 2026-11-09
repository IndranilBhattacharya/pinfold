import * as React from 'react';
import { cn, dataAttr, inactiveTimelineOptions, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import type { TimelineApi, TimelineComponent, TimelineConfig, TimelineItem, TimelineRootProps, TimelineSlot, TimelineState } from './types';

const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;

/**
 * Events in order (an order history, an activity feed, a roadmap), as a hook that hands back a
 * component. ISO times show in the locale and stay machine-readable in `<time datetime>`.
 *
 *   const History = useTimeline({ label: 'Order history', items });
 *   return <History />;
 *
 * Precedence: this config, then `defaults.timeline`, then the provider (size, tone), then the library default.
 */
export function useTimeline(input: TimelineConfig): TimelineComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.timeline ? mergeConfig<TimelineConfig>(ctx.defaults.timeline, input) : input;
  const items: TimelineItem[] = (config.items ?? []).map((item) => (typeof item === 'string' ? { title: item } : item));

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ timelineMeta, validateConfig }) => {
      for (const problem of validateConfig(timelineMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTimelineOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Timeline: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const orientation = config.orientation ?? 'vertical';
  const state: TimelineState = { variant: config.variant ?? 'dot', orientation, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone };
  const fmt = React.useMemo(
    () => ({ day: new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', timeZone: 'UTC' }), time: new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) }),
    [config.locale],
  );
  const shownTime = (t: string) => {
    if (!ISO.test(t)) return t;
    const date = new Date(t.length > 10 ? `${t.slice(0, 16)}Z` : `${t}T00:00Z`);
    return Number.isNaN(date.getTime()) ? t : (t.length > 10 ? fmt.time : fmt.day).format(date);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-label': config.label,
        'data-variant': state.variant,
        'data-orientation': orientation,
        'data-align': orientation === 'vertical' ? config.align ?? 'start' : undefined,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: TimelineRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: TimelineSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-timeline__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-timeline', config.className), style: config.style }, rootProps)));
    const ordered = config.reverse ? [...items].reverse() : items;
    const lastIndex = config.reverse ? 0 : ordered.length - 1;
    const events = ordered.map((item, i) => {
      const pending = !!config.pending && i === lastIndex;
      return (
        <React.Fragment key={i}>
          {slot(
            'item',
            <>
              {slot('marker', state.variant === 'dot' ? null : item.icon ?? null, 'span', { 'aria-hidden': true })}
              {i < ordered.length - 1 ? slot('connector', null, 'span', { 'aria-hidden': true }) : null}
              {slot(
                'body',
                <>
                  {item.time ? slot('time', shownTime(item.time), 'time', ISO.test(item.time) ? { dateTime: item.time } : {}) : null}
                  {slot('title', item.title, 'span')}
                  {item.description != null ? slot('description', item.description, 'span') : null}
                  {item.content != null ? slot('content', item.content, 'div') : null}
                </>,
                'div',
              )}
            </>,
            'li',
            { [ITEM]: { ...item, index: i, pending }, 'data-tone': item.tone, 'data-pending': dataAttr(pending), 'aria-current': pending ? 'step' : undefined },
          )}
        </React.Fragment>
      );
    });
    return renderSlot(config, 'root', root, state, events, (p, c) => <ol {...p}>{c}</ol>) as React.ReactElement;
  };

  const api: TimelineApi = { getRootProps, render };
  return usePinfoldComponent<TimelineApi, TimelineRootProps>('Timeline', api, (props) => render(props));
}
