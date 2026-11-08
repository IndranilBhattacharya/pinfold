import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveDatePickerOptions, mergeProps, orderRange, parseIso, parseTypedDate, warnOnce, type IsoDate, type PropsBag } from '@pinfold/core';
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
const utc = (d: IsoDate) => {
  const p = parseIso(d)!;
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
};

/** "dd/mm/yyyy" in the locale's order and separators. */
function pattern(locale?: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(Date.UTC(2026, 10, 22)))
    .map((p) => (p.type === 'day' ? 'dd' : p.type === 'month' ? 'mm' : p.type === 'year' ? 'yyyy' : p.value))
    .join('');
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
  const [value, setValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? null });
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const [text, setText] = React.useState<string | null>(null);
  const [typedError, setTypedError] = React.useState<string | null>(null);
  const control = React.useRef<HTMLDivElement | null>(null);
  const textRef = React.useRef<HTMLInputElement | null>(null);
  const popup = React.useRef<HTMLDivElement | null>(null);
  const fromKeys = React.useRef(false);
  const mounted = useMounted();
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

  const fmt = React.useMemo(() => new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', ...config.formatOptions, timeZone: 'UTC' }), [config.locale, config.formatOptions]);
  const shown = (v: unknown): string => {
    if (!v) return '';
    if (range) {
      const r = v as CalendarRange;
      return r.start && r.end ? `${fmt.format(utc(r.start))} – ${fmt.format(utc(r.end))}` : '';
    }
    return parseIso(v as string) ? fmt.format(utc(v as IsoDate)) : '';
  };
  const message = typedError ?? field.message;
  const invalid = field.invalid || !!typedError;
  const state: DatePickerState = { mode: range ? 'range' : 'single', variant: config.variant ?? 'outline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, invalid, disabled };

  const setOpen = (next: boolean) => {
    if (next === open || (next && disabled)) return;
    setOpenState(next);
    config.onOpenChange?.(next);
  };
  const commit = (next: unknown) => {
    setValue(next);
    setText(null);
    setTypedError(null);
    (config.onChange as ((v: unknown) => void) | undefined)?.(next);
  };
  // Typed text becomes a value when it reads as one, else it stays with a message.
  const settle = () => {
    if (text === null) return;
    const t = text.trim();
    if (!t) return commit(null);
    const ok = (d: IsoDate | null) => !!d && (!config.min || d >= config.min) && (!config.max || d <= config.max) && !config.isDateDisabled?.(d);
    if (range) {
      const [a, b] = t.split(/\s+(?:–|-|to)\s+|\s*–\s*/).map((part) => parseTypedDate(part, config.locale));
      if (ok(a) && ok(b)) return commit(orderRange(a!, b!));
    } else {
      const d = parseTypedDate(t, config.locale);
      if (ok(d)) return commit(d);
    }
    setTypedError(config.labels?.invalid ?? `Enter a date like ${pattern(config.locale)}${range ? ' – ' + pattern(config.locale) : ''}.`);
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
        ref: field.root,
        'data-mode': state.mode,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-open': dataAttr(open),
        'data-filled': dataAttr(!!value),
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
    const hiddenValue = !value ? '' : range ? `${(value as CalendarRange).start}/${(value as CalendarRange).end}` : (value as string);
    const calendar = (
      <Calendar
        {...({
          mode: range ? 'range' : 'single',
          value: value ?? null,
          onChange: (next: unknown) => {
            commit(next);
            setOpen(false);
            textRef.current?.focus();
          },
          min: config.min,
          max: config.max,
          isDateDisabled: config.isDateDisabled,
          locale: config.locale,
          weekStart: config.weekStart,
          months: config.months,
          showToday: config.showToday,
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
              inputMode: 'numeric',
              autoComplete: 'off',
              placeholder: config.placeholder ?? (range ? `${pattern(config.locale)} – ${pattern(config.locale)}` : pattern(config.locale)),
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
