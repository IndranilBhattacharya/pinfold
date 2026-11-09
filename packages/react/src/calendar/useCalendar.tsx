import * as React from 'react';
import {
  addDays,
  addMonths,
  calendarKeyTarget,
  cn,
  dataAttr,
  dateAllowed,
  inactiveCalendarOptions,
  isoDate,
  isoWeek,
  localeWeekStart,
  mergeProps,
  monthGrid,
  monthStart,
  orderRange,
  parseIso,
  presetRange,
  PRESET_LABELS,
  radiusProps,
  rangeEndRule,
  todayIso,
  warnOnce,
  weekday,
  yearMonths,
  yearPage,
  type IsoDate,
  type PropsBag,
} from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { CHEVRON_ICON } from '../nav-icons';
import type { CalendarApi, CalendarComponent, CalendarConfig, CalendarPreset, CalendarRange, CalendarRootProps, CalendarSlot, CalendarState } from './types';

const subscribe = () => () => {};
/** False on the server and during hydration, so today is never baked into server HTML. */
const useMounted = () => React.useSyncExternalStore(subscribe, () => true, () => false);

const utc = (d: IsoDate) => {
  const p = parseIso(d)!;
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
};
const yearOf = (d: IsoDate) => parseIso(d)!.year;
const yearStart = (d: IsoDate) => isoDate(yearOf(d), 1, 1);

