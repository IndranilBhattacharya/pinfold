import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveNumberOptions, mergeProps, stepValue, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderFieldMessages, useField, validationAttrs } from '../field';
import type { NumberFieldApi, NumberFieldComponent, NumberFieldConfig, NumberFieldRootProps, NumberFieldSlot, NumberFieldState } from './types';

const MINUS = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false">
    <path d="M3.5 8h9" />
  </svg>
);
const PLUS = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false">
    <path d="M3.5 8h9M8 3.5v9" />
  </svg>
);
/** Press and hold: one step at once, then a pause, then a steady repeat. */
const HOLD_DELAY = 400;
const HOLD_EVERY = 60;

const parse = (text: string): number | null => (text.trim() === '' || Number.isNaN(Number(text)) ? null : Number(text));

/**
 * A number with − and + buttons, as a hook that hands back a component. The native number input
 * holds the value, so forms submit, reset and validate it unaided.
 *
 *   const Quantity = useNumberField({ label: 'Quantity', name: 'qty', min: 1, max: 99, defaultValue: 1 });
 *   return <Quantity />;
 *
 * Precedence: this config, then `defaults.number`, then the provider (size), then the library default.
 */
export function useNumberField(input: NumberFieldConfig): NumberFieldComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.number ? mergeConfig<NumberFieldConfig>(ctx.defaults.number, input) : input;
  const node = React.useRef<HTMLInputElement | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controlled = config.value !== undefined;
  const [own, setOwn] = React.useState<number | null>(config.defaultValue ?? null);
  const value = controlled ? config.value ?? null : own;
  const latest = React.useRef(value);
  latest.current = value;
  const field = useField(config, { control: () => node.current, value: () => latest.current });
  // The value last handed to `onValueCommit` (or found on focus).
  const committed = React.useRef<number | null>(value);
  const commitNow = () => {
    if (Object.is(latest.current, committed.current)) return;
    committed.current = latest.current;
    config.onValueCommit?.(latest.current);
  };
  const step = config.step && config.step > 0 ? config.step : 1;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ numberMeta, validateConfig }) => {
      for (const problem of validateConfig(numberMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveNumberOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `NumberField: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'NumberField: give it a `label` (`hideLabel` keeps it for screen readers only).');
  }

  React.useEffect(() => () => clearTimeout(timer.current), []);
  // A form reset puts the native value back; the buttons' limits follow it.
  React.useEffect(() => {
    const form = node.current?.form;
    if (!form) return;
    const onReset = () => setTimeout(() => setOwn(parse(node.current?.value ?? '')));
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, []);

  const locked = !!config.disabled || !!config.readOnly;
  const atMin = config.min !== undefined && value !== null && value <= config.min;
  const atMax = config.max !== undefined && value !== null && value >= config.max;
  const state: NumberFieldState = { value, variant: config.variant ?? 'outline', size: config.size ?? ctx.size, invalid: field.invalid, disabled: !!config.disabled, readOnly: !!config.readOnly, status: field.status, validating: field.validating };
  const content_ = (c: NumberFieldConfig['startContent']) => (typeof c === 'function' ? c(state) : c);

  const commit = (next: number | null) => {
    const el = node.current;
    if (el && !controlled) el.value = next === null ? '' : String(next);
    if (!controlled) setOwn(next);
    if (el) field.revalidate(el);
    config.onChange?.(next);
  };
  const bump = (direction: 1 | -1) => {
    if (locked) return false;
    const now = latest.current;
    const next = stepValue(now, direction, step, config.min, config.max);
    if (next === now) return false;
    latest.current = next;
    commit(next);
    return true;
  };
  const stop = () => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    // A press of a stepper ends: the value is settled.
    commitNow();
  };
  const hold = (direction: 1 | -1) => (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    // Keep focus in the field, where the arrow keys also work.
    event.preventDefault();
    node.current?.focus();
    if (!bump(direction)) return;
    timer.current = undefined;
    const repeat = () => {
      if (bump(direction)) timer.current = setTimeout(repeat, HOLD_EVERY);
    };
    timer.current = setTimeout(repeat, HOLD_DELAY);
  };
  // A click without a pointer press (a screen reader's, or a test's) steps once.
  const click = (direction: 1 | -1) => (event: React.MouseEvent) => {
    if (event.detail === 0 && bump(direction)) commitNow();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-steppers': config.steppers ?? 'split',
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-readonly': dataAttr(config.readOnly),
        ...validationAttrs(field),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: NumberFieldRootProps): React.ReactElement => {
    const shared: Partial<Record<NumberFieldSlot, string>> = { label: 'pinfold-field__label', description: 'pinfold-field__description', error: 'pinfold-field__error', statusIcon: 'pinfold-field__icon', validating: 'pinfold-field__validating' };
    const slot = (name: NumberFieldSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : cn(`pinfold-number__${name}`, shared[name]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('number', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-number pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const steppers = config.steppers ?? 'split';
    const button = (name: 'decrement' | 'increment', direction: 1 | -1, off: boolean) => {
      const label = direction > 0 ? config.incrementLabel ?? 'Increase' : config.decrementLabel ?? 'Decrease';
      return slot(name, direction > 0 ? config.incrementIcon ?? PLUS : config.decrementIcon ?? MINUS, 'button', {
        type: 'button',
        tabIndex: -1,
        'aria-label': label,
        'aria-controls': field.controlId,
        title: label,
        disabled: locked || off || undefined,
        onPointerDown: hold(direction),
        onPointerUp: stop,
        onPointerLeave: stop,
        onPointerCancel: stop,
        onClick: click(direction),
      });
    };
    const text = slot('input', null, 'input', {
      ref: node,
      type: 'number',
      id: field.controlId,
      name: config.name,
      inputMode: 'decimal',
      min: config.min,
      max: config.max,
      step,
      required: config.required || undefined,
      disabled: config.disabled || undefined,
      readOnly: config.readOnly || undefined,
      placeholder: config.placeholder,
      'aria-invalid': field.invalid || undefined,
      'aria-describedby': field.describedBy,
      'aria-busy': field.validating || undefined,
      onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
        committed.current = latest.current;
        config.onFocus?.(event);
      },
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        commitNow();
        field.onBlur(event.currentTarget);
        config.onBlur?.(event);
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
        config.onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === 'Enter') commitNow();
      },
      onKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Arrow keys and Page keys step natively; releasing one settles the value.
        if (/^(Arrow(Up|Down)|Page(Up|Down))$/.test(event.key)) commitNow();
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = parse(event.target.value);
        latest.current = next;
        if (!controlled) setOwn(next);
        field.revalidate(event.target);
        config.onChange?.(next, event);
      },
      onInvalid: field.onInvalid,
      ...(controlled ? { value: value === null ? '' : value } : { defaultValue: config.defaultValue }),
    });
    const start = content_(config.startContent);
    const end = content_(config.endContent);
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'label', { htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) })}
        {slot(
          'control',
          <>
            {steppers === 'split' ? button('decrement', -1, atMin) : null}
            {filled(start) ? slot('startContent', start, 'span') : null}
            {text}
            {field.validating ? slot('validating', null, 'span', { 'aria-hidden': true }) : null}
            {filled(end) ? slot('endContent', end, 'span') : null}
            {steppers === 'split' ? button('increment', 1, atMax) : null}
            {steppers === 'end' ? (
              <>
                {button('decrement', -1, atMin)}
                {button('increment', 1, atMax)}
              </>
            ) : null}
          </>,
          'div',
        )}
        {renderFieldMessages(field, config.description, (n, c, t, b) => slot(n as NumberFieldSlot, c, t, b), true)}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: NumberFieldApi = { value, step: (d) => void bump(d), ...field.api, focus: () => node.current?.focus(), getRootProps, render };
  return usePinfoldComponent<NumberFieldApi, NumberFieldRootProps>('NumberField', api, (props) => render(props));
}
