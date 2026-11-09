import * as React from 'react';
import { cn, dataAttr, dimensionVars, foldText, inactiveComboboxOptions, matchesQuery, mergeProps, toggleValue, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, useField } from '../field';
import { useFloating, useMounted, useOverlayLayer } from '../overlay';
import { CHEVRON_DOWN_ICON, CLOSE_ICON } from '../nav-icons';
import { renderRows, toRows, useListNav, useListWindow, type ListItem, type Row, type ListItemContext } from '../select/listbox';
import type { ComboboxApi, ComboboxComponent, ComboboxConfig, ComboboxRootProps, ComboboxSlot, ComboboxState } from './types';

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null || v === '' ? [] : [String(v)]);

/**
 * A text field that suggests from a list as you type: filter your rows, or show results you
 * fetch. One value, several (chips) with `multiple`, or free text with `allowCustom`.
 *
 *   const City = useCombobox({ label: 'City', items: cities });
 *   return <City />;
 *
 * Precedence: this config, then `defaults.combobox`, then the provider (size, tone), then the library default.
 */
export function useCombobox<V extends string = string>(input: ComboboxConfig<V>): ComboboxComponent {
  const ctx = usePinfold();
  const own = input as unknown as ComboboxConfig;
  const config = ctx.defaults.combobox ? (mergeConfig<ComboboxConfig>(ctx.defaults.combobox as ComboboxConfig, own) as ComboboxConfig) : own;
  const field = useField(config);
  const multiple = !!config.multiple;
  // Rows fetched by `loadItems`, per query; the last request is cancelled when the query moves on.
  const [loaded, setLoaded] = React.useState<{ query: string; items: ReadonlyArray<ListItem | string> } | null>(null);
  const [fetching, setFetching] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const cache = React.useRef(new Map<string, ReadonlyArray<ListItem | string>>());
  const loader = React.useRef(config.loadItems);
  loader.current = config.loadItems;
  const async = !!config.loadItems;
  const fetched = toRows(async ? loaded?.items : config.items);
  // Chosen values keep their labels when the fetched rows change.
  const known = React.useRef(new Map<string, Row>());
  for (const r of fetched) known.current.set(r.value, r);
  const all = fetched;
  const [rawValue, setRawValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? (multiple ? [] : null) });
  const value = asList(rawValue);
  const rowOf = (v: string) => all.find((r) => r.value === v) ?? known.current.get(v);
  const labelOf = (v: string) => rowOf(v)?.text ?? v;
  const [query, setQueryState] = useControllableState<string>({ value: config.inputValue, defaultValue: config.defaultInputValue ?? (!multiple && value[0] ? labelOf(value[0]) : '') });
  // Typed since the last choice: the rows filter only then (a chosen label shows every row).
  const [editing, setEditing] = React.useState(() => {
    const given = config.inputValue ?? config.defaultInputValue;
    return !!given && (multiple || given !== (value[0] ? labelOf(value[0]) : ''));
  });
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const popup = React.useRef<HTMLDivElement | null>(null);
  const control = React.useRef<HTMLDivElement | null>(null);
  const text = React.useRef<HTMLInputElement | null>(null);
  const mounted = useMounted();
  const listId = `${field.base}-list`;
  const disabled = !!config.disabled;
  const loading = !!config.loading || fetching;
  const open = isOpen && !disabled;

  const typed = editing || multiple ? query : '';
  // Fetched rows are already the results: they are not filtered again.
  const inList = config.selectedInList ?? 'check';
  const shown = all
    .filter((r) => matchesQuery(r.text, typed, config.filter ?? (async ? 'none' : 'contains')))
    .filter((r) => !(multiple && inList === 'hide' && value.includes(r.value)))
    .map((r) => (multiple && inList === 'disable' && value.includes(r.value) ? { ...r, disabled: true } : r));
  const exact = all.some((r) => foldText(r.text) === foldText(query.trim()));
  const custom: Row | null = config.allowCustom && query.trim() && !exact && !(multiple && value.includes(query.trim()))
    ? { value: query.trim(), label: config.labels?.create ? config.labels.create(query.trim()) : `Add "${query.trim()}"`, text: query.trim(), disabled: false }
    : null;
  const rows = custom ? [...shown, custom] : shown;
  const nav = useListNav({ rows, open, selected: value, listId });
  const listWindow = useListWindow(rows, open, nav.active, popup);

  React.useEffect(() => {
    const load = loader.current;
    if (!load || (!open && !typed)) return;
    const hit = cache.current.get(typed);
    if (hit) {
      setLoaded({ query: typed, items: hit });
      setFetching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setFetching(true);
        setLoadFailed(false);
        try {
          const items = await load(typed, { signal: controller.signal });
          if (controller.signal.aborted) return;
          cache.current.set(typed, items);
          // A small cache: the oldest query goes first.
          if (cache.current.size > 30) cache.current.delete(cache.current.keys().next().value as string);
          setLoaded({ query: typed, items });
        } catch {
          if (!controller.signal.aborted) setLoadFailed(true);
        } finally {
          if (!controller.signal.aborted) setFetching(false);
        }
      },
      typed ? config.debounce ?? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [typed, open, async]); // eslint-disable-line react-hooks/exhaustive-deps

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ comboboxMeta, validateConfig }) => {
      for (const problem of validateConfig(comboboxMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveComboboxOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Combobox: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Combobox: give it a `label` (`hideLabel` keeps it for screen readers only). A placeholder is not a name.');
  }

  const state: ComboboxState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, multiple, invalid: field.invalid, disabled, loading, value, query };

  const setOpen = (next: boolean) => {
    if (next === open || (next && disabled)) return;
    setOpenState(next);
    config.onOpenChange?.(next);
  };
  const setQuery = (next: string) => {
    setQueryState(next);
    config.onInputChange?.(next);
  };
  const commit = (next: string[], event?: React.SyntheticEvent) => {
    setRawValue(multiple ? next : next[0] ?? null);
    (config.onChange as ((v: unknown, e?: React.SyntheticEvent) => void) | undefined)?.(multiple ? next : next[0] ?? null, event);
  };
  const pick = (row: Row, event?: React.SyntheticEvent) => {
    if (row.disabled) return;
    commit(toggleValue(value, row.value, multiple), event);
    setEditing(false);
    if (multiple) {
      setQuery('');
    } else {
      setQuery(row.text);
      setOpen(false);
    }
  };
  // Leaving the field: free text is kept with `allowCustom`, else the text goes back to the choice.
  const settle = () => {
    if (!editing || multiple) return setEditing(false);
    const typedText = query.trim();
    if (!typedText) commit([]);
    else if (config.allowCustom) commit([all.find((r) => foldText(r.text) === foldText(typedText))?.value ?? typedText]);
    else setQuery(value[0] ? labelOf(value[0]) : '');
    setEditing(false);
  };

  // The first match is active as you type, so Enter takes it.
  React.useEffect(() => {
    if (open && editing) nav.setActive(rows.findIndex((r) => !r.disabled));
  }, [query, open]); // eslint-disable-line react-hooks/exhaustive-deps
  useFloating({ open: open && mounted, anchor: () => control.current, floating: popup, placement: config.placement ?? 'bottom-start', offset: 6 });
  useIsomorphicLayoutEffect(() => {
    if (open && control.current && popup.current) popup.current.style.minWidth = `${control.current.offsetWidth}px`;
  }, [open]);
  useOverlayLayer(
    open,
    (node) => !!control.current?.contains(node) || !!popup.current?.contains(node),
    () => setOpen(false),
    () => {
      setOpen(false);
      settle();
    },
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        nav.start(key === 'ArrowUp' ? 'last' : undefined);
      } else if (event.altKey && key === 'ArrowUp') setOpen(false);
      else nav.move(key);
    } else if ((key === 'PageDown' || key === 'PageUp') && open) {
      event.preventDefault();
      nav.move(key);
    } else if (key === 'Enter') {
      if (open && rows[nav.active]) {
        event.preventDefault();
        pick(rows[nav.active], event);
      } else if (custom) {
        event.preventDefault();
        pick(custom, event);
      }
    } else if (key === 'Escape') {
      if (open) setOpen(false);
      else if (query) {
        setQuery('');
        setEditing(true);
      }
    } else if (key === 'Backspace' && multiple && !query && value.length) {
      commit(value.slice(0, -1), event);
    } else if (key === 'Tab') {
      setOpen(false);
    }
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        'data-combobox': '',
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-open': dataAttr(open),
        'data-filled': dataAttr(value.length > 0 || query !== ''),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(disabled),
        'data-multiple': dataAttr(multiple),
        'data-chips': multiple ? config.chipsPlacement ?? 'inside' : undefined,
        'data-loading': dataAttr(loading),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: ComboboxRootProps): React.ReactElement => {
    const cls = (...names: string[]) => (config.unstyled ? undefined : names.join(' '));
    // Shares select.css: the same field, chips and list.
    const slot = (name: ComboboxSlot, content: React.ReactNode, tag: string, base: PropsBag = {}, shared?: string) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-select__${name}`, ...(shared ? [shared] : [])), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('select', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-select pinfold-field', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const max = config.maxChips ?? 3;
    const below = (config.chipsPlacement ?? 'inside') === 'below';
    const limit = below ? config.maxChips ?? Infinity : max;
    const chipItem = (v: string, index: number): ListItemContext => {
      const r = rowOf(v);
      return { value: v, label: r?.label ?? v, text: r?.text ?? v, description: r?.description, icon: r?.icon, group: r?.group, disabled: !!r?.disabled, selected: true, active: false, index, remove: (e) => commit(value.filter((x) => x !== v), e) };
    };
    const chipList = multiple ? (
      <>
        {value.slice(0, limit).map((v, index) => (
          <React.Fragment key={v}>
            {slot(
              'chip',
              <>
                <span>{rowOf(v)?.label ?? v}</span>
                {disabled ? null : below ? (
                  // Under the field the chips are a tag group: each remove is a real button.
                  <button type="button" className={cls('pinfold-select__chipRemove')} aria-label={`${config.labels?.clear ?? 'Remove'} ${labelOf(v)}`} onClick={(e) => { commit(value.filter((x) => x !== v), e); text.current?.focus(); }}>
                    {CLOSE_ICON}
                  </button>
                ) : (
                  <span aria-hidden="true" className={cls('pinfold-select__chipRemove')} onPointerDown={(e) => e.preventDefault()} onClick={() => commit(value.filter((x) => x !== v))}>
                    {CLOSE_ICON}
                  </span>
                )}
              </>,
              'span',
              { [ITEM]: chipItem(v, index) },
            )}
          </React.Fragment>
        ))}
        {value.length > limit ? slot('chip', `+${value.length - limit}`, 'span', { 'data-more': '' }) : null}
      </>
    ) : null;
    const chips = below ? null : chipList;
    const chipGroup = below && multiple && value.length ? slot('chips', chipList, 'div', { role: 'group', 'aria-label': `${typeof config.label === 'string' ? config.label : 'Chosen'}: ${value.length}` }) : null;
    const canClear = !!config.clearable && (value.length > 0 || query !== '') && !disabled;
    const clearLabel = config.labels?.clear ?? 'Clear';
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'label', { id: field.labelId, htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) }, 'pinfold-field__label')}
        {slot(
          'control',
          <>
            {chips}
            {slot('input', null, 'input', {
              ref: text,
              id: field.controlId,
              type: 'text',
              role: 'combobox',
              autoComplete: 'off',
              'aria-autocomplete': 'list',
              'aria-expanded': open,
              'aria-controls': open ? listId : undefined,
              'aria-activedescendant': nav.activeId,
              'aria-describedby': field.describedBy,
              'aria-invalid': field.invalid || undefined,
              'aria-required': multiple && config.required ? true : undefined,
              required: !multiple && config.required ? true : undefined,
              disabled: disabled || undefined,
              placeholder: multiple && value.length ? undefined : config.placeholder,
              value: query,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(event.target.value);
                setEditing(true);
                field.revalidate(event.target);
                if (event.target.value || config.openOnFocus) setOpen(true);
              },
              onFocus: () => {
                if (config.openOnFocus) setOpen(true);
              },
              onBlur: (event: React.FocusEvent) => {
                // Moving into the list (a pointer press) is not leaving.
                if (popup.current?.contains(event.relatedTarget as Node)) return;
                setOpen(false);
                settle();
              },
              onKeyDown,
              onInvalid: field.onInvalid,
            })}
            {canClear
              ? slot('clear', CLOSE_ICON, 'button', {
                  type: 'button',
                  tabIndex: -1,
                  'aria-label': clearLabel,
                  title: clearLabel,
                  onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
                  onClick: (e: React.MouseEvent) => {
                    commit([], e);
                    setQuery('');
                    setEditing(false);
                    text.current?.focus();
                  },
                })
              : null}
            {slot('chevron', CHEVRON_DOWN_ICON, 'span', {
              'aria-hidden': true,
              onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
              onClick: () => {
                if (!open) nav.start();
                setOpen(!open);
                text.current?.focus();
              },
            })}
          </>,
          'div',
          { ref: control, onClick: () => text.current?.focus() },
        )}
        {chipGroup}
        {(multiple ? value : value.slice(0, 1)).map((v) => (config.name ? <input key={v} type="hidden" name={config.name} value={v} /> : null))}
        {open && mounted
          ? slot(
              'popup',
              <>
              {renderRows({
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
                query: config.highlight === false ? undefined : typed,
                unstyled: config.unstyled,
                window: listWindow,
                status: rows.length ? undefined : loading ? config.labels?.loading ?? 'Loading…' : loadFailed ? config.labels?.error ?? 'Could not load results' : config.labels?.empty ?? 'No results',
              })}
              {/* Results being refreshed stay, with a loading row under them. */}
              {loading && rows.length ? slot('empty', config.labels?.loading ?? 'Loading…', 'div', { role: 'presentation', 'data-pending': '' }) : null}
              </>,
              'div',
              { ref: popup, id: listId, role: 'listbox', 'aria-labelledby': field.labelId, 'aria-multiselectable': multiple || undefined, 'aria-busy': loading || undefined, 'data-size': state.size, 'data-tone': state.tone, tabIndex: -1 },
            )
          : null}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }, 'pinfold-field__description') : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }, 'pinfold-field__error') : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ComboboxApi = {
    value,
    inputValue: query,
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    setValue: (next) => {
      setRawValue(multiple ? [...next] : next[0] ?? null);
      if (!multiple) setQueryState(next[0] ? labelOf(next[0]) : '');
    },
    focus: () => text.current?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<ComboboxApi, ComboboxRootProps>('Combobox', api, (props) => render(props));
}
