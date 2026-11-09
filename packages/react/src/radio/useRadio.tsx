import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderChoice, useField } from '../field';
import type { RadioApi, RadioComponent, RadioConfig, RadioRootProps, RadioSlot, RadioState } from './types';

/**
 * One choice from a list: native radios in a named group, as a hook that hands back a component.
 *
 *   const Plan = useRadio({ label: 'Plan', name: 'plan', items: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }] });
 *   return <Plan />;
 *
 * Precedence: this config, then `defaults.radio`, then the provider (size, tone), then the library default.
 */
export function useRadio(input: RadioConfig): RadioComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.radio ? mergeConfig<RadioConfig>(ctx.defaults.radio, input) : input;
  const field = useField(config);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ radioMeta, validateConfig }) => {
      for (const problem of validateConfig(radioMeta, input)) warnOnce(true, problem.message);
    });
    warnOnce(!filled(config.label), 'Radio: give the group a `label` (`hideLabel` keeps it for screen readers only).');
  }

  const state: RadioState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, invalid: field.invalid };
  // Native arrow keys and "one of many" need one name; without it each radio stands alone.
  const name = config.name ?? `${field.base}-group`;

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        role: 'radiogroup',
        disabled: config.disabled || undefined,
        'aria-describedby': field.describedBy,
        'aria-invalid': field.invalid || undefined,
        'aria-required': config.required || undefined,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-variant': config.variant ?? 'plain',
        'data-orientation': config.orientation ?? 'vertical',
        'data-animate': ctx.disableAnimation || config.animation === 'none' ? undefined : config.animation ?? 'spring',
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const radios = () => Array.from(field.root.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []);

  const render = (rootProps?: RadioRootProps): React.ReactElement => {
    const shared: Partial<Record<RadioSlot, string>> = {
      label: 'pinfold-field__label',
      description: 'pinfold-field__description',
      error: 'pinfold-field__error',
      items: 'pinfold-choice__items',
      item: 'pinfold-choice__item',
      input: 'pinfold-choice__input',
      box: 'pinfold-choice__box',
      itemDescription: 'pinfold-choice__description',
    };
    const slot = (slotName: string, content: React.ReactNode, tag: string, base: PropsBag = {}) => {
      const key = slotName as RadioSlot;
      return renderSlot(config, key, slotProps(config, key, { className: config.unstyled ? undefined : cn(`pinfold-radio__${slotName}`, shared[key]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    };
    const vars = dimensionVars('radio', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-radio pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const onInput = (event: React.ChangeEvent<HTMLInputElement>) => {
      for (const radio of radios()) field.revalidate(radio);
      config.onChange?.(event.target.value, event);
    };
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'legend', hiddenStyle(config.hideLabel))}
        {slot(
          'items',
          (config.items ?? []).map((row, i) => (
            <React.Fragment key={row.value}>
              {renderChoice({
                slot,
                id: `${field.base}-${i}`,
                row,
                indicator: null,
                input: {
                  type: 'radio',
                  name,
                  value: row.value,
                  required: config.required || undefined,
                  onChange: onInput,
                  onInvalid: field.onInvalid,
                  ...(config.value !== undefined ? { checked: config.value === row.value } : { defaultChecked: config.defaultValue === row.value }),
                },
              })}
            </React.Fragment>
          )),
          'div',
        )}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }) : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <fieldset {...p}>{c}</fieldset>) as React.ReactElement;
  };

  const api: RadioApi = {
    focus: () => {
      const all = radios();
      (all.find((radio) => radio.checked) ?? all[0])?.focus();
    },
    getRootProps,
    render,
  };
  return usePinfoldComponent<RadioApi, RadioRootProps>('Radio', api, (props) => render(props));
}
