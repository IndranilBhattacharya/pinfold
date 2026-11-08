import * as React from 'react';
import { addMonths, calendarKeyTarget, cn, dataAttr, dateAllowed, inactiveCalendarOptions, localeWeekStart, mergeProps, monthGrid, monthStart, orderRange, parseIso, todayIso, warnOnce, type IsoDate, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { CHEVRON_ICON } from '../nav-icons';
import type { CalendarApi, CalendarComponent, CalendarConfig, CalendarRange, CalendarRootProps, CalendarSlot, CalendarState } from './types';

const subscribe = () => () => {};
/** False on the server and during hydration, so today is never baked into server HTML. */
const useMounted = () => React.useSyncExternalStore(subscribe, () => true, () => false);

const utc = (d: IsoDate) => {
  const p = parseIso(d)!;
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
};

/**
 * A month grid to choose a day, a range or several days, as a hook that hands back a component.
 * Values are ISO dates ("2026-11-08"): plain data, the same on the server and in every time zone.
 *
 *   const Day = useCalendar({ value: day, onChange: setDay, min: '2026-11-01' });
 *   return <Day />;
 *
 * Precedence: this config, then `defaults.calendar`, then the provider (size, tone), then the library default.
 */
export function useCalendar(input: CalendarConfig): CalendarComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.calendar ? (mergeConfig<CalendarConfig>(ctx.defaults.calendar as CalendarConfig, input) as CalendarConfig) : input;
  const base = useId();
  const mode = config.mode ?? 'single';
  const mounted = useMounted();
  // Today only after mount: the server's day may not be the reader's.
  const today = mounted ? todayIso() : '';
  const [value, setValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? (mode === 'multiple' ? [] : null) });
  // Any shape of value reads as days (a day given to a range is a one-day range); only real days count.
  const days = (v: unknown): unknown[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? [(v as CalendarRange).start, (v as CalendarRange).end] : v ? [v, v] : []);
  const read = days(value).filter((d): d is IsoDate => typeof d === 'string' && !!parseIso(d));
  const chosen: IsoDate[] = mode === 'multiple' ? [...new Set(read)].sort() : mode === 'range' ? read.slice(0, 2) : read.slice(0, 1);
  const anchor = chosen[0] ?? config.defaultMonth ?? config.min ?? todayIso();
  const [month, setMonthState] = useControllableState<IsoDate>({ value: config.month ? monthStart(config.month) : undefined, defaultValue: monthStart(config.defaultMonth ?? anchor) });
  const [focused, setFocused] = React.useState<IsoDate>(chosen[0] ?? anchor);
  // A range in progress: the first pick, and the day under the pointer or focus.
  const [pending, setPending] = React.useState<IsoDate | null>(null);
  const [hover, setHover] = React.useState<IsoDate | null>(null);
  const grid = React.useRef<HTMLDivElement | null>(null);
  const moved = React.useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ calendarMeta, validateConfig }) => {
      for (const problem of validateConfig(calendarMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveCalendarOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Calendar: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const count = config.months ?? 1;
  const weekStart = config.weekStart ?? localeWeekStart(config.locale);
  const state: CalendarState = { mode, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, month };
  const allowed = (d: IsoDate) => dateAllowed(d, config.min, config.max, config.isDateDisabled);
  const labels = config.labels ?? {};
  const fmt = React.useMemo(() => {
    const make = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(config.locale, { timeZone: 'UTC', ...o });
    return { title: make({ month: 'long', year: 'numeric' }), short: make({ weekday: 'short' }), long: make({ weekday: 'long' }), day: make({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) };
  }, [config.locale]);

  const setMonth = (d: IsoDate) => {
    const next = monthStart(d);
    if (next === month) return;
    setMonthState(next);
    config.onMonthChange?.(next);
  };
  // Focus follows the focused day after a key moved it (the month may have turned).
  React.useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-date="${focused}"]`)?.focus();
  });

  const commit = (next: unknown) => {
    setValue(next);
    (config.onChange as ((v: unknown) => void) | undefined)?.(next);
  };
  const pick = (d: IsoDate) => {
    if (!allowed(d)) return;
    setFocused(d);
    if (mode === 'single') commit(d);
    else if (mode === 'multiple') commit(chosen.includes(d) ? chosen.filter((x) => x !== d) : [...chosen, d].sort());
    else if (!pending) setPending(d);
    else {
      commit(orderRange(pending, d));
      setPending(null);
      setHover(null);
    }
  };

  const last = addMonths(month, count - 1);
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(focused);
      return;
    }
    if (event.key === 'Escape' && pending) {
      setPending(null);
      setHover(null);
      return;
    }
    let target = calendarKeyTarget(focused, event.key, { shift: event.shiftKey, rtl: ctx.dir === 'rtl', weekStart });
    if (!target) return;
    event.preventDefault();
    if (config.min && target < config.min) target = config.min;
    if (config.max && target > config.max) target = config.max;
    moved.current = true;
    setFocused(target);
    if (pending) setHover(target);
    if (target < month) setMonth(target);
    else if (monthStart(target) > last) setMonth(addMonths(monthStart(target), -(count - 1)));
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        role: 'group',
        'aria-label': config.label ?? 'Calendar',
        'data-mode': mode,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-months': String(count),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: CalendarRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: CalendarSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-calendar__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-calendar', config.className), style: config.style }, rootProps)));
    const range = mode === 'range' ? (pending ? orderRange(pending, hover ?? pending) : chosen.length ? { start: chosen[0], end: chosen[1] } : null) : null;
    const monthsShown = Array.from({ length: count }, (_, i) => addMonths(month, i));
    // The focused day is the tab stop; when it is not visible, the first day of the first month is.
    const visible = monthsShown.some((m) => monthStart(focused) === m);
    const stop = visible ? focused : month;
    const outside = config.showOutsideDays !== false && count === 1;
    const weekdays = monthGrid(month, weekStart)[0];
    const canPrev = !config.min || addMonths(month, -1) >= monthStart(config.min);
    const canNext = !config.max || addMonths(last, 1) <= config.max;
    const header = slot(
      'header',
      <>
        {slot('previous', CHEVRON_ICON, 'button', {
          type: 'button',
          'aria-label': labels.previous ?? 'Previous month',
          'aria-disabled': !canPrev || undefined,
          'data-flip': '',
          onClick: () => canPrev && setMonth(addMonths(month, -1)),
        })}
        {slot('title', monthsShown.map((m) => fmt.title.format(utc(m))).join(' – '), 'div', { id: `${base}-title`, 'aria-live': 'polite' })}
        {slot('next', CHEVRON_ICON, 'button', {
          type: 'button',
          'aria-label': labels.next ?? 'Next month',
          'aria-disabled': !canNext || undefined,
          onClick: () => canNext && setMonth(addMonths(month, 1)),
        })}
      </>,
      'div',
    );
    const table = (m: IsoDate, i: number) => {
      const weeks = monthGrid(m, weekStart);
      const titleId = `${base}-month-${i}`;
      return (
        <div key={m} className={cls('pinfold-calendar__month')}>
          {count > 1 ? (
            <div id={titleId} className={cls('pinfold-calendar__caption')}>
              {fmt.title.format(utc(m))}
            </div>
          ) : null}
          {slot(
            'grid',
            <>
              <thead>
                <tr>
                  {weekdays.map((d) => (
                    <React.Fragment key={d}>{slot('weekday', fmt.short.format(utc(d)), 'th', { scope: 'col', abbr: fmt.long.format(utc(d)) })}</React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={week[0]}>
                    {week.map((d) => {
                      const inMonth = monthStart(d) === m;
                      if (!inMonth && !outside) return <td key={d} role="gridcell" />;
                      const ok = allowed(d);
                      const selected = range ? d >= range.start && d <= range.end : chosen.includes(d);
                      return (
                        <td key={d} role="gridcell" aria-selected={selected || undefined}>
                          {slot('day', parseIso(d)!.day, 'button', {
                            type: 'button',
                            tabIndex: d === stop && inMonth ? 0 : -1,
                            'aria-label': fmt.day.format(utc(d)),
                            'aria-disabled': !ok || undefined,
                            'aria-current': d === today ? 'date' : undefined,
                            'data-date': d,
                            'data-outside': dataAttr(!inMonth),
                            'data-selected': dataAttr(selected),
                            'data-range-start': dataAttr(!!range && d === range.start),
                            'data-range-end': dataAttr(!!range && d === range.end),
                            'data-in-range': dataAttr(!!range && d > range.start && d < range.end),
                            onClick: () => pick(d),
                            onPointerEnter: () => pending && setHover(d),
                            onFocus: () => setFocused(d),
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </>,
            'table',
            { role: 'grid', 'aria-labelledby': count > 1 ? titleId : `${base}-title`, 'aria-multiselectable': mode !== 'single' || undefined },
          )}
        </div>
      );
    };
    const content = (
      <>
        {header}
        {slot('months', monthsShown.map(table), 'div', { ref: grid, onKeyDown })}
        {config.showToday
          ? slot(
              'footer',
              slot('today', labels.today ?? 'Today', 'button', {
                type: 'button',
                onClick: () => {
                  const t = todayIso();
                  setMonth(t);
                  setFocused(t);
                  if (mode === 'single' && allowed(t)) commit(t);
                },
              }),
              'div',
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: CalendarApi = {
    month,
    setMonth: (d) => setMonth(d),
    focus: () => grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<CalendarApi, CalendarRootProps>('Calendar', api, (props) => render(props));
}
