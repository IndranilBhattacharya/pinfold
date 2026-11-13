import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveOtpOptions, mergeProps, otpBreaks, otpSanitize, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderFieldMessages, useField, validationAttrs } from '../field';
import type { OtpApi, OtpComponent, OtpConfig, OtpRootProps, OtpSlot, OtpState } from './types';

/**
 * A verification code in separate boxes, as a hook that hands back a component. One native input
 * lies over the boxes and holds the code, so typing, paste, SMS autofill, password managers, forms
 * and screen readers all work on a single field; the boxes are drawn from its value.
 *
 *   const Code = useOtp({ label: 'Verification code', name: 'code', onComplete: verify });
 *   return <Code />;
 *
 * Precedence: this config, then `defaults.otp`, then the provider (size), then the library default.
 */
export function useOtp(input: OtpConfig): OtpComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.otp ? mergeConfig<OtpConfig>(ctx.defaults.otp, input) : input;
  const node = React.useRef<HTMLInputElement | null>(null);
  const length = Math.max(1, Math.floor(config.length ?? 6));
  const kind = config.type ?? 'numeric';
  const [raw, setRaw] = useControllableState<string>({ value: config.value, defaultValue: config.defaultValue ?? '' });
  const value = otpSanitize(raw, kind, length);
  const current = React.useRef(value);
  current.current = value;
  const field = useField(config, { control: () => node.current, value: () => current.current });
  const [focused, setFocused] = React.useState(false);
  // The box just typed into pops; a code there from the start loads still.
  const [fresh, setFresh] = React.useState(-1);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ otpMeta, validateConfig }) => {
      for (const problem of validateConfig(otpMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveOtpOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Otp: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Otp: give it a `label`, e.g. "Verification code" (`hideLabel` keeps it for screen readers only).');
  }

  // A form reset: the input is controlled, so the code goes back to its default here.
  React.useEffect(() => {
    const form = node.current?.form;
    if (!form) return;
    const onReset = () => setRaw(config.defaultValue ?? '');
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, []);

  const complete = value.length === length;
  const state: OtpState = { value, complete, variant: config.variant ?? 'outline', size: config.size ?? ctx.size, invalid: field.invalid, focused, status: field.status, validating: field.validating };
  // Typing always goes at the end: the caret is kept there, so the boxes fill in order.
  const toEnd = () => {
    const el = node.current;
    if (el && document.activeElement === el) el.setSelectionRange(el.value.length, el.value.length);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    // A whole code pasted or autofilled over a partly typed one replaces it, rather than topping it up.
    const added = otpSanitize(raw.startsWith(value) ? raw.slice(value.length) : raw, kind, length);
    const next = added.length === length ? added : otpSanitize(raw, kind, length);
    if (raw !== next) event.target.value = next;
    setFresh(next.length > value.length ? next.length - 1 : -1);
    current.current = next;
    setRaw(next);
    field.revalidate(event.target);
    config.onChange?.(next, event);
    if (next.length === length && value.length !== length) config.onComplete?.(next);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-complete': dataAttr(complete),
        'data-focused': dataAttr(focused),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        ...validationAttrs(field),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: OtpRootProps): React.ReactElement => {
    const shared: Partial<Record<OtpSlot, string>> = { label: 'pinfold-field__label', description: 'pinfold-field__description', error: 'pinfold-field__error', statusIcon: 'pinfold-field__icon', validating: 'pinfold-field__validating' };
    const slot = (name: OtpSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : cn(`pinfold-otp__${name}`, shared[name]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('otp', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-otp pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const breaks = otpBreaks(length, config.groups);
    const at = Math.min(value.length, length - 1);
    const boxes: React.ReactNode[] = [];
    let group = 0;
    for (let i = 0; i < length; i++) {
      if (breaks.has(i)) {
        const sep = config.separator;
        boxes.push(<React.Fragment key={`s${i}`}>{slot('separator', typeof sep === 'function' ? sep(group++) : sep ?? '–', 'span')}</React.Fragment>);
      }
      const char = value[i];
      const active = focused && i === at;
      boxes.push(
        <React.Fragment key={i}>
          {slot('slot', char ? (config.mask ? config.maskChar ?? '•' : char) : active ? slot('caret', null, 'span') : filled(config.placeholder) ? <span className={config.unstyled ? undefined : 'pinfold-otp__placeholder'}>{config.placeholder}</span> : null, 'span', {
            'data-filled': dataAttr(!!char),
            'data-active': dataAttr(active),
            'data-new': dataAttr(i === fresh && !!char),
          })}
        </React.Fragment>,
      );
    }
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'label', { htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) })}
        {slot(
          'control',
          <>
            {slot('slots', boxes, 'span', { 'aria-hidden': true })}
            {slot('input', null, 'input', {
              ref: node,
              id: field.controlId,
              name: config.name,
              type: config.mask ? 'password' : 'text',
              inputMode: kind === 'numeric' ? 'numeric' : 'text',
              autoComplete: 'one-time-code',
              autoCapitalize: 'characters',
              autoCorrect: 'off',
              spellCheck: false,
              pattern: kind === 'numeric' ? `\\d{${length}}` : `[0-9A-Za-z]{${length}}`,
              required: config.required || undefined,
              disabled: config.disabled || undefined,
              value,
              'aria-invalid': field.invalid || undefined,
              'aria-describedby': field.describedBy,
              'aria-busy': field.validating || undefined,
              onChange,
              onKeyDown: config.onKeyDown,
              onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => {
                // Cancel it with `event.preventDefault()`.
                config.onPaste?.(event.clipboardData?.getData('text') ?? '', event);
              },
              onInvalid: field.onInvalid,
              onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
                setFocused(true);
                config.onFocus?.(event);
                requestAnimationFrame(toEnd);
              },
              onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                setFocused(false);
                field.onBlur(event.currentTarget);
                config.onBlur?.(event);
              },
              onSelect: toEnd,
            })}
          </>,
          'div',
        )}
        {renderFieldMessages(field, config.description, (n, c, t, b) => slot(n as OtpSlot, c, t, b))}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: OtpApi = {
    value,
    clear: () => {
      setRaw('');
      node.current?.focus();
    },
    focus: () => node.current?.focus(),
    ...field.api,
    getRootProps,
    render,
  };
  return usePinfoldComponent<OtpApi, OtpRootProps>('Otp', api, (props) => render(props));
}
