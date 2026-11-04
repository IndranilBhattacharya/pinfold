import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveInputOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, useField } from '../field';
import { Button } from '../button/Button';
import { CLOSE_ICON } from '../icons';
import type { InputApi, InputComponent, InputConfig, InputElement, InputRootProps, InputSlot, InputState } from './types';

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
  const field = useField(config);
  const node = React.useRef<InputElement | null>(null);
  const controlled = config.value !== undefined;
  const [uncontrolledFilled, setFilled] = React.useState(() => !!config.defaultValue);
  const hasValue = controlled ? config.value !== '' : uncontrolledFilled;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ inputMeta, validateConfig }) => {
      for (const problem of validateConfig(inputMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveInputOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Input: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Input: give it a `label` (`hideLabel` keeps it for screen readers only). A placeholder is not a name.');
  }

  const state: InputState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, invalid: field.invalid, disabled: !!config.disabled, hasValue };

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
        fit();
      });
    };
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  });

  const onChange = (event: React.ChangeEvent<InputElement>) => {
    setFilled(event.target.value !== '');
    field.revalidate(event.target);
    fit();
    config.onChange?.(event.target.value, event);
  };
  const clear = () => {
    const el = node.current;
    if (el && !controlled) el.value = '';
    setFilled(false);
    if (el) field.revalidate(el);
    fit();
    config.onChange?.('');
    el?.focus();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: field.root,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-readonly': dataAttr(config.readOnly),
        'data-multiline': dataAttr(config.multiline),
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
      placeholder: config.placeholder,
      autoComplete: config.autoComplete,
      inputMode: config.inputMode,
      maxLength: config.maxLength,
      minLength: config.minLength,
      'aria-invalid': field.invalid || undefined,
      'aria-describedby': field.describedBy,
      onChange,
      onInvalid: field.onInvalid,
      ...(controlled ? { value: config.value } : { defaultValue: config.defaultValue }),
      ...(config.multiline ? { rows: config.rows ?? 3 } : { type: config.type ?? 'text', pattern: config.pattern }),
    };
    const canClear = config.clearable && hasValue && !config.disabled && !config.readOnly;
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'label', { htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) }, 'pinfold-field__label')}
        {slot(
          'control',
          <>
            {filled(config.startContent) ? slot('startContent', config.startContent, 'span') : null}
            {slot('input', null, config.multiline ? 'textarea' : 'input', control)}
            {canClear ? slot('clear', <Button label={config.clearLabel ?? 'Clear'} icon={CLOSE_ICON} iconOnly variant="ghost" tone="neutral" size="sm" onClick={clear} />, 'span') : null}
            {filled(config.endContent) ? slot('endContent', config.endContent, 'span') : null}
          </>,
          'div',
        )}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }, 'pinfold-field__description') : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }, 'pinfold-field__error') : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: InputApi = { focus: () => node.current?.focus(), clear, getRootProps, render };
  return usePinfoldComponent<InputApi, InputRootProps>('Input', api, (props) => render(props));
}
