import * as React from 'react';
import { cn, dataAttr, dimensionVars, foldText, inactiveComboboxOptions, matchesQuery, mergeProps, toggleValue, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { filled, hiddenStyle, labelContent, renderFieldMessages, useField, validationAttrs } from '../field';
import { useFloating, useMounted, useOverlayLayer } from '../overlay';
import { CHEVRON_DOWN_ICON, CLOSE_ICON } from '../nav-icons';
import { avatarNode, renderRows, rowContext, toRow, toRows, useAsyncRows, useListNav, useListWindow, useNearEnd, type ListItem, type Row, type ListItemContext } from '../select/listbox';
import type { ComboboxApi, ComboboxComponent, ComboboxConfig, ComboboxCreateResult, ComboboxListContext, ComboboxRootProps, ComboboxSlot, ComboboxState } from './types';

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null || v === '' ? [] : [String(v)]);
const isThenable = (v: unknown): v is PromiseLike<unknown> => !!v && typeof (v as PromiseLike<unknown>).then === 'function';
const SHARED: Record<string, string> = { label: 'pinfold-field__label', description: 'pinfold-field__description', error: 'pinfold-field__error', statusIcon: 'pinfold-field__icon', validating: 'pinfold-field__validating' };
const ROW_ROLE = { listbox: 'option', grid: 'row', tree: 'treeitem', dialog: undefined } as const;

