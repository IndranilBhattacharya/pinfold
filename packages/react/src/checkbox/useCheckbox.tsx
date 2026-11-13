import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveCheckboxOptions, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderChoice, renderFieldMessages, useField, validationAttrs } from '../field';
import { ITEM } from '../slots';
import type { CheckboxApi, CheckboxComponent, CheckboxConfig, CheckboxIconState, CheckboxRootProps, CheckboxSlot, CheckboxState } from './types';

const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path className="pinfold-checkbox__check" d="M3.5 8.5l3 3 6-7" pathLength={1} />
    <path className="pinfold-checkbox__dash" d="M4 8h8" pathLength={1} />
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
  const items = config.items;
  const group = Array.isArray(items);
  const boxes = () => Array.from(field.root.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []);
  const read = () => (group ? boxes().filter((box) => box.checked).map((box) => box.value) : !!boxes()[0]?.checked);
  const field = useField(config, { value: read, control: () => boxes()[0] });
  // What is checked, kept in React too, so `icon` and slot state can be a function of it.
  const [ownChecked, setOwnChecked] = React.useState(!!config.defaultChecked);
  const [ownValues, setOwnValues] = React.useState<readonly string[]>(config.defaultValue ?? []);
  const checked = config.checked ?? ownChecked;
  const values = config.value ?? ownValues;
  React.useEffect(() => {
    const form = field.root.current?.closest('form');
    if (!form) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      // After the reset has applied.
      t = setTimeout(() => {
        setOwnChecked(!!boxes()[0]?.checked);
        setOwnValues(boxes().filter((box) => box.checked).map((box) => box.value));
      });
    };
    form.addEventListener('reset', onReset);
    return () => {
      clearTimeout(t);
      form.removeEventListener('reset', onReset);
    };
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ checkboxMeta, validateConfig }) => {
      for (const problem of validateConfig(checkboxMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveCheckboxOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Checkbox: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Checkbox: give it a `label` (`hideLabel` keeps it for screen readers only).');
  }

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

  const state: CheckboxState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, invalid: field.invalid, group, checked: group ? false : checked, values: group ? [...values] : [], status: field.status, validating: field.validating };
  const icon = (s: CheckboxIconState) => (config.icon === undefined ? CHECK : typeof config.icon === 'function' ? config.icon(s) : config.icon);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        ...(group ? { disabled: config.disabled || undefined, 'aria-describedby': field.describedBy } : null),
        'data-size': state.size,
        'data-tone': state.tone,
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-variant': config.variant ?? 'plain',
        'data-orientation': config.orientation ?? 'vertical',
        ...validationAttrs(field),
        'data-group': dataAttr(group),
        'data-animate': ctx.disableAnimation || config.animation === 'none' ? undefined : config.animation ?? 'draw',
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
      itemStartContent: 'pinfold-choice__start',
      itemEndContent: 'pinfold-choice__end',
      statusIcon: 'pinfold-field__icon',
      validating: 'pinfold-field__validating',
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
      if (group) setOwnValues(boxes().filter((box) => box.checked).map((box) => box.value));
      else setOwnChecked(event.target.checked);
      field.revalidate(event.target);
      // The DOM is the source of truth: the click has already landed.
      if (group) config.onChange?.(boxes().filter((box) => box.checked).map((box) => box.value), event);
      else config.onChange?.(event.target.checked, event);
    };
    const shown = renderFieldMessages(field, config.description, slot);
    const events = {
      onFocus: config.onFocus,
      onKeyDown: config.onKeyDown,
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        // Leaving the group, not moving inside it.
        if (!group || !field.root.current?.contains(event.relatedTarget as Node | null)) field.onBlur(boxes()[0]);
        config.onBlur?.(event);
      },
    };
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
                  indicator: icon({ checked: values.includes(row.value), indeterminate: false, disabled: !!(row.disabled || config.disabled) }),
                  item: { 'data-checked': dataAttr(values.includes(row.value)), [ITEM]: { ...row, index: i, checked: values.includes(row.value) } },
                  input: {
                    type: 'checkbox',
                    name: config.name,
                    value: row.value,
                    'aria-invalid': field.invalid || undefined,
                    ...events,
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
            indicator: icon({ checked, indeterminate: !!config.indeterminate, disabled: !!config.disabled }),
            describedBy: field.describedBy,
            item: { 'data-checked': dataAttr(checked) },
            input: {
              ...events,
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

  const api: CheckboxApi = { focus: () => boxes()[0]?.focus(), ...field.api, getRootProps, render };
  return usePinfoldComponent<CheckboxApi, CheckboxRootProps>('Checkbox', api, (props) => render(props));
}
