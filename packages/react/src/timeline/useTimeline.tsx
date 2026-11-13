import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveTimelineOptions, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { ALERT_ICON, CHECK_ICON, CHEVRON_DOWN_ICON } from '../nav-icons';
import type { TimelineApi, TimelineComponent, TimelineConfig, TimelineItem, TimelineItemContext, TimelineRootProps, TimelineSlot, TimelineState, TimelineStatus } from './types';

const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;
const SPOKEN: Record<TimelineStatus, string> = { complete: 'done', current: 'current', upcoming: 'not started', error: 'error' };

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
  const base = useId();
  const items: TimelineItem[] = (config.items ?? []).map((item) => (typeof item === 'string' ? { title: item } : item));
  // Open collapsible events, by their position in `items` (so `reverse` keeps them open).
  const [opened, setOpened] = React.useState<ReadonlySet<number>>(() => new Set(items.flatMap((item, i) => (item.defaultOpen ? [i] : []))));

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ timelineMeta, validateConfig }) => {
      for (const problem of validateConfig(timelineMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTimelineOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Timeline: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const orientation = config.orientation ?? 'vertical';
  const state: TimelineState = {
    variant: config.variant ?? 'dot',
    orientation,
    align: config.align ?? 'start',
    connector: config.connector ?? 'gap',
    density: config.density ?? 'comfortable',
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
  };
  const timePlacement = config.timePlacement ?? 'above';
  const opposite = timePlacement === 'opposite' || items.some((item) => item.opposite != null);
  const fmt = React.useMemo(
    () => ({ day: new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', timeZone: 'UTC' }), time: new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) }),
    [config.locale],
  );
  const shownTime = (t: string) => {
    if (!ISO.test(t)) return t;
    const date = new Date(t.length > 10 ? `${t.slice(0, 16)}Z` : `${t}T00:00Z`);
    return Number.isNaN(date.getTime()) ? t : (t.length > 10 ? fmt.time : fmt.day).format(date);
  };

  // Shown order, each with its place in `items`.
  const order = items.map((_, i) => i);
  if (config.reverse) order.reverse();
  const newest = items.length - 1;
  const statusOf = (at: number): TimelineStatus | undefined => items[at].status ?? (config.pending ? (at === newest ? 'current' : 'complete') : undefined);
  const isOpen = (at: number) => items[at].open ?? opened.has(at);
  const contextOf = (i: number): TimelineItemContext => {
    const at = order[i];
    return { ...items[at], index: i, pending: !!config.pending && at === newest, status: statusOf(at), open: isOpen(at), first: i === 0, last: i === order.length - 1 };
  };
  const setOpen = (at: number, open: boolean) =>
    setOpened((prev) => {
      if (prev.has(at) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(at);
      else next.delete(at);
      return next;
    });

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-label': config.label,
        'data-variant': state.variant,
        'data-orientation': orientation,
        'data-align': state.align,
        'data-connector': state.connector,
        'data-density': state.density,
        'data-time-placement': timePlacement,
        'data-opposite': dataAttr(opposite),
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
    const vars = dimensionVars('timeline', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-timeline', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const events = order.map((at, i) => {
      const item = contextOf(i);
      const { status } = item;
      const time = item.time ? slot('time', shownTime(item.time), 'time', ISO.test(item.time) ? { dateTime: item.time } : {}) : null;
      // The marker: your own content, else the icon, else a mark for the status (icon and card variants).
      const own = item.marker !== undefined ? (typeof item.marker === 'function' ? item.marker(item) : item.marker) : config.marker?.(item);
      const custom = own !== undefined && own !== null;
      const glyph = custom ? own : state.variant === 'dot' ? null : (item.icon ?? (status === 'complete' ? CHECK_ICON : status === 'error' ? ALERT_ICON : null));
      // The line to the next event shown takes the state of the earlier of the two in time.
      const earlier = i < order.length - 1 ? (config.reverse ? order[i + 1] : at) : -1;
      const collapsible = !!config.collapsible && item.content != null;
      const interactive = collapsible || !!config.onItemClick;
      const contentId = `${base}-content-${at}`;
      const title = slot(
        'title',
        interactive ? (
          <>
            {item.title}
            {collapsible ? <span className={cls('pinfold-timeline__chevron')} aria-hidden="true">{CHEVRON_DOWN_ICON}</span> : null}
          </>
        ) : (
          item.title
        ),
        interactive ? 'button' : 'span',
        interactive
          ? {
              type: 'button',
              'aria-expanded': collapsible ? item.open : undefined,
              'aria-controls': collapsible ? contentId : undefined,
              onClick: (event: React.MouseEvent) => {
                if (collapsible) {
                  const next = !item.open;
                  // A controlled event (`open` on the item) waits for you to change it.
                  if (items[at].open === undefined) setOpen(at, next);
                  config.onOpenChange?.({ ...item, open: next }, next, event);
                }
                config.onItemClick?.(item, event);
              },
            }
          : {},
      );
      const oppositeContent = timePlacement === 'opposite' ? (time || item.opposite != null ? <>{time}{item.opposite}</> : null) : item.opposite;
      return (
        <React.Fragment key={at}>
          {slot(
            'item',
            <>
              {slot('marker', glyph, 'span', { 'aria-hidden': true, 'data-custom': dataAttr(custom) })}
              {earlier >= 0 && state.connector !== 'none' ? slot('connector', null, 'span', { 'aria-hidden': true, 'data-status': statusOf(earlier) }) : null}
              {opposite ? slot('opposite', oppositeContent, 'div') : null}
              {slot(
                'body',
                <>
                  {timePlacement === 'above' ? time : null}
                  {title}
                  {/* Only a status you set is read: one from `pending` is already `aria-current`. */}
                  {status && items[at].status ? <span style={VISUALLY_HIDDEN}>{`, ${config.labels?.status?.[status] ?? SPOKEN[status]}`}</span> : null}
                  {item.description != null ? slot('description', item.description, 'span') : null}
                  {item.content != null ? slot('content', item.content, 'div', collapsible ? { id: contentId, hidden: !item.open || undefined } : {}) : null}
                  {timePlacement === 'below' ? time : null}
                </>,
                'div',
                { 'data-interactive': dataAttr(interactive) },
              )}
            </>,
            'li',
            {
              [ITEM]: item,
              'data-tone': item.tone,
              'data-status': status,
              'data-pending': dataAttr(item.pending),
              'data-open': dataAttr(collapsible && item.open),
              'data-custom-marker': dataAttr(custom),
              'aria-current': status === 'current' ? 'step' : undefined,
            },
          )}
        </React.Fragment>
      );
    });
    return renderSlot(config, 'root', root, state, events, (p, c) => <ol {...p}>{c}</ol>) as React.ReactElement;
  };

  const api: TimelineApi = {
    setOpen: (index, open) => {
      if (order[index] !== undefined) setOpen(order[index], open);
    },
    getRootProps,
    render,
  };
  return usePinfoldComponent<TimelineApi, TimelineRootProps>('Timeline', api, (props) => render(props));
}
