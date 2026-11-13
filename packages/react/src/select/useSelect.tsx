import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveSelectOptions, mergeProps, toggleValue, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderFieldMessages, useField, validationAttrs } from '../field';
import { useFloating, useMounted, useOverlayLayer } from '../overlay';
import { VISUALLY_HIDDEN } from '../a11y';
import { CHEVRON_DOWN_ICON, CLOSE_ICON } from '../nav-icons';
import { avatarNode, renderRows, rowContext, toRow, toRows, useListNav, useListWindow, type Row } from './listbox';
import type { ListItemContext } from './listbox';
import type { SelectApi, SelectComponent, SelectConfig, SelectRootProps, SelectSlot, SelectState } from './types';

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null || v === '' ? [] : [String(v)]);
const SHARED: Record<string, string> = { label: 'pinfold-field__label', description: 'pinfold-field__description', error: 'pinfold-field__error', statusIcon: 'pinfold-field__icon', validating: 'pinfold-field__validating' };

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
  const multiple = !!config.multiple;
  const rows = toRows(config.items);
  const [rawValue, setRawValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? (multiple ? [] : null) });
  const value = asList(rawValue);
  // What validation reads: the value as of the last commit, before React has re-rendered.
  const current = React.useRef(value);
  current.current = value;
  const native = React.useRef<HTMLSelectElement | null>(null);
  const field = useField(config as never, { value: () => (multiple ? current.current : current.current[0] ?? null), control: () => native.current });
  const frame = React.useRef(0);
  React.useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const trigger = React.useRef<HTMLDivElement | null>(null);
  const popup = React.useRef<HTMLDivElement | null>(null);
  const mounted = useMounted();
  const listId = `${field.base}-list`;
  const disabled = !!config.disabled;
  const open = isOpen && !disabled;
  const nav = useListNav({ rows, open, selected: value, listId });
  const listWindow = useListWindow(rows, open, nav.active, popup);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ selectMeta, validateConfig }) => {
      for (const problem of validateConfig(selectMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveSelectOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Select: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Select: give it a `label` (`hideLabel` keeps it for screen readers only). A placeholder is not a name.');
    warnOnce(new Set(rows.map((r) => r.value)).size !== rows.length, 'Select: every row needs its own `value`.');
  }

  const state: SelectState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, multiple, invalid: field.invalid, disabled, value, status: field.status, validating: field.validating };

  const setOpen = (next: boolean, edge?: 'first' | 'last') => {
    if (next === open || (next && disabled)) return;
    if (next) nav.start(edge);
    setOpenState(next);
    config.onOpenChange?.(next);
  };
  const commit = (next: string[], event?: React.SyntheticEvent) => {
    current.current = next;
    setRawValue(multiple ? next : next[0] ?? null);
    (config.onChange as ((v: unknown, e?: React.SyntheticEvent) => void) | undefined)?.(multiple ? next : next[0] ?? null, event);
    const el = native.current as unknown as HTMLInputElement | null;
    if (!el) return;
    field.revalidate(el);
    // The native select follows on the next render: a browser message showing is checked again then.
    cancelAnimationFrame(frame.current);
    if (filled(field.message)) frame.current = requestAnimationFrame(() => field.revalidate(el));
  };
  const rowOf = (v: string): Row => rows.find((r) => r.value === v) ?? toRow(v);
  const remove = (v: string, event?: React.SyntheticEvent) => {
    const index = current.current.indexOf(v);
    if (index < 0) return;
    commit(current.current.filter((x) => x !== v), event);
    (config.onRemove as ((v: string, item: ListItemContext) => void) | undefined)?.(v, rowContext(rowOf(v), index, false, false));
  };
  const clear = (event?: React.SyntheticEvent) => {
    commit([], event);
    config.onClear?.();
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
        ...radiusProps(config.radius),
        ref: field.root,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-open': dataAttr(open),
        'data-filled': dataAttr(value.length > 0),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(disabled),
        'data-multiple': dataAttr(multiple),
        'data-chip-variant': multiple ? config.chipVariant ?? 'soft' : undefined,
        ...validationAttrs(field),
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
    const chosen = value.map(rowOf);
    const valueId = `${field.base}-value`;
    const max = config.maxChips ?? 3;
    const unchoose = (v: string, event: React.SyntheticEvent) => {
      event.stopPropagation();
      remove(v, event);
      trigger.current?.focus();
    };
    const contexts = chosen.map((r, index) => rowContext(r, index, true, false, (e?: React.SyntheticEvent) => (e ? unchoose(r.value, e) : remove(r.value))));
    const lead = (r: Row) => (r.avatar != null ? slot('avatar', avatarNode(r.avatar), 'span', { 'aria-hidden': true }) : r.icon != null ? slot('icon', r.icon, 'span', { 'aria-hidden': true }) : null);
    let shown: React.ReactNode;
    if (config.renderValue && chosen.length) shown = config.renderValue(contexts, state);
    else if (!chosen.length) shown = slot('placeholder', config.placeholder ?? 'Select…', 'span');
    else if (!multiple) shown = <>{lead(chosen[0])}<span className={cls('pinfold-select__valueText')}>{chosen[0].label}</span></>;
    else if ((config.display ?? 'chips') === 'text') shown = <span className={cls('pinfold-select__valueText')}>{chosen.map((r) => r.text).join(', ')}</span>;
    else
      shown = (
        <>
          {chosen.slice(0, max).map((r, index) => (
            <React.Fragment key={r.value}>
              {slot(
                'chip',
                <>
                  {lead(r)}
                  <span className={cls('pinfold-select__chipLabel')}>{r.label}</span>
                  {disabled
                    ? null
                    : // Pointer only: the list itself is the keyboard way to unchoose.
                      slot('chipRemove', CLOSE_ICON, 'span', { 'aria-hidden': true, title: `${config.clearLabel ?? 'Clear'} ${r.text}`, onPointerDown: (e: React.PointerEvent) => e.preventDefault(), onClick: (e: React.MouseEvent) => unchoose(r.value, e) })}
                </>,
                'span',
                { [ITEM]: contexts[index], 'data-tone': r.tone, title: r.text },
              )}
            </React.Fragment>
          ))}
          {chosen.length > max ? slot('chip', `+${chosen.length - max}`, 'span', { 'data-more': '', title: chosen.slice(max).map((r) => r.text).join(', ') }) : null}
        </>
      );
    const canClear = !!config.clearable && value.length > 0 && !disabled;
    const label = slot('label', labelContent(config, config.unstyled), 'label', { id: field.labelId, ...hiddenStyle(config.hideLabel), onClick: (e: React.MouseEvent) => (e.preventDefault(), trigger.current?.focus()) }, SHARED.label);
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
                clear(e);
                trigger.current?.focus();
              },
            })
          : null}
        {field.validating ? slot('validating', null, 'span', { 'aria-hidden': true }, SHARED.validating) : null}
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
        'aria-busy': field.validating || undefined,
        onKeyDown,
        onClick: () => setOpen(!open),
        onBlur: (event: React.FocusEvent) => {
          if (popup.current?.contains(event.relatedTarget as Node | null)) return;
          field.onBlur(native.current);
        },
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
              window: listWindow,
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
        onInvalid={(event) => {
          field.onInvalid(event as unknown as React.FormEvent<HTMLInputElement>);
          // The native copy is hidden: the field takes the focus the browser gives it.
          if (typeof document !== 'undefined' && document.activeElement === native.current) trigger.current?.focus();
        }}
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
        {renderFieldMessages(field, config.description, (n, c, t, b) => slot(n as SelectSlot, c, t, b, SHARED[n]), true)}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SelectApi = {
    value,
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    setValue: (next) => {
      current.current = [...next];
      setRawValue(multiple ? [...next] : next[0] ?? null);
    },
    clear: () => clear(),
    focus: () => trigger.current?.focus(),
    ...field.api,
    getRootProps,
    render,
  };
  return usePinfoldComponent<SelectApi, SelectRootProps>('Select', api, (props) => render(props));
}
