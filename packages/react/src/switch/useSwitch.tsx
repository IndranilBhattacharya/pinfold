import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, labelContent, renderChoice, useField } from '../field';
import type { SwitchApi, SwitchComponent, SwitchConfig, SwitchRootProps, SwitchSlot, SwitchState } from './types';

/**
 * An on/off setting, a native checkbox with `role="switch"`, as a hook that hands back a component.
 *
 *   const Alerts = useSwitch({ label: 'Email alerts', defaultChecked: true, onChange: save });
 *   return <Alerts />;
 *
 * Precedence: this config, then `defaults.switch`, then the provider (size, tone), then the library default.
 */
export function useSwitch(input: SwitchConfig): SwitchComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.switch ? mergeConfig<SwitchConfig>(ctx.defaults.switch, input) : input;
  const field = useField(config);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ switchMeta, validateConfig }) => {
      for (const problem of validateConfig(switchMeta, input)) warnOnce(true, problem.message);
    });
    warnOnce(!filled(config.label), 'Switch: give it a `label` (`hideLabel` keeps it for screen readers only).');
  }

  const state: SwitchState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, invalid: field.invalid };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: field.root,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-label-position': config.labelPosition ?? 'end',
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: SwitchRootProps): React.ReactElement => {
    const shared: Partial<Record<SwitchSlot, string>> = {
      description: 'pinfold-field__description',
      error: 'pinfold-field__error',
      item: 'pinfold-choice__item',
      input: 'pinfold-choice__input',
      box: 'pinfold-choice__box',
    };
    const slot = (name: string, content: React.ReactNode, tag: string, base: PropsBag = {}) => {
      const key = name as SwitchSlot;
      return renderSlot(config, key, slotProps(config, key, { className: config.unstyled ? undefined : cn(`pinfold-switch__${name}`, shared[key]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    };
    const vars = dimensionVars('switch', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-switch pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const content = (
      <>
        {renderChoice({
          slot,
          id: field.controlId,
          row: { label: config.label, disabled: config.disabled },
          labelText: labelContent(config, config.unstyled),
          hideLabel: config.hideLabel,
          indicator: slot('thumb', null, 'span'),
          describedBy: field.describedBy,
          input: {
            type: 'checkbox',
            role: 'switch',
            name: config.name,
            value: config.formValue,
            required: config.required || undefined,
            'aria-invalid': field.invalid || undefined,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              field.revalidate(event.target);
              config.onChange?.(event.target.checked, event);
            },
            onInvalid: field.onInvalid,
            ...(config.checked !== undefined ? { checked: config.checked } : { defaultChecked: config.defaultChecked }),
          },
        })}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }) : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SwitchApi = { focus: () => field.root.current?.querySelector('input')?.focus(), getRootProps, render };
  return usePinfoldComponent<SwitchApi, SwitchRootProps>('Switch', api, (props) => render(props));
}