/**
 * A text field that suggests from a list as you type: filter your rows, or show results you
 * fetch (paged, as the list scrolls). One value, several (chips inside, above or under the field)
 * with `multiple`, free text with `allowCustom`, or your own dropdown body with `renderList`.
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
  const multiple = !!config.multiple;
  const [rawValue, setRawValue] = useControllableState<unknown>({ value: config.value === undefined ? undefined : config.value ?? null, defaultValue: config.defaultValue ?? (multiple ? [] : null) });
  const value = asList(rawValue);
  // What validation reads: the value as of the last commit, before React has re-rendered.
  const current = React.useRef(value);
  current.current = value;
  const text = React.useRef<HTMLInputElement | null>(null);
  const userValidate = config.validate as ((v: unknown) => ReturnType<NonNullable<ComboboxConfig['validate']>>) | undefined;
  // Several values have no native `required`: an empty choice is the error instead.
  const requiredMany = multiple && !!config.required;
  const validate = userValidate || requiredMany
    ? (v: unknown) => (requiredMany && Array.isArray(v) && !v.length ? (typeof config.messages?.required === 'string' ? config.messages.required : 'Choose at least one.') : userValidate ? userValidate(v) : null)
    : undefined;
  const field = useField({ ...config, validate } as never, { value: () => (multiple ? current.current : current.current[0] ?? null), control: () => text.current });
  const async = !!config.loadItems;
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const disabled = !!config.disabled;
  const open = isOpen && !disabled;
  // Chosen values keep their labels when the fetched rows change (and created ones have none).
  const known = React.useRef(new Map<string, Row>());
  const [query, setQueryState] = useControllableState<string>({
    value: config.inputValue,
    defaultValue: config.defaultInputValue ?? (!multiple && value[0] ? toRows(config.items).find((r) => r.value === value[0])?.text ?? value[0] : ''),
  });
  // Typed since the last choice: the rows filter only then (a chosen label shows every row).
  const [editing, setEditing] = React.useState(() => {
    const given = config.inputValue ?? config.defaultInputValue;
    const chosen = value[0] ? toRows(config.items).find((r) => r.value === value[0])?.text ?? value[0] : '';
    return !!given && (multiple || given !== chosen);
  });
  const typed = editing || multiple ? query : '';
  const remote = useAsyncRows<ListItem | string>({ load: config.loadItems as never, query: typed, active: open || !!typed, debounce: config.debounce ?? 250 });
  const all = toRows(async ? remote.items : config.items);
  for (const r of all) known.current.set(r.value, r);
  const rowOf = (v: string) => all.find((r) => r.value === v) ?? known.current.get(v);
  const labelOf = (v: string) => rowOf(v)?.text ?? v;
  const popup = React.useRef<HTMLDivElement | null>(null);
  const control = React.useRef<HTMLDivElement | null>(null);
  const mounted = useMounted();
  const listId = `${field.base}-list`;
  const fetching = async && remote.loading;
  const loading = !!config.loading || fetching;
  const custom = typeof config.renderList === 'function';
  const popupRole = custom ? config.popupRole ?? 'dialog' : 'listbox';
  const placement = config.chipsPlacement ?? 'inside';
  const [expanded, setExpanded] = React.useState(false);

  // Fetched rows are already the results: they are not filtered again.
  const inList = config.selectedInList ?? 'check';
  const shown = all
    .filter((r) => matchesQuery(r.text, typed, config.filter ?? (async ? 'none' : 'contains')))
    .filter((r) => !(multiple && inList === 'hide' && value.includes(r.value)))
    .map((r) => (multiple && inList === 'disable' && value.includes(r.value) ? { ...r, disabled: true } : r));
  const exact = all.some((r) => foldText(r.text) === foldText(query.trim()));
  const createRow: Row | null = config.allowCustom && query.trim() && !exact && !(multiple && value.includes(query.trim()))
    ? { value: query.trim(), label: config.labels?.create ? config.labels.create(query.trim()) : `Add "${query.trim()}"`, text: query.trim(), disabled: false, data: query.trim() }
    : null;
  // A custom body draws its own rows; the "Add" row stays a key away (Enter with no active row).
  const rows = createRow && !custom ? [...shown, createRow] : shown;
  const nav = useListNav({ rows, open, selected: value, listId });
  const listWindow = useListWindow(rows, open && !custom, nav.active, popup);

  // Paging: a page from `loadItems`, or your own `items` with `hasMore` and `onLoadMore`.
  const hasMore = async ? remote.hasMore : !!config.hasMore;
  const loadingMore = async ? remote.loadingMore : !!config.loading && !!config.hasMore && rows.length > 0;
  const asked = React.useRef(-1);
  const loadMore = () => {
    if (!hasMore) return;
    if (async) return remote.loadMore();
    if (config.loading || asked.current === all.length) return;
    asked.current = all.length;
    config.onLoadMore?.();
  };
  useNearEnd(popup, open && hasMore && !loading, nav.active, rows.length, loadMore);

  // `onSearch`: once typing pauses.
  const searched = React.useRef(query);
  React.useEffect(() => {
    if (!config.onSearch || !editing || searched.current === query) return;
    const timer = setTimeout(() => {
      searched.current = query;
      config.onSearch?.(query);
    }, config.debounce ?? 250);
    return () => clearTimeout(timer);
  }, [query, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ comboboxMeta, validateConfig }) => {
      for (const problem of validateConfig(comboboxMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveComboboxOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Combobox: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Combobox: give it a `label` (`hideLabel` keeps it for screen readers only). A placeholder is not a name.');
  }

  const state: ComboboxState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, multiple, invalid: field.invalid, disabled, loading, value, query, status: field.status, validating: field.validating };

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
    current.current = next;
    setRawValue(multiple ? next : next[0] ?? null);
    (config.onChange as ((v: unknown, e?: React.SyntheticEvent) => void) | undefined)?.(multiple ? next : next[0] ?? null, event);
    if (text.current) field.revalidate(text.current);
  };
  const itemOf = (v: string, index: number, selected = true) => rowContext(rowOf(v) ?? toRow(v), index, selected, false);
  /** A value leaves a multiple choice. */
  const remove = (v: string, event?: React.SyntheticEvent) => {
    const index = current.current.indexOf(v);
    if (index < 0) return;
    commit(current.current.filter((x) => x !== v), event);
    config.onRemove?.(v as V, itemOf(v, index, false));
  };
  const afterChoice = (row: Row) => {
    setEditing(false);
    if (multiple) setQuery('');
    else {
      setQuery(row.text);
      setOpen(false);
    }
  };
  const add = (row: Row, event?: React.SyntheticEvent) => {
    known.current.set(row.value, row);
    commit(multiple ? [...current.current.filter((x) => x !== row.value), row.value] : [row.value], event);
    afterChoice(row);
  };
  /** Typed text becomes a value: `onCreate` may refuse it, keep it, or swap in its own value. */
  const create = (raw: string, event?: React.SyntheticEvent) => {
    const finish = (out: ComboboxCreateResult) => {
      if (out === false) return;
      add(out == null ? toRow(raw) : toRow(out as ListItem | string), event);
    };
    const out = config.onCreate?.(raw);
    if (isThenable(out)) void Promise.resolve(out).then(finish, () => undefined);
    else finish(out as ComboboxCreateResult);
  };
  const pick = (row: Row, event?: React.SyntheticEvent) => {
    if (row.disabled) return;
    if (row === createRow) return create(row.value, event);
    if (multiple && value.includes(row.value)) {
      remove(row.value, event);
      setEditing(false);
      setQuery('');
      return;
    }
    commit(toggleValue(value, row.value, multiple), event);
    afterChoice(row);
  };
  const byValue = (v: string) => rows.find((r) => r.value === v) ?? rowOf(v) ?? toRow(v);
  const clear = (event?: React.SyntheticEvent) => {
    commit([], event);
    setQuery('');
    setEditing(false);
    config.onClear?.();
  };
  // Leaving the field: free text is kept with `allowCustom`, else the text goes back to the choice.
  const settle = () => {
    if (!editing || multiple) return setEditing(false);
    const typedText = query.trim();
    setEditing(false);
    if (!typedText) commit([]);
    else if (config.allowCustom) {
      const match = all.find((r) => foldText(r.text) === foldText(typedText));
      if (match) commit([match.value]);
      else create(typedText);
    } else setQuery(value[0] ? labelOf(value[0]) : '');
  };

  // The first match is active as you type, so Enter takes it.
  React.useEffect(() => {
    if (open && editing) nav.setActive(rows.findIndex((r) => !r.disabled));
  }, [query, open]); // eslint-disable-line react-hooks/exhaustive-deps
  // Chips under the field stay in view while the list is open: it opens under them.
  const chipsBox = React.useRef<HTMLDivElement | null>(null);
  useFloating({ open: open && mounted, anchor: () => (placement === 'below' && chipsBox.current) || control.current, floating: popup, placement: config.placement ?? 'bottom-start', offset: 6, key: value.length });
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
    } else if ((key === 'PageDown' || key === 'PageUp' || ((key === 'Home' || key === 'End') && custom)) && open) {
      event.preventDefault();
      nav.move(key);
    } else if (key === 'Enter') {
      if (event.nativeEvent.isComposing) return;
      if (open && rows[nav.active]) {
        event.preventDefault();
        pick(rows[nav.active], event);
      } else if (createRow) {
        event.preventDefault();
        create(createRow.value, event);
      }
    } else if (key === 'Escape') {
      if (open) setOpen(false);
      else if (query) {
        setQuery('');
        setEditing(true);
      }
    } else if (key === 'Backspace' && multiple && placement !== 'none' && !query && value.length) {
      remove(value[value.length - 1], event);
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
        'data-chips': multiple ? placement : undefined,
        'data-chip-variant': multiple ? config.chipVariant ?? 'soft' : undefined,
        'data-loading': dataAttr(loading),
        ...validationAttrs(field),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  /** Props for a row a custom body draws. */
  const getRowProps = (v: string, props?: PropsBag): PropsBag => {
    const i = rows.findIndex((r) => r.value === v);
    const row = rows[i];
    const selected = value.includes(v);
    return mergeProps(
      {
        id: i >= 0 ? nav.optionId(i) : undefined,
        role: ROW_ROLE[popupRole],
        'aria-selected': popupRole === 'dialog' ? undefined : selected,
        'aria-disabled': row?.disabled || undefined,
        'data-active': dataAttr(i >= 0 && i === nav.active),
        'data-selected': dataAttr(selected),
        'data-disabled': dataAttr(row?.disabled),
        onPointerMove: () => {
          if (i >= 0 && !row?.disabled && i !== nav.active) nav.setActive(i);
        },
        // Focus stays in the input, so the list does not close under the press.
        onPointerDown: (event: React.PointerEvent) => event.preventDefault(),
        onClick: (event: React.MouseEvent) => {
          if (row) pick(row, event);
        },
      },
      props,
    );
  };

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
    const inside = placement === 'inside';
    const outside = placement === 'above' || placement === 'below';
    const fold = config.maxChips ?? (inside ? 3 : Infinity);
    const limit = expanded ? Infinity : fold;
    const removeWord = config.labels?.remove ?? 'Remove';
    const chip = (v: string, index: number) => {
      const r = rowOf(v);
      const item: ListItemContext = { ...itemOf(v, index), remove: (e) => remove(v, e) };
      const label = labelOf(v);
      return (
        <React.Fragment key={v}>
          {slot(
            'chip',
            <>
              {r?.avatar != null ? slot('avatar', avatarNode(r.avatar), 'span', { 'aria-hidden': true }) : r?.icon != null ? slot('icon', r.icon, 'span', { 'aria-hidden': true }) : null}
              <span className={cls('pinfold-select__chipLabel')}>{r?.label ?? v}</span>
              {disabled
                ? null
                : outside
                  ? // Outside the field the chips are a tag group: each remove is a real button.
                    slot('chipRemove', CLOSE_ICON, 'button', {
                      type: 'button',
                      'aria-label': `${removeWord} ${label}`,
                      title: `${removeWord} ${label}`,
                      onClick: (e: React.MouseEvent) => {
                        remove(v, e);
                        text.current?.focus();
                      },
                    })
                  : // Inside, Backspace and the list are the keyboard ways; the mark is for pointers.
                    slot('chipRemove', CLOSE_ICON, 'span', {
                      'aria-hidden': true,
                      title: `${removeWord} ${label}`,
                      onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
                      onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        remove(v, e);
                      },
                    })}
            </>,
            'span',
            { [ITEM]: item, 'data-tone': r?.tone, title: label },
          )}
        </React.Fragment>
      );
    };
    const toggleMore = (more: boolean) =>
      slot(
        'chip',
        more ? `+${value.length - fold}` : config.labels?.less ?? 'Show less',
        'button',
        {
          type: 'button',
          'data-more': '',
          'aria-expanded': !more,
          'aria-label': more ? config.labels?.more?.(value.length - fold) ?? `Show ${value.length - fold} more` : undefined,
          // In the field the input keeps focus; outside it is a button of its own.
          tabIndex: inside ? -1 : undefined,
          onPointerDown: inside ? (e: React.PointerEvent) => e.preventDefault() : undefined,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setExpanded(more);
            if (inside) text.current?.focus();
          },
        },
      );
    const chipList =
      multiple && placement !== 'none' ? (
        <>
          {value.slice(0, limit).map(chip)}
          {value.length > limit ? toggleMore(true) : expanded && value.length > fold ? toggleMore(false) : null}
        </>
      ) : null;
    const chipGroup =
      outside && multiple && value.length
        ? slot('chips', chipList, 'div', { ref: placement === 'below' ? chipsBox : undefined, role: 'group', 'aria-label': `${typeof config.label === 'string' ? config.label : 'Chosen'}: ${value.length}`, 'data-placement': placement })
        : null;
    const canClear = !!config.clearable && (value.length > 0 || query !== '') && !disabled;
    const clearLabel = config.labels?.clear ?? 'Clear';
    const listCtx = (): ComboboxListContext => ({
      items: rows.map((r, i) => rowContext(r, i, value.includes(r.value), i === nav.active)),
      query: typed,
      value,
      loading,
      loadingMore,
      error: async && remote.failed,
      hasMore,
      loadMore,
      select: (v, e) => {
        if (!value.includes(v) || !multiple) add(byValue(v), e);
      },
      deselect: (v, e) => (multiple ? remove(v, e) : value.includes(v) && commit([], e)),
      toggle: (v, e) => pick(byValue(v), e),
      isSelected: (v) => value.includes(v),
      activeValue: rows[nav.active]?.value ?? null,
      setActiveValue: (v) => nav.setActive(v == null ? -1 : rows.findIndex((r) => r.value === v)),
      getRowProps,
      close: () => setOpen(false),
    });
    const status = rows.length ? undefined : loading ? config.labels?.loading ?? 'Loading…' : async && remote.failed ? config.labels?.error ?? 'Could not load results' : config.labels?.empty ?? 'No results';
    const pending = (loading || loadingMore) && rows.length ? slot('loadMore', loadingMore ? config.labels?.loadingMore ?? 'Loading more…' : config.labels?.loading ?? 'Loading…', 'div', { role: 'presentation', 'data-pending': '' }, 'pinfold-select__empty') : null;
    const body = custom ? (
      <>
        {config.renderList!(listCtx())}
        {loadingMore ? pending : null}
      </>
    ) : (
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
          status,
        })}
        {/* Results being refreshed stay, with a loading row under them; so does a page on its way. */}
        {pending}
      </>
    );
    const content = (
      <>
        {slot('label', labelContent(config, config.unstyled), 'label', { id: field.labelId, htmlFor: field.controlId, ...hiddenStyle(config.hideLabel) }, SHARED.label)}
        {placement === 'above' ? chipGroup : null}
        {slot(
          'control',
          <>
            {slot(
              'values',
              <>
                {inside ? chipList : null}
                {slot('input', null, 'input', {
                  ref: text,
                  id: field.controlId,
                  type: 'text',
                  role: 'combobox',
                  autoComplete: 'off',
                  'aria-autocomplete': 'list',
                  'aria-haspopup': custom ? popupRole : undefined,
                  'aria-expanded': open,
                  'aria-controls': open ? listId : undefined,
                  'aria-activedescendant': custom && popupRole === 'dialog' ? undefined : nav.activeId,
                  'aria-describedby': field.describedBy,
                  'aria-invalid': field.invalid || undefined,
                  'aria-required': multiple && config.required ? true : undefined,
                  'aria-busy': field.validating || undefined,
                  required: !multiple && config.required ? true : undefined,
                  disabled: disabled || undefined,
                  // Chips in the field take the placeholder's place; chips elsewhere leave the field empty.
                  placeholder: multiple && value.length && inside ? undefined : config.placeholder,
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
                  onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                    // Moving into the list (a pointer press) is not leaving.
                    if (popup.current?.contains(event.relatedTarget as Node)) return;
                    setOpen(false);
                    settle();
                    field.onBlur(event.currentTarget);
                  },
                  onKeyDown,
                  onInvalid: field.onInvalid,
                })}
              </>,
              'span',
            )}
            {field.validating ? slot('validating', null, 'span', { 'aria-hidden': true }, SHARED.validating) : null}
            {canClear
              ? slot('clear', CLOSE_ICON, 'button', {
                  type: 'button',
                  tabIndex: -1,
                  'aria-label': clearLabel,
                  title: clearLabel,
                  onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
                  onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    clear(e);
                    text.current?.focus();
                  },
                })
              : null}
            {slot('chevron', CHEVRON_DOWN_ICON, 'span', {
              'aria-hidden': true,
              onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!open) nav.start();
                setOpen(!open);
                text.current?.focus();
              },
            })}
          </>,
          'div',
          { ref: control, onClick: () => text.current?.focus() },
        )}
        {placement === 'below' ? chipGroup : null}
        {(multiple ? value : value.slice(0, 1)).map((v) => (config.name ? <input key={v} type="hidden" name={config.name} value={v} /> : null))}
        {open && mounted
          ? slot('popup', body, 'div', {
              ref: popup,
              id: listId,
              role: popupRole,
              'aria-labelledby': field.labelId,
              'aria-multiselectable': (multiple && popupRole !== 'dialog') || undefined,
              'aria-busy': loading || undefined,
              'data-size': state.size,
              'data-tone': state.tone,
              'data-custom': dataAttr(custom),
              tabIndex: -1,
            })
          : null}
        {renderFieldMessages(field, config.description, (n, c, t, b) => slot(n as ComboboxSlot, c, t, b, SHARED[n]), true)}
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
      current.current = [...next];
      setRawValue(multiple ? [...next] : next[0] ?? null);
      if (!multiple) setQueryState(next[0] ? labelOf(next[0]) : '');
    },
    clear: () => clear(),
    loadMore,
    focus: () => text.current?.focus(),
    ...field.api,
    getRootProps,
    render,
  };
  return usePinfoldComponent<ComboboxApi, ComboboxRootProps>('Combobox', api, (props) => render(props));
}
