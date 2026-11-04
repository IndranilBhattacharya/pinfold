import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveCheckboxOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderChoice, useField } from '../field';
import type { CheckboxApi, CheckboxComponent, CheckboxConfig, CheckboxRootProps, CheckboxSlot, CheckboxState } from './types';

const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path className="pinfold-checkbox__check" d="M3.5 8.5l3 3 6-7" />
    <path className="pinfold-checkbox__dash" d="M4 8h8" />
  </svg>
);

/**
 * A native checkbox with its label and error wired up, or a group from `items`, as a hook that
 * hands back a component.
 *
 *   const Terms = useCheckbox({ label: 'I accept the terms', name: 'terms', required: true });
 *   return <Terms />;
 *
 * Precedence: this config, then `defaults.checkbox`, then the provider (size, tone), then the library default.
 */
export function useCheckbox(input: CheckboxConfig): CheckboxComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.checkbox ? mergeConfig<CheckboxConfig>(ctx.defaults.checkbox, input) : input;
  const field = useField(config);
  const items = config.items;
  const group = Array.isArray(items);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ checkboxMeta, validateConfig }) => {
      for (const problem of validateConfig(checkboxMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveCheckboxOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Checkbox: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Checkbox: give it a `label` (`hideLabel` keeps it for screen readers only).');
  }

  const boxes = () => Array.from(field.root.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []);

  // Native-only state: `indeterminate` has no attribute, and "at least one" has no native form.
  const sync = () => {
    const all = boxes();
    if (!group) {
      if (all[0]) all[0].indeterminate = !!config.indeterminate;
      return;
    }
    const none = !all.some((box) => box.checked);
    for (const box of all) box.required = !!config.required && none;
  };
  useIsomorphicLayoutEffect(sync);

  const state: CheckboxState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, invalid: field.invalid, group };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: field.root,
        ...(group ? { disabled: config.disabled || undefined, 'aria-describedby': field.describedBy } : null),
        'data-size': state.size,
        'data-tone': state.tone,
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-variant': config.variant ?? 'plain',
        'data-orientation': config.orientation ?? 'vertical',
        'data-group': dataAttr(group),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: CheckboxRootProps): React.ReactElement => {
    const shared: Partial<Record<CheckboxSlot, string>> = {
      label: 'pinfold-field__label',
      description: 'pinfold-field__description',
      error: 'pinfold-field__error',
      items: 'pinfold-choice__items',
      item: 'pinfold-choice__item',
      input: 'pinfold-choice__input',
      box: 'pinfold-choice__box',
      itemDescription: 'pinfold-choice__description',
    };
    const slot = (name: string, content: React.ReactNode, tag: string, base: PropsBag = {}) => {
      const key = name as CheckboxSlot;
      return renderSlot(config, key, slotProps(config, key, { className: config.unstyled ? undefined : cn(`pinfold-checkbox__${name}`, shared[key]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    };
    const vars = dimensionVars('checkbox', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-checkbox pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const onInput = (event: React.ChangeEvent<HTMLInputElement>) => {
      sync();
      field.revalidate(event.target);
      // The DOM is the source of truth: the click has already landed.
      if (group) config.onChange?.(boxes().filter((box) => box.checked).map((box) => box.value), event);
      else config.onChange?.(event.target.checked, event);
    };
    const shown = (
      <>
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }) : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }) : null}
      </>
    );
    let content: React.ReactNode;
    if (group) {
      const checkedValue = (value: string) =>
        config.value !== undefined ? { checked: config.value.includes(value) } : { defaultChecked: config.defaultValue?.includes(value) };
      content = (
        <>
          {slot('label', labelContent(config, config.unstyled), 'legend', hiddenStyle(config.hideLabel))}
          {slot(
            'items',
            items!.map((row, i) => (
              <React.Fragment key={row.value}>
                {renderChoice({
                  slot,
                  id: `${field.base}-${i}`,
                  row,
                  indicator: CHECK,
                  input: {
                    type: 'checkbox',
                    name: config.name,
                    value: row.value,
                    'aria-invalid': field.invalid || undefined,
                    onChange: onInput,
                    onInvalid: field.onInvalid,
                    ...checkedValue(row.value),
                  },
                })}
              </React.Fragment>
            )),
            'div',
          )}
          {shown}
        </>
      );
    } else {
      content = (
        <>
          {renderChoice({
            slot,
            id: field.controlId,
            row: { label: config.label, disabled: config.disabled },
            labelText: labelContent(config, config.unstyled),
            hideLabel: config.hideLabel,
            indicator: CHECK,
            describedBy: field.describedBy,
            input: {
              type: 'checkbox',
              name: config.name,
              value: config.formValue,
              required: config.required || undefined,
              'aria-invalid': field.invalid || undefined,
              onChange: onInput,
              onInvalid: field.onInvalid,
              ...(config.checked !== undefined ? { checked: config.checked } : { defaultChecked: config.defaultChecked }),
            },
          })}
          {shown}
        </>
      );
    }
    return renderSlot(config, 'root', root, state, content, (p, c) => React.createElement(group ? 'fieldset' : 'div', p, c)) as React.ReactElement;
  };

  const api: CheckboxApi = { focus: () => boxes()[0]?.focus(), getRootProps, render };
  return usePinfoldComponent<CheckboxApi, CheckboxRootProps>('Checkbox', api, (props) => render(props));
}
