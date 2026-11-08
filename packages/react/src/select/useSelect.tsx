import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveSelectOptions, mergeProps, toggleValue, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, useField } from '../field';
import { useFloating, useMounted, useOverlayLayer } from '../overlay';
import { VISUALLY_HIDDEN } from '../a11y';
import { CHEVRON_DOWN_ICON, CLOSE_ICON } from '../nav-icons';
import { renderRows, toRows, useListNav, type Row } from './listbox';
import type { SelectApi, SelectComponent, SelectConfig, SelectRootProps, SelectSlot, SelectState } from './types';

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null || v === '' ? [] : [String(v)]);

/**
 * A field that opens a list to choose one value, or several with `multiple`, as a hook that hands
 * back a component. A hidden native `<select>` carries the value, so forms submit, reset, autofill
 * and validate (`required`) without help.
 *
 *   const Country = useSelect({ label: 'Country', items: ['India', 'Japan'] });
 *   return <Country />;
 *
 * Precedence: this config, then `defaults.select`, then the provider (size, tone), then the library default.
 */
export function useSelect<V extends string = string>(input: SelectConfig<V>): SelectComponent {
  const ctx = usePinfold();
  const own = input as unknown as SelectConfig;
  const config = ctx.defaults.select ? (mergeConfig<SelectConfig>(ctx.defaults.select as SelectConfig, own) as SelectConfig) : own;
  const field = useField(config);
  const multiple = !!config.multiple;
  const rows = toRows(config.items);
  const [rawValue, setRawValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? (multiple ? [] : null) });
  const value = asList(rawValue);
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const trigger = React.useRef<HTMLDivElement | null>(null);
  const popup = React.useRef<HTMLDivElement | null>(null);
  const native = React.useRef<HTMLSelectElement | null>(null);
  const mounted = useMounted();
  const listId = `${field.base}-list`;
  const disabled = !!config.disabled;
  const open = isOpen && !disabled;
  const nav = useListNav({ rows, open, selected: value, listId });

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ selectMeta, validateConfig }) => {
      for (const problem of validateConfig(selectMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveSelectOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Select: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Select: give it a `label` (`hideLabel` keeps it for screen readers only). A placeholder is not a name.');
    warnOnce(new Set(rows.map((r) => r.value)).size !== rows.length, 'Select: every row needs its own `value`.');
  }

  const state: SelectState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, multiple, invalid: field.invalid, disabled, value };

  const setOpen = (next: boolean, edge?: 'first' | 'last') => {
    if (next === open || (next && disabled)) return;
    if (next) nav.start(edge);
    setOpenState(next);
    config.onOpenChange?.(next);
  };
  const commit = (next: string[], event?: React.SyntheticEvent) => {
    setRawValue(multiple ? next : next[0] ?? null);
    (config.onChange as ((v: unknown, e?: React.SyntheticEvent) => void) | undefined)?.(multiple ? next : next[0] ?? null, event);
    // The native select follows, so a required field revalidates.
    requestAnimationFrame(() => native.current && field.revalidate(native.current as unknown as HTMLInputElement));
  };
  const pick = (row: Row, event?: React.SyntheticEvent) => {
    if (row.disabled) return;
    commit(toggleValue(value, row.value, multiple), event);
    if (!multiple) setOpen(false);
  };

  // A form reset puts the default back.
  React.useEffect(() => {
    const form = native.current?.form;
    if (!form) return;
    const onReset = () => setRawValue(config.defaultValue ?? (multiple ? [] : null));
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  });

  useFloating({ open: open && mounted, anchor: () => trigger.current, floating: popup, placement: config.placement ?? 'bottom-start', offset: 6 });
  // The list is at least as wide as the field.
  useIsomorphicLayoutEffect(() => {
    if (open && trigger.current && popup.current) popup.current.style.minWidth = `${trigger.current.offsetWidth}px`;
  }, [open]);
  useOverlayLayer(open, (node) => !!trigger.current?.contains(node) || !!popup.current?.contains(node), () => setOpen(false), () => setOpen(false));

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    const { key } = event;
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ' || key === 'Home' || key === 'End') {
        event.preventDefault();
        setOpen(true, key === 'Home' ? 'first' : key === 'End' ? 'last' : undefined);
      } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        setOpen(true);
        nav.typeahead(key);
      }
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (key === 'Enter' || (key === ' ' && !event.altKey)) {
      event.preventDefault();
      if (rows[nav.active]) pick(rows[nav.active], event);
      else setOpen(false);
    } else if (key === 'Tab') {
      if (!multiple && rows[nav.active] && !value.includes(rows[nav.active].value)) pick(rows[nav.active], event);
      setOpen(false);
    } else if (key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      setOpen(false);
    } else if (nav.move(key)) event.preventDefault();
    else if (!event.metaKey && !event.ctrlKey && nav.typeahead(key)) event.preventDefault();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: field.root,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-open': dataAttr(open),
        'data-filled': dataAttr(value.length > 0),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(disabled),
        'data-multiple': dataAttr(multiple),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: SelectRootProps): React.ReactElement => {
    const cls = (...names: string[]) => (config.unstyled ? undefined : names.join(' '));
    const slot = (name: SelectSlot, content: React.ReactNode, tag: string, base: PropsBag = {}, shared?: string) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-select__${name}`, ...(shared ? [shared] : [])), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('select', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-select pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const chosen = value.map((v) => rows.find((r) => r.value === v) ?? { value: v, label: v, text: v, disabled: false });
    const valueId = `${field.base}-value`;
    const max = config.maxChips ?? 3;
    const remove = (v: string, event: React.SyntheticEvent) => {
      event.stopPropagation();
      commit(value.filter((x) => x !== v), event);
      trigger.current?.focus();
    };
    let shown: React.ReactNode;
    if (!chosen.length) shown = slot('placeholder', config.placeholder ?? 'Select…', 'span');
    else if (!multiple) shown = <>{chosen[0].icon != null ? slot('icon', chosen[0].icon, 'span', { 'aria-hidden': true }) : null}{chosen[0].label}</>;
    else if ((config.display ?? 'chips') === 'text') shown = chosen.map((r) => r.text).join(', ');
    else
      shown = (
        <>
          {chosen.slice(0, max).map((r) => (
            <React.Fragment key={r.value}>
              {slot(
                'chip',
                <>
                  <span>{r.label}</span>
                  {disabled ? null : (
                    // Pointer only: the list itself is the keyboard way to unchoose.
                    <span aria-hidden="true" className={cls('pinfold-select__chipRemove')} onPointerDown={(e) => e.preventDefault()} onClick={(e) => remove(r.value, e)}>
                      {CLOSE_ICON}
                    </span>
                  )}
                </>,
                'span',
              )}
            </React.Fragment>
          ))}
          {chosen.length > max ? slot('chip', `+${chosen.length - max}`, 'span', { 'data-more': '' }) : null}
        </>
      );
    const canClear = !!config.clearable && value.length > 0 && !disabled;
    const label = slot('label', labelContent(config, config.unstyled), 'label', { id: field.labelId, ...hiddenStyle(config.hideLabel), onClick: (e: React.MouseEvent) => (e.preventDefault(), trigger.current?.focus()) }, 'pinfold-field__label');
    const control = slot(
      'control',
      <>
        {slot('value', shown, 'span', { id: valueId })}
        {canClear
          ? slot('clear', CLOSE_ICON, 'button', {
              type: 'button',
              tabIndex: -1,
              'aria-label': config.clearLabel ?? 'Clear',
              title: config.clearLabel ?? 'Clear',
              onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                commit([], e);
                trigger.current?.focus();
              },
            })
          : null}
        {slot('chevron', CHEVRON_DOWN_ICON, 'span', { 'aria-hidden': true })}
      </>,
      'div',
      {
        ref: trigger,
        id: field.controlId,
        role: 'combobox',
        tabIndex: disabled ? -1 : 0,
        'aria-haspopup': 'listbox',
        'aria-expanded': open,
        'aria-controls': open ? listId : undefined,
        'aria-labelledby': `${field.labelId} ${valueId}`,
        'aria-activedescendant': nav.activeId,
        'aria-describedby': field.describedBy,
        'aria-invalid': field.invalid || undefined,
        'aria-required': config.required || undefined,
        'aria-disabled': disabled || undefined,
        onKeyDown,
        onClick: () => setOpen(!open),
      },
    );
    const list =
      open && mounted
        ? slot(
            'popup',
            renderRows({
              rows,
              slot: slot as never,
              listId,
              labelId: field.labelId,
              multiple,
              selected: value,
              active: nav.active,
              setActive: nav.setActive,
              optionId: nav.optionId,
              onPick: (row, event) => pick(row, event),
              unstyled: config.unstyled,
              status: rows.length ? undefined : config.emptyText ?? 'No options',
            }),
            'div',
            { ref: popup, id: listId, role: 'listbox', 'aria-labelledby': field.labelId, 'aria-multiselectable': multiple || undefined, 'data-size': state.size, 'data-tone': state.tone, tabIndex: -1 },
          )
        : null;
    // The form's copy of the value: submit, reset, autofill and `required` are the browser's.
    const form = (
      <select
        ref={native}
        name={config.name}
        multiple={multiple}
        required={config.required}
        disabled={disabled}
        value={multiple ? value : value[0] ?? ''}
        onChange={(event) => commit(Array.from(event.target.selectedOptions, (o) => o.value), event)}
        onInvalid={field.onInvalid as unknown as React.FormEventHandler<HTMLSelectElement>}
        tabIndex={-1}
        aria-hidden="true"
        style={VISUALLY_HIDDEN}
      >
        {multiple ? null : <option value="" />}
        {rows.map((r) => (
          <option key={r.value} value={r.value} disabled={r.disabled}>
            {r.text}
          </option>
        ))}
      </select>
    );
    const content = (
      <>
        {label}
        {control}
        {form}
        {list}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }, 'pinfold-field__description') : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }, 'pinfold-field__error') : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SelectApi = {
    value,
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    setValue: (next) => setRawValue(multiple ? [...next] : next[0] ?? null),
    focus: () => trigger.current?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<SelectApi, SelectRootProps>('Select', api, (props) => render(props));
}