/**
 * A month grid to choose a day, a range or several days (or a month, or a year), as a hook that hands
 * back a component. Values are ISO dates ("2026-11-08"): plain data, the same on the server and in
 * every time zone.
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
  const granularity = config.granularity ?? 'day';
  const days = granularity === 'day';
  // A month or a year is named by its first day.
  const unit = (d: IsoDate) => (granularity === 'month' ? monthStart(d) : granularity === 'year' ? yearStart(d) : d);
  const mounted = useMounted();
  // Today only after mount: the server's day may not be the reader's.
  const today = mounted ? todayIso() : '';
  const [value, setValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? (mode === 'multiple' ? [] : null) });
  // Any shape of value reads as days (a day given to a range is a one-day range); only real days count.
  const asDays = (v: unknown): unknown[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? [(v as CalendarRange).start, (v as CalendarRange).end] : v ? [v, v] : []);
  const read = asDays(value).filter((d): d is IsoDate => typeof d === 'string' && !!parseIso(d));
  const chosen: IsoDate[] = (mode === 'multiple' ? [...new Set(read)].sort() : mode === 'range' ? read.slice(0, 2) : read.slice(0, 1)).map((d) => unit(d.slice(0, 10)));
  const anchor = chosen[0] ?? config.defaultMonth ?? config.min ?? todayIso();
  const [month, setMonthState] = useControllableState<IsoDate>({ value: config.month ? monthStart(config.month) : undefined, defaultValue: monthStart(config.defaultMonth ?? anchor) });
  const [focused, setFocused] = React.useState<IsoDate>(chosen[0] ?? unit(anchor));
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

  const count = days ? config.months ?? 1 : 1;
  const weekStart = config.weekStart ?? localeWeekStart(config.locale);
  const state: CalendarState = { mode, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, month, granularity };
  const labels = config.labels ?? {};
  const own = config.isDateDisabled;
  const dayContext = { mode, start: pending };
  const baseAllowed = (d: IsoDate) => dateAllowed(d, config.min, config.max, own ? (x) => own(x, dayContext) : undefined);
  // While a range is being picked, its end must respect min/max days and not jump a day that cannot be chosen.
  const endRule = React.useMemo(
    () =>
      mode === 'range' && pending && days
        ? rangeEndRule(pending, { minDays: config.minDays, maxDays: config.maxDays, allowed: baseAllowed, spanDisabled: config.allowDisabledInRange })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pending, mode, days, config.minDays, config.maxDays, config.allowDisabledInRange, config.min, config.max, own],
  );
  const allowed = (d: IsoDate): boolean => {
    if (granularity === 'month') return (!config.min || d >= monthStart(config.min)) && (!config.max || d <= config.max) && !own?.(d, dayContext);
    if (granularity === 'year') return (!config.min || d >= yearStart(config.min)) && (!config.max || d <= config.max) && !own?.(d, dayContext);
    if (!baseAllowed(d)) return false;
    return endRule ? d === pending || endRule(d) : true;
  };
  const fmt = React.useMemo(() => {
    const make = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(config.locale, { timeZone: 'UTC', ...o });
    return {
      title: make({ month: 'long', year: 'numeric' }),
      year: make({ year: 'numeric' }),
      monthName: make({ month: 'long' }),
      monthShort: make({ month: 'short' }),
      short: make({ weekday: 'short' }),
      long: make({ weekday: 'long' }),
      day: make({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }, [config.locale]);
  const years = React.useMemo(() => {
    const now = yearOf(todayIso());
    const [lo, hi] = config.yearRange ?? [config.min ? yearOf(config.min) : now - 100, config.max ? yearOf(config.max) : now + 20];
    return Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
  }, [config.yearRange, config.min, config.max]);

  const setMonth = (d: IsoDate) => {
    const next = monthStart(d);
    if (next === month) return;
    setMonthState(next);
    config.onMonthChange?.(next);
  };
  // Focus follows the focused cell after a key moved it (the page may have turned).
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
    else if (!pending) {
      setPending(d);
      config.onRangeStart?.(d);
    } else {
      commit(orderRange(pending, d));
      setPending(null);
      setHover(null);
    }
  };

  const resolvePreset = (p: CalendarPreset) => {
    if (typeof p === 'string') return { label: PRESET_LABELS[p], value: presetRange(p, todayIso(), weekStart) as IsoDate | CalendarRange };
    return { label: p.label, value: typeof p.value === 'function' ? p.value() : p.value };
  };
  const applyPreset = (v: IsoDate | CalendarRange) => {
    const range = typeof v === 'string' ? { start: v, end: v } : v;
    setPending(null);
    setHover(null);
    if (mode === 'single') commit(unit(range.start));
    else if (mode === 'range') commit({ start: unit(range.start), end: unit(range.end) });
    else {
      const all: IsoDate[] = [];
      for (let d = range.start; d <= range.end && all.length < 366; d = addDays(d, 1)) if (baseAllowed(d)) all.push(d);
      commit(all);
    }
    setFocused(unit(range.start));
    setMonth(range.start);
  };

  // The page the arrows turn: a month (days), a year (months), twelve years (years).
  const step = granularity === 'day' ? 1 : granularity === 'month' ? 12 : 144;
  const last = addMonths(month, count - 1);
  const pageOf = (d: IsoDate) => (granularity === 'day' ? monthStart(d) : granularity === 'month' ? yearStart(d) : isoDate(yearPage(yearOf(d))[0], 1, 1));
  const pageStart = pageOf(month);
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
    let target: IsoDate | null;
    if (days) target = calendarKeyTarget(focused, event.key, { shift: event.shiftKey, rtl: ctx.dir === 'rtl', weekStart });
    else {
      // Months and years sit three to a row.
      const by = granularity === 'month' ? 1 : 12;
      const flip = ctx.dir === 'rtl' ? -1 : 1;
      const moves: Record<string, number> = { ArrowRight: by * flip, ArrowLeft: -by * flip, ArrowDown: by * 3, ArrowUp: -by * 3, PageDown: by * 12, PageUp: -by * 12 };
      target = event.key in moves ? addMonths(focused, moves[event.key]) : event.key === 'Home' ? pageOf(focused) : event.key === 'End' ? addMonths(pageOf(focused), by * 11) : null;
    }
    if (!target) return;
    event.preventDefault();
    if (config.min && target < unit(config.min)) target = unit(config.min);
    if (config.max && target > config.max) target = unit(config.max);
    moved.current = true;
    setFocused(target);
    if (pending) setHover(target);
    if (!days) setMonth(pageOf(target));
    else if (target < month) setMonth(target);
    else if (monthStart(target) > last) setMonth(addMonths(monthStart(target), -(count - 1)));
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        role: 'group',
        'aria-label': config.label ?? 'Calendar',
        'data-mode': mode,
        'data-granularity': granularity,
        'data-caption': config.captionLayout ?? 'label',
        'data-size': state.size,
        'data-tone': state.tone,
        'data-months': String(count),
        'data-presets': dataAttr(!!config.presets?.length),
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
    const outside = config.showOutsideDays !== false && count === 1;
    const canPrev = !config.min || addMonths(pageStart, -1) >= pageOf(config.min);
    const canNext = !config.max || addMonths(pageStart, step * (days ? count : 1)) <= config.max;
    const pageYears = yearPage(yearOf(month));
    const titleText = days ? monthsShown.map((m) => fmt.title.format(utc(m))).join(' – ') : granularity === 'month' ? fmt.year.format(utc(month)) : `${pageYears[0]} – ${pageYears[11]}`;
    const dropdown = (config.captionLayout ?? 'label') === 'dropdown';
    const minMonth = config.min ? monthStart(config.min) : '';
    const header = slot(
      'header',
      <>
        {slot('previous', CHEVRON_ICON, 'button', {
          type: 'button',
          'aria-label': labels.previous ?? (days ? 'Previous month' : granularity === 'month' ? 'Previous year' : 'Previous years'),
          'aria-disabled': !canPrev || undefined,
          'data-flip': '',
          onClick: () => canPrev && setMonth(addMonths(month, -step)),
        })}
        {slot('title', titleText, 'div', { id: `${base}-title`, 'aria-live': 'polite' })}
        {dropdown ? (
          <span className={cls('pinfold-calendar__jump')}>
            {granularity === 'day'
              ? slot(
                  'monthSelect',
                  yearMonths(yearOf(month)).map((m) => (
                    <option key={m} value={m} disabled={(!!minMonth && m < minMonth) || (!!config.max && m > config.max)}>
                      {fmt.monthName.format(utc(m))}
                    </option>
                  )),
                  'select',
                  { 'aria-label': labels.month ?? 'Month', value: month, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setMonth(e.target.value) },
                )
              : null}
            {granularity !== 'year'
              ? slot(
                  'yearSelect',
                  years.map((y) => (
                    <option key={y} value={y}>
                      {fmt.year.format(utc(isoDate(y, 1, 1)))}
                    </option>
                  )),
                  'select',
                  {
                    'aria-label': labels.year ?? 'Year',
                    value: yearOf(month),
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      const p = parseIso(month)!;
                      let next = isoDate(Number(e.target.value), p.month, 1);
                      if (minMonth && next < minMonth) next = minMonth;
                      if (config.max && next > config.max) next = monthStart(config.max);
                      setMonth(next);
                    },
                  },
                )
              : null}
          </span>
        ) : null}
        {slot('next', CHEVRON_ICON, 'button', {
          type: 'button',
          'aria-label': labels.next ?? (days ? 'Next month' : granularity === 'month' ? 'Next year' : 'Next years'),
          'aria-disabled': !canNext || undefined,
          onClick: () => canNext && setMonth(addMonths(month, step)),
        })}
      </>,
      'div',
    );
    const visibleCells = days ? null : granularity === 'month' ? yearMonths(yearOf(month)) : pageYears.map((y) => isoDate(y, 1, 1));
    // The focused cell is the tab stop; when it is not on the page, the first cell is.
    const stop = days ? (monthsShown.some((m) => monthStart(focused) === m) ? focused : month) : visibleCells!.includes(focused) ? focused : visibleCells![0];
    const cellProps = (d: IsoDate, label: string, extra: PropsBag = {}) => {
      const ok = allowed(d);
      const selected = range ? d >= range.start && d <= range.end : chosen.includes(d);
      return {
        type: 'button',
        tabIndex: d === stop ? 0 : -1,
        'aria-label': label,
        'aria-disabled': !ok || undefined,
        'data-date': d,
        'data-selected': dataAttr(selected),
        'data-range-start': dataAttr(!!range && d === range.start),
        'data-range-end': dataAttr(!!range && d === range.end),
        'data-in-range': dataAttr(!!range && d > range.start && d < range.end),
        onClick: () => pick(d),
        onPointerEnter: () => pending && setHover(d),
        onFocus: () => setFocused(d),
        ...extra,
        selected,
        ok,
      };
    };
    const strip = ({ selected: _s, ok: _o, ...rest }: PropsBag) => rest;
    const pickerGrid = () => {
      const cells = visibleCells!;
      const rows = [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 9), cells.slice(9, 12)];
      const thisUnit = today ? unit(today) : '';
      return slot(
        'grid',
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((d) => {
                const label = granularity === 'month' ? fmt.title.format(utc(d)) : fmt.year.format(utc(d));
                const p = cellProps(d, label, { 'aria-current': d === thisUnit ? 'date' : undefined });
                return (
                  <td key={d} role="gridcell" aria-selected={p.selected || undefined}>
                    {slot('cell', granularity === 'month' ? fmt.monthShort.format(utc(d)) : fmt.year.format(utc(d)), 'button', {
                      [ITEM]: { date: d, outside: false, disabled: !p.ok, selected: p.selected, today: d === thisUnit, rangeStart: !!range && d === range.start, rangeEnd: !!range && d === range.end },
                      ...strip(p),
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>,
        'table',
        { role: 'grid', 'aria-labelledby': `${base}-title`, 'aria-multiselectable': mode !== 'single' || undefined },
      );
    };
    const weekdays = monthGrid(month, weekStart)[0];
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
                  {config.showWeekNumbers ? slot('weekNumber', labels.week ?? 'Wk', 'th', { scope: 'col', abbr: 'Week' }) : null}
                  {weekdays.map((d) => (
                    <React.Fragment key={d}>{slot('weekday', fmt.short.format(utc(d)), 'th', { scope: 'col', abbr: fmt.long.format(utc(d)) })}</React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={week[0]}>
                    {config.showWeekNumbers ? slot('weekNumber', isoWeek(week.find((d) => weekday(d) === 1) ?? week[0]), 'th', { scope: 'row' }) : null}
                    {week.map((d) => {
                      const inMonth = monthStart(d) === m;
                      if (!inMonth && !outside) return <td key={d} role="gridcell" />;
                      const p = cellProps(d, fmt.day.format(utc(d)), { tabIndex: d === stop && inMonth ? 0 : -1, 'aria-current': d === today ? 'date' : undefined, 'data-outside': dataAttr(!inMonth) });
                      const extra = config.dayContent?.(d);
                      return (
                        <td key={d} role="gridcell" aria-selected={p.selected || undefined}>
                          {slot(
                            'day',
                            extra == null || extra === false ? (
                              parseIso(d)!.day
                            ) : (
                              <>
                                <span>{parseIso(d)!.day}</span>
                                {slot('dayContent', extra, 'span')}
                              </>
                            ),
                            'button',
                            {
                              [ITEM]: { date: d, outside: !inMonth, disabled: !p.ok, selected: p.selected, today: d === today, rangeStart: !!range && d === range.start, rangeEnd: !!range && d === range.end },
                              'data-has-content': dataAttr(extra != null && extra !== false),
                              ...strip(p),
                            },
                          )}
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
    const presets = config.presets?.length
      ? slot(
          'presets',
          config.presets.map((p, i) => {
            const { label, value: v } = resolvePreset(p);
            const r = typeof v === 'string' ? { start: v, end: v } : v;
            const on = mode === 'range' ? !!range && !pending && unit(r.start) === range.start && unit(r.end) === range.end : mode === 'single' ? chosen[0] === unit(r.start) : false;
            return <React.Fragment key={i}>{slot('preset', label, 'button', { type: 'button', 'aria-pressed': on, onClick: () => applyPreset(v) })}</React.Fragment>;
          }),
          'div',
          { role: 'group', 'aria-label': labels.presets ?? 'Presets' },
        )
      : null;
    const months = slot('months', days ? monthsShown.map(table) : pickerGrid(), 'div', { ref: grid, onKeyDown });
    const content = (
      <>
        {header}
        {presets ? slot('body', <>{presets}{months}</>, 'div') : months}
        {config.showToday || config.footer != null
          ? slot(
              'footer',
              <>
              {config.footer}
              {config.showToday ? slot('today', labels.today ?? 'Today', 'button', {
                type: 'button',
                onClick: () => {
                  const t = unit(todayIso());
                  setMonth(t);
                  setFocused(t);
                  if (mode === 'single' && allowed(t)) commit(t);
                },
              }) : null}
              </>,
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

