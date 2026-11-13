import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveInputOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderFieldMessages, useField, validationAttrs } from '../field';
import { Button } from '../button/Button';
import { CLOSE_ICON } from '../icons';
import { VISUALLY_HIDDEN } from '../a11y';
import type { InputApi, InputComponent, InputConfig, InputElement, InputRootProps, InputSlot, InputState } from './types';

const GRIP = (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" focusable="false">
    <path d="M10.5 4.5l-6 6M10.5 8.5l-2 2" />
  </svg>
);

const eye = (open: boolean) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {open ? null : <path d="M3 3l18 18" />}
  </svg>
);

const SHARED: Record<string, string> = { description: 'pinfold-field__description', error: 'pinfold-field__error', statusIcon: 'pinfold-field__icon', validating: 'pinfold-field__validating' };

/**
 * A text field with its label, help text and error wired up, as a hook that hands back a component.
 *
 *   const Email = useInput({ label: 'Work email', type: 'email', name: 'email', required: true });
 *   return <Email />;
 *
 * The same value is the controller (`Email.focus()`, `.clear()`). Precedence: this config, then
 * `defaults.input`, then the provider (size), then the library default.
 */
export function useInput(input: InputConfig): InputComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.input ? mergeConfig<InputConfig>(ctx.defaults.input, input) : input;
  const node = React.useRef<InputElement | null>(null);
  const field = useField(config, { control: () => node.current });
  const minHeight = React.useRef(0);
  const controlled = config.value !== undefined;
  const [uncontrolledFilled, setFilled] = React.useState(() => !!config.defaultValue);
  const hasValue = controlled ? config.value !== '' : uncontrolledFilled;
  const inside = config.labelPlacement === 'inside' && !config.hideLabel;
  const handle = !!config.multiline && !config.autosize && config.resize !== 'none';
  const reveal = !!config.revealable && !config.multiline && config.type === 'password';
  const [revealed, setRevealed] = React.useState(false);
  const [typedLength, setLength] = React.useState(() => (config.defaultValue ?? '').length);
  const length = controlled ? (config.value ?? '').length : typedLength;
  // Read the count once typing pauses, not on every key.
  const [spoken, setSpoken] = React.useState('');
  const speakTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(speakTimer.current), []);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ inputMeta, validateConfig }) => {
      for (const problem of validateConfig(inputMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveInputOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Input: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Input: give it a `label` (`hideLabel` keeps it for screen readers only). A placeholder is not a name.');
  }

  const state: InputState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, invalid: field.invalid, disabled: !!config.disabled, hasValue, labelPlacement: inside ? 'inside' : 'outside', status: field.status, validating: field.validating, readOnly: !!config.readOnly };
  const node_ = (content: InputConfig['startContent']) => (typeof content === 'function' ? content(state) : content);

  const fit = () => {
    const el = node.current;
    if (!el || !config.multiline || !config.autosize) return;
    // Measure from auto, so it shrinks too. scrollHeight has no borders in it.
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  };
  useIsomorphicLayoutEffect(fit, [config.value, config.multiline, config.autosize]);

  // The native value goes back on a form reset; what we derive from it has to follow.
  React.useEffect(() => {
    const form = node.current?.form;
    if (!form) return;
    const onReset = () => {
      // After the reset has applied.
      setTimeout(() => {
        setFilled(!!node.current?.value);
        setLength(node.current?.value.length ?? 0);
        fit();
      });
    };
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  });

  const onChange = (event: React.ChangeEvent<InputElement>) => {
    setFilled(event.target.value !== '');
    setLength(event.target.value.length);
    if (config.showCount && config.maxLength !== undefined) {
      const left = config.maxLength - event.target.value.length;
      clearTimeout(speakTimer.current);
      speakTimer.current = setTimeout(() => setSpoken(config.countLabel ? config.countLabel(left) : `${left} character${left === 1 ? '' : 's'} left`), 800);
    }
    field.revalidate(event.target);
    fit();
    config.onChange?.(event.target.value, event);
  };
  const clear = () => {
    const el = node.current;
    if (el && !controlled) el.value = '';
    setFilled(false);
    setLength(0);
    if (el) field.revalidate(el);
    fit();
    config.onChange?.('');
    config.onClear?.();
    el?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent<InputElement>) => {
    config.onKeyDown?.(event);
    // Enter submits a one-line field's form natively; a multiline one takes Ctrl or Cmd with it.
    if (event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    if (config.multiline && !(event.ctrlKey || event.metaKey)) return;
    config.onEnter?.(event.currentTarget.value, event);
  };

  // The corner handle: drag to set the height, never below the height `rows` gives. The pointer is
  // captured, so the drag keeps going outside the field. A keyboard resizes nothing natively either;
  // `autosize` is the way to fit long text without a pointer.
  const startResize = (event: React.PointerEvent<HTMLElement>) => {
    const el = node.current;
    if (!el || event.button !== 0) return;
    event.preventDefault();
    if (!minHeight.current) minHeight.current = el.offsetHeight;
    const target = event.currentTarget;
    const from = event.clientY;
    const start = el.offsetHeight;
    const move = (e: PointerEvent) => {
      el.style.height = `${Math.max(minHeight.current, start + e.clientY - from)}px`;
    };
    const stop = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', stop);
      target.removeEventListener('pointercancel', stop);
    };
    target.setPointerCapture?.(event.pointerId);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', stop);
    target.addEventListener('pointercancel', stop);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: field.root,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-label-placement': state.labelPlacement,
        'data-filled': dataAttr(hasValue),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-readonly': dataAttr(config.readOnly),
        'data-multiline': dataAttr(config.multiline),
        ...validationAttrs(field),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: InputRootProps): React.ReactElement => {
    const cls = (...names: string[]) => (config.unstyled ? undefined : names.join(' '));
    const slot = (name: InputSlot, content: React.ReactNode, tag: string, base: PropsBag = {}, shared?: string) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-input__${name}`, ...(shared ? [shared] : [])), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('input', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-input pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const control: PropsBag = {
      ref: node,
      id: field.controlId,
      name: config.name,
      required: config.required || undefined,
      disabled: config.disabled || undefined,
      readOnly: config.readOnly || undefined,
      // Inside, a blank placeholder lets CSS see an empty field (`:placeholder-shown`), autofill included.
      placeholder: config.placeholder ?? (inside ? ' ' : undefined),
      autoComplete: config.autoComplete,
      inputMode: config.inputMode,
      maxLength: config.maxLength,
      minLength: config.minLength,
      'aria-invalid': field.invalid || undefined,
      'aria-describedby': field.describedBy,
      'aria-busy': field.validating || undefined,
      onChange,
      onKeyDown,
      onFocus: config.onFocus,
      onBlur: (event: React.FocusEvent<InputElement>) => {
        field.onBlur(event.currentTarget);
        config.onBlur?.(event);
      },
      onInvalid: field.onInvalid,
      ...(controlled ? { value: config.value } : { defaultValue: config.defaultValue }),
      ...(config.multiline ? { rows: config.rows ?? 3 } : { type: reveal && revealed ? 'text' : (config.type ?? 'text'), pattern: config.pattern }),
    };
    const start = node_(config.startContent);
    const end = node_(config.endContent);
    const canClear = config.clearable && hasValue && !config.disabled && !config.readOnly;
    const label = slot('label', labelContent(config, config.unstyled), 'label', { htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) }, 'pinfold-field__label');
    const text = slot('input', null, config.multiline ? 'textarea' : 'input', control);
    const content = (
      <>
        {inside ? null : label}
        {slot(
          'control',
          <>
            {filled(start) ? slot('startContent', start, 'span') : null}
            {/* Inside, the label follows the input in the DOM so CSS can lift it on the input's state. */}
            {inside ? slot('field', <>{text}{label}</>, 'span') : text}
            {canClear ? slot('clear', <Button label={config.clearLabel ?? 'Clear'} icon={config.clearIcon ?? CLOSE_ICON} iconOnly variant="ghost" tone="neutral" size="sm" onClick={clear} />, 'span') : null}
            {reveal
              ? slot('reveal', <Button label={config.revealLabel ?? 'Show password'} icon={eye(!revealed)} iconOnly variant="ghost" tone="neutral" size="sm" disabled={config.disabled} aria-pressed={revealed} onClick={() => setRevealed((r) => !r)} />, 'span')
              : null}
            {field.validating ? slot('validating', null, 'span', { 'aria-hidden': true }, 'pinfold-field__validating') : null}
            {filled(end) ? slot('endContent', end, 'span') : null}
            {handle ? slot('handle', config.resizeIcon ?? GRIP, 'span', { 'aria-hidden': true, onPointerDown: startResize }) : null}
          </>,
          'div',
        )}
        {renderFieldMessages(field, config.description, (n, c, t, b) => slot(n as InputSlot, c, t, b, SHARED[n]), true)}
        {config.showCount
          ? slot(
              'counter',
              <>
                <span aria-hidden="true">{config.maxLength !== undefined ? `${length}/${config.maxLength}` : length}</span>
                <span role="status" style={VISUALLY_HIDDEN}>
                  {spoken}
                </span>
              </>,
              'div',
              { 'data-near': dataAttr(config.maxLength !== undefined && length >= config.maxLength * 0.9 && length < config.maxLength), 'data-full': dataAttr(config.maxLength !== undefined && length >= config.maxLength) },
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: InputApi = { focus: () => node.current?.focus(), clear, ...field.api, getRootProps, render };
  return usePinfoldComponent<InputApi, InputRootProps>('Input', api, (props) => render(props));
}
