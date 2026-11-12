import * as React from 'react';
import { cn, dataAttr, dateBlocked, isTimeZone, localTimeZone, timeZoneLabel, timeZones, valueToWall, wallToValue, convertWallTime, dimensionVars, foldText, inactiveDatePickerOptions, isoDate, mergeProps, orderRange, parseIso, parseTime, parseTypedDate, splitDateTime, warnOnce, type IsoDate, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, useField } from '../field';
import { useFloating, useMounted, useOverlayLayer } from '../overlay';
import { CLOSE_ICON } from '../nav-icons';
import { Calendar } from '../calendar/Calendar';
import type { CalendarRange } from '../calendar/types';
import type { DatePickerApi, DatePickerComponent, DatePickerConfig, DatePickerRootProps, DatePickerSlot, DatePickerState } from './types';

const CALENDAR_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
/** A day, or a day and a wall time ("2026-11-09T14:30"), as a UTC Date for formatting. */
const utc = (v: string) => {
  const { date, time } = splitDateTime(v);
  const p = parseIso(date)!;
  const [h = 0, m = 0, sec = 0] = time ? time.split(':').map(Number) : [];
  return new Date(Date.UTC(p.year, p.month - 1, p.day, h, m, sec));
};

/** "dd/mm/yyyy" (or "mm/yyyy", "yyyy") in the locale's order and separators. */
function pattern(locale?: string, granularity = 'day', time = false): string {
  if (granularity === 'year') return 'yyyy';
  const parts = new Intl.DateTimeFormat(locale, granularity === 'month' ? { year: 'numeric', month: '2-digit' } : { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(Date.UTC(2026, 10, 22)))
    .map((p) => (p.type === 'day' ? 'dd' : p.type === 'month' ? 'mm' : p.type === 'year' ? 'yyyy' : p.value))
    .join('');
  return time ? parts + ' hh:mm' : parts;
}

/** A typed month ("11/2026", "Nov 2026", "november 2026") or year ("2026") as its first day. */
function parseTypedPeriod(text: string, granularity: string, locale?: string): IsoDate | null {
  const year = /\b(\d{4})\b/.exec(text);
  if (!year) return null;
  const y = Number(year[1]);
  if (granularity === 'year') return text.trim() === year[1] ? isoDate(y, 1, 1) : null;
  const rest = foldText(text.replace(year[1], '').replace(/[\s/.,-]+/g, ' ').trim());
  const n = Number(rest);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return isoDate(y, n, 1);
  for (let m = 1; m <= 12; m++) {
    const d = new Date(Date.UTC(2026, m - 1, 1));
    for (const style of ['long', 'short'] as const) {
      if (foldText(new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(d)).replace('.', '') === rest.replace('.', '')) return isoDate(y, m, 1);
    }
  }
  return null;
}

/** A typed day with an optional time after it ("09/11/2026 14:30", "Nov 9, 2026, 2:30 pm"). */
function parseTypedDateTime(text: string, locale?: string): { date: IsoDate; time: string } | null {
  const whole = parseTypedDate(text, locale);
  if (whole) return { date: whole, time: '' };
  const m = /^(.*?)[,\s]+(\d{1,2}(?::\d{2}){0,2}\s*(?:[ap]\.?\s*m?\.?)?)$/i.exec(text.trim());
  if (!m) return null;
  const date = parseTypedDate(m[1], locale);
  const time = parseTime(m[2]);
  return date && time ? { date, time } : null;
}

/**
 * A date field: type a date in your own format, or pick one from a calendar. One day or a range.
 * Values are ISO dates; with `name`, a hidden input submits them (a range as "start/end").
 *
 *   const Due = useDatePicker({ label: 'Due date', value: due, onChange: setDue });
 *   return <Due />;
 *
 * Precedence: this config, then `defaults.datepicker`, then the provider (size, tone), then the library default.
 */
export function useDatePicker(input: DatePickerConfig): DatePickerComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.datepicker ? (mergeConfig<DatePickerConfig>(ctx.defaults.datepicker as DatePickerConfig, input) as DatePickerConfig) : input;
  const field = useField(config);
  const range = config.mode === 'range';
  const granularity = config.granularity ?? 'day';
  const withTime = !!config.time && granularity === 'day';
  // Times chosen before a day is: the next pick takes them.
  const [draftTime, setDraftTime] = React.useState<{ start: string; end: string }>({ start: '', end: '' });
  // What is stored (and handed to onChange) may be an instant; inside, everything is the wall time a clock in `zone` shows.
  const [stored, setStored] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? null });
  const [zoneChoice, setZoneChoice] = useControllableState<string>({ value: config.timeZone, defaultValue: config.defaultTimeZone ?? '' });
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const [text, setText] = React.useState<string | null>(null);
  const [typedError, setTypedError] = React.useState<string | null>(null);
  const control = React.useRef<HTMLDivElement | null>(null);
  const textRef = React.useRef<HTMLInputElement | null>(null);
  const popup = React.useRef<HTMLDivElement | null>(null);
  const fromKeys = React.useRef(false);
  const mounted = useMounted();
  // The reader's own zone is only known in their browser: until mounted, UTC (as the server renders it).
  const zone = isTimeZone(zoneChoice) ? zoneChoice : mounted ? localTimeZone() : 'UTC';
  const valueFormat = config.valueFormat ?? 'wall';
  const zoned = withTime;
  const mapValue = (v: unknown, each: (x: string) => string): unknown =>
    typeof v === 'string' ? each(v) : v && typeof v === 'object' ? { start: each((v as CalendarRange).start), end: each((v as CalendarRange).end) } : v;
  const value = zoned ? mapValue(stored, (x) => (typeof x === 'string' ? valueToWall(x, zone) : x)) : stored;
  const disabled = !!config.disabled;
  const open = isOpen && !disabled;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ datepickerMeta, validateConfig }) => {
      for (const problem of validateConfig(datepickerMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveDatePickerOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `DatePicker: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'DatePicker: give it a `label`.');
  }

  const fmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        ...(granularity === 'month' ? { month: 'long', year: 'numeric' } : granularity === 'year' ? { year: 'numeric' } : { dateStyle: 'medium' }),
        ...(withTime ? { timeStyle: 'short', ...(config.hourCycle ? { hourCycle: config.hourCycle === 12 ? 'h12' : 'h23' } : {}) } : {}),
        ...config.formatOptions,
        timeZone: 'UTC',
      } as Intl.DateTimeFormatOptions),
    [config.locale, config.formatOptions, granularity, withTime, config.hourCycle],
  );
  const valid = (v: unknown) => typeof v === 'string' && !!parseIso(splitDateTime(v).date);
  const shown = (v: unknown): string => {
    if (!v) return '';
    if (range) {
      const r = v as CalendarRange;
      return valid(r.start) && valid(r.end) ? `${fmt.format(utc(r.start))} – ${fmt.format(utc(r.end))}` : '';
    }
    return valid(v) ? fmt.format(utc(v as string)) : '';
  };
  const message = typedError ?? field.message;
  const invalid = field.invalid || !!typedError;
  const state: DatePickerState = { mode: range ? 'range' : 'single', variant: config.variant ?? 'outline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, invalid, disabled };

  const setOpen = (next: boolean) => {
    if (next === open || (next && disabled)) return;
    setOpenState(next);
    config.onOpenChange?.(next);
  };
  const commit = (next: unknown, inZone = zone) => {
    const out = zoned ? mapValue(next, (x) => (typeof x === 'string' ? wallToValue(x, inZone, valueFormat) : x)) : next;
    setStored(out);
    setText(null);
    setTypedError(null);
    (config.onChange as ((v: unknown) => void) | undefined)?.(out);
  };
  const setZone = (next: string) => {
    if (next === zone) return;
    setZoneChoice(next);
    config.onTimeZoneChange?.(next);
    // An instant stays the same moment: only its offset form is rewritten. A wall time stays what the clock shows.
    if (valueFormat === 'offset' && value) commit(mapValue(value, (x) => convertWallTime(x, zone, next)), next);
  };
  // Typed text becomes a value when it reads as one, else it stays with a message.
  const settle = () => {
    if (text === null) return;
    const t = text.trim();
    if (!t) return commit(null);
    const day = (d: IsoDate) => (!config.min || d >= (granularity === 'day' ? config.min : config.min.slice(0, granularity === 'month' ? 7 : 4))) && (!config.max || d <= config.max) && !config.isDateDisabled?.(d, { mode: range ? 'range' : 'single', start: null }) && !dateBlocked(d, config.disabledDates, granularity === 'day' ? config.disabledWeekdays : undefined);
    const one = (part: string): string | null => {
      if (granularity !== 'day') {
        const d = parseTypedPeriod(part, granularity, config.locale);
        return d && day(d) ? d : null;
      }
      const dt = parseTypedDateTime(part, config.locale);
      if (!dt || !day(dt.date)) return null;
      return withTime ? `${dt.date}T${dt.time || '00:00'}` : dt.date;
    };
    if (range) {
      const [a, b] = t.split(/\s+(?:–|-|to)\s+|\s*–\s*/).map(one);
      if (a && b) return commit(a <= b ? { start: a, end: b } : { start: b, end: a });
    } else {
      const d = one(t);
      if (d) return commit(d);
    }
    const p = pattern(config.locale, granularity, withTime);
    setTypedError(config.labels?.invalid ?? `Enter a date like ${p}${range ? ' – ' + p : ''}.`);
  };

  useFloating({ open: open && mounted, anchor: () => control.current, floating: popup, placement: config.placement ?? 'bottom-start', offset: 6 });
  useOverlayLayer(
    open,
    (node) => !!control.current?.contains(node) || !!popup.current?.contains(node),
    () => {
      setOpen(false);
      textRef.current?.focus();
    },
    () => setOpen(false),
  );
  // Opened from the keyboard: focus goes into the calendar, onto the chosen day.
  useIsomorphicLayoutEffect(() => {
    if (!open || !fromKeys.current) return;
    fromKeys.current = false;
    popup.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();
  }, [open]);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        'data-mode': state.mode,
        'data-granularity': granularity,
        'data-time': dataAttr(withTime),
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-open': dataAttr(open),
        'data-filled': dataAttr(!!value),
        'data-time-zone': zoned && (config.showTimeZone || config.timeZone) ? zone : undefined,
        'data-invalid': dataAttr(invalid),
        'data-disabled': dataAttr(disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: DatePickerRootProps): React.ReactElement => {
    const cls = (...names: string[]) => (config.unstyled ? undefined : names.join(' '));
    const slot = (name: DatePickerSlot, content: React.ReactNode, tag: string, base: PropsBag = {}, shared?: string) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-datepicker__${name}`, ...(shared ? [shared] : [])), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('datepicker', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-datepicker pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const errorId = typedError ? field.errorId : undefined;
    const describedBy = [field.describedBy, typedError && !field.message ? field.errorId : undefined].filter(Boolean).join(' ') || undefined;
    const openLabel = config.labels?.open ?? (range ? 'Choose dates' : 'Choose a date');
    const canClear = !!config.clearable && !!value && !disabled;
    const hiddenValue = !stored ? '' : range ? `${(stored as CalendarRange).start}/${(stored as CalendarRange).end}` : (stored as string);
    const dayOf = (v: unknown) => (valid(v) ? splitDateTime(v as string).date : null);
    // A day without a time reads as midnight, as the field shows it.
    const timeOf = (v: unknown, which: 'start' | 'end') => (valid(v) ? splitDateTime(v as string).time.slice(0, 5) || '00:00' : draftTime[which] || '');
    const current = range ? (value as CalendarRange | null) : null;
    const dayValue = range ? (current && dayOf(current.start) && dayOf(current.end) ? { start: dayOf(current.start), end: dayOf(current.end) } : null) : dayOf(value);
    const withClock = (d: string, t: string) => (withTime ? `${d}T${t || '00:00'}` : d);
    const done = () => {
      setOpen(false);
      textRef.current?.focus();
    };
    const setTime = (which: 'start' | 'end', t: string) => {
      // Held inside the allowed hours.
      if (t && config.minTime && t < config.minTime) t = config.minTime;
      if (t && config.maxTime && t > config.maxTime) t = config.maxTime;
      setDraftTime((x) => ({ ...x, [which]: t }));
      if (!t) return;
      if (range) {
        if (current && valid(current.start) && valid(current.end)) commit({ ...current, [which]: withClock(splitDateTime(current[which]).date, t) });
      } else if (valid(value)) commit(withClock(splitDateTime(value as string).date, t));
    };
    const timeField = (which: 'start' | 'end', label: string) =>
      slot(
        'time',
        <>
          <span>{label}</span>
          {slot('timeInput', null, 'input', {
            type: 'time',
            step: (config.timeStep ?? 1) * 60,
            min: config.minTime,
            max: config.maxTime,
            value: timeOf(range ? current?.[which] : value, which),
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTime(which, e.target.value),
          })}
        </>,
        'label',
      );
    const footer = withTime ? (
      <div className={cls('pinfold-datepicker__times')}>
        {range ? (
          <>
            {timeField('start', config.labels?.startTime ?? 'Start time')}
            {timeField('end', config.labels?.endTime ?? 'End time')}
          </>
        ) : (
          timeField('start', config.labels?.time ?? 'Time')
        )}
        {config.showTimeZone
          ? slot(
              'timeZone',
              <>
                <span>{config.labels?.timeZone ?? 'Time zone'}</span>
                {slot(
                  'timeZoneSelect',
                  [...new Set([zone, ...(config.timeZones ?? timeZones())])].map((z) => (
                    <option key={z} value={z}>
                      {timeZoneLabel(z)}
                    </option>
                  )),
                  'select',
                  { value: zone, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setZone(e.target.value) },
                )}
              </>,
              'label',
            )
          : null}
        {slot('done', config.labels?.done ?? 'Done', 'button', { type: 'button', onClick: done })}
      </div>
    ) : undefined;
    const calendar = (
      <Calendar
        {...({
          mode: range ? 'range' : 'single',
          value: dayValue,
          onChange: (next: unknown) => {
            if (range) {
              const r = next as CalendarRange;
              commit({ start: withClock(r.start, timeOf(current?.start, 'start')), end: withClock(r.end, timeOf(current?.end, 'end')) });
            } else commit(withClock(next as string, timeOf(value, 'start')));
            if (!withTime) done();
          },
          min: config.min,
          max: config.max,
          isDateDisabled: config.isDateDisabled,
          disabledDates: config.disabledDates,
          disabledWeekdays: config.disabledWeekdays,
          granularity,
          captionLayout: config.captionLayout,
          yearRange: config.yearRange,
          showWeekNumbers: config.showWeekNumbers,
          dayContent: config.dayContent,
          presets: config.presets,
          minDays: config.minDays,
          maxDays: config.maxDays,
          allowDisabledInRange: config.allowDisabledInRange,
          onRangeStart: config.onRangeStart,
          locale: config.locale,
          weekStart: config.weekStart,
          months: config.months,
          showToday: config.showToday,
          footer,
          size: state.size,
          tone: state.tone,
          label: typeof config.label === 'string' ? config.label : undefined,
        } as object)}
      />
    );
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'label', { id: field.labelId, htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) }, 'pinfold-field__label')}
        {slot(
          'control',
          <>
            {slot('input', null, 'input', {
              ref: textRef,
              id: field.controlId,
              type: 'text',
              inputMode: granularity === 'day' && !withTime ? 'numeric' : 'text',
              autoComplete: 'off',
              placeholder: config.placeholder ?? (range ? `${pattern(config.locale, granularity, withTime)} – ${pattern(config.locale, granularity, withTime)}` : pattern(config.locale, granularity, withTime)),
              value: text ?? shown(value),
              required: config.required || undefined,
              disabled: disabled || undefined,
              'aria-invalid': invalid || undefined,
              'aria-describedby': describedBy,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setText(event.target.value);
                setTypedError(null);
              },
              onBlur: settle,
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  settle();
                } else if (event.key === 'ArrowDown' && (event.altKey || !open)) {
                  event.preventDefault();
                  fromKeys.current = true;
                  setOpen(true);
                }
              },
              onInvalid: field.onInvalid,
            })}
            {canClear
              ? slot('clear', CLOSE_ICON, 'button', {
                  type: 'button',
                  tabIndex: -1,
                  'aria-label': config.labels?.clear ?? 'Clear',
                  title: config.labels?.clear ?? 'Clear',
                  onClick: () => {
                    commit(null);
                    textRef.current?.focus();
                  },
                })
              : null}
            {slot('trigger', CALENDAR_ICON, 'button', {
              type: 'button',
              'aria-label': openLabel,
              title: openLabel,
              'aria-haspopup': 'dialog',
              'aria-expanded': open,
              disabled: disabled || undefined,
              onClick: (event: React.MouseEvent) => {
                // A click from the keyboard (Enter, Space) moves focus into the calendar.
                fromKeys.current = event.detail === 0;
                setOpen(!open);
              },
            })}
          </>,
          'div',
          { ref: control },
        )}
        {config.name ? <input type="hidden" name={config.name} value={hiddenValue} /> : null}
        {open && mounted ? slot('popup', calendar, 'div', { ref: popup, role: 'dialog', 'aria-labelledby': field.labelId, 'data-size': state.size }) : null}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }, 'pinfold-field__description') : null}
        {message ? slot('error', message, 'div', { id: errorId ?? field.errorId }, 'pinfold-field__error') : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: DatePickerApi = { isOpen: open, open: () => setOpen(true), close: () => setOpen(false), focus: () => textRef.current?.focus(), getRootProps, render };
  return usePinfoldComponent<DatePickerApi, DatePickerRootProps>('DatePicker', api, (props) => render(props));
}
