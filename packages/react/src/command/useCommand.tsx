import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveCommandOptions, matchesQuery, matchHotkey, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { renderRows, useAsyncRows, useListNav, useNearEnd, type Row } from '../select/listbox';
import type { CommandApi, CommandComponent, CommandConfig, CommandHint, CommandItem, CommandRootProps, CommandSlot, CommandState } from './types';

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/**
 * A command palette: type to find a command, arrows to move, Enter to run. On the page, or a modal
 * dialog that a hotkey (⌘K / Ctrl+K) opens from anywhere, as a hook that hands back a component.
 *
 *   const Palette = useCommand({ label: 'Commands', mode: 'dialog', items });
 *   return <Palette />;
 *
 * Precedence: this config, then `defaults.command`, then the provider (size, tone), then the library default.
 */
export function useCommand(input: CommandConfig): CommandComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.command ? mergeConfig<CommandConfig>(ctx.defaults.command, input) : input;
  const base = useId();
  const dialog = config.mode === 'dialog';
  const [isOpen, setOpenState] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false });
  const open = dialog ? isOpen : true;
  const [query, setQueryState] = useControllableState<string>({ value: config.inputValue, defaultValue: config.defaultInputValue ?? '' });
  const root = React.useRef<HTMLElement | null>(null);
  const field = React.useRef<HTMLInputElement | null>(null);
  const listId = `${base}-list`;
  const list = React.useRef<HTMLDivElement | null>(null);
  const async = !!config.loadItems;
  const remote = useAsyncRows<CommandItem | string>({ load: config.loadItems, query, active: open, debounce: config.debounce ?? 250 });
  const items: CommandItem[] = ((async ? remote.items : config.items) ?? []).map((item) => (typeof item === 'string' ? { label: item } : item));
  const valueOf = (item: CommandItem, i: number) => item.value ?? (typeof item.label === 'string' ? item.label : item.textValue ?? String(i));
  const textOf = (item: CommandItem) => item.textValue ?? (typeof item.label === 'string' ? item.label : item.value ?? '');
  const matched = items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => [textOf(item), ...(item.keywords ?? [])].some((t) => matchesQuery(t, query, config.filter ?? (async ? 'none' : 'contains'))));
  // Grouped in the order groups first appear, as a select's rows are.
  const order = [...new Set(matched.map(({ item }) => item.group ?? ''))];
  const sorted = order.length > 1 ? order.flatMap((g) => matched.filter(({ item }) => (item.group ?? '') === g)) : matched;
  const rows: Row[] = sorted.map(({ item, i }) => ({ value: valueOf(item, i), label: item.label, text: textOf(item), description: item.description, icon: item.icon, avatar: item.avatar, endContent: item.endContent, group: item.group, disabled: !!item.disabled, end: item.shortcut, data: item as never }));
  const nav = useListNav({ rows, open, selected: [], listId });
  const loading = !!config.loading || (async && remote.loading);
  useNearEnd(list, open && async && remote.hasMore && !loading, nav.active, rows.length, remote.loadMore);
  const highlighted = rows[nav.active]?.value ?? null;
  const lastHighlight = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!config.onHighlight || lastHighlight.current === highlighted) return;
    lastHighlight.current = highlighted;
    config.onHighlight(highlighted);
  });

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ commandMeta, validateConfig }) => {
      for (const problem of validateConfig(commandMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveCommandOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Command: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Command: give it a `label`, e.g. "Commands": it names the palette for screen readers.');
  }

  const state: CommandState = { mode: dialog ? 'dialog' : 'inline', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, open, loading, query };

  const setOpen = (next: boolean) => {
    if (!dialog || next === isOpen) return;
    setOpenState(next);
    config.onOpenChange?.(next);
  };
  const setQuery = (next: string) => {
    setQueryState(next);
    config.onInputChange?.(next);
  };
  // The first command that can run is active as you type, so Enter runs it.
  React.useEffect(() => {
    if (open) nav.setActive(rows.findIndex((r) => !r.disabled));
  }, [query, open, rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (row: Row, event: React.SyntheticEvent) => {
    const at = sorted[rows.indexOf(row)];
    if (!at || row.disabled) return;
    at.item.onSelect?.(event);
    config.onSelect?.(row.value, event);
    if (at.item.href !== undefined) {
      if (ctx.navigate) ctx.navigate(at.item.href);
      else if (typeof window !== 'undefined') window.location.assign(at.item.href);
    }
    if (dialog && config.closeOnSelect !== false) {
      setOpen(false);
      setQuery('');
    }
  };

  // The hotkey opens the dialog from anywhere on the page.
  React.useEffect(() => {
    const hotkey = config.hotkey ?? 'mod+k';
    if (!dialog || !hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if (!matchHotkey(event, hotkey, /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))) return;
      event.preventDefault();
      setOpen(!isOpen);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // The dialog: the browser's modal (top layer, inert page, Escape, focus return); focus to the field.
  useIsomorphicLayoutEffect(() => {
    const el = root.current as HTMLDialogElement | null;
    if (!dialog || !el || !isOpen) return;
    if (!el.hasAttribute('open')) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    }
    field.current?.focus();
    return () => {
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
    };
  }, [dialog, isOpen]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (rows[nav.active]) {
        event.preventDefault();
        run(rows[nav.active], event);
      }
    } else if (event.key === 'Escape') {
      // A dialog closes (the browser's cancel); on the page, Escape clears the text.
      if (!dialog && query) {
        event.preventDefault();
        setQuery('');
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      nav.move(event.key);
    }
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'data-mode': state.mode,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-loading': dataAttr(state.loading),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: CommandRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: CommandSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-command__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('command', config.dimensions);
    const labels = config.labels ?? {};
    const empty = typeof config.emptyText === 'function' ? config.emptyText(query) : config.emptyText ?? 'No results';
    const hints: readonly CommandHint[] = config.hints ?? [{ keys: ['↑', '↓'], label: 'to move' }, { keys: ['↵'], label: 'to run' }, ...(dialog ? [{ keys: ['esc'], label: 'to close' }] : [])];
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(
        mergeProps(
          {
            ref: root,
            className: config.unstyled ? config.className : cn('pinfold pinfold-command', config.className),
            style: vars || config.style ? { ...vars, ...config.style } : undefined,
            ...(dialog
              ? {
                  'aria-label': config.label,
                  // The browser closes on Escape; follow it.
                  onCancel: (event: React.SyntheticEvent) => {
                    event.preventDefault();
                    setOpen(false);
                  },
                  // A press on the backdrop (the dialog element itself) closes.
                  onClick: (event: React.MouseEvent) => {
                    if (event.target === event.currentTarget) setOpen(false);
                  },
                }
              : {}),
          },
          rootProps,
        ),
      ),
    );
    const panel = slot(
      'panel',
      <>
        {slot(
          'search',
          <>
            {slot('searchIcon', SEARCH_ICON, 'span', { 'aria-hidden': true })}
            {slot('input', null, 'input', {
              ref: field,
              type: 'text',
              role: 'combobox',
              autoComplete: 'off',
              spellCheck: false,
              'aria-label': config.label,
              'aria-autocomplete': 'list',
              'aria-expanded': open,
              'aria-controls': listId,
              'aria-activedescendant': nav.activeId,
              placeholder: config.placeholder ?? 'Type a command or search…',
              value: query,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
              onKeyDown,
            })}
          </>,
          'div',
        )}
        {slot(
          'list',
          <>
          {renderRows({
            rows,
            slot: slot as never,
            listId,
            labelId: '',
            multiple: false,
            selected: [],
            active: nav.active,
            setActive: nav.setActive,
            optionId: nav.optionId,
            onPick: (row, event) => run(row, event),
            query,
            checks: false,
            unstyled: config.unstyled,
            status: rows.length ? undefined : loading ? labels.loading ?? 'Loading…' : async && remote.failed ? labels.error ?? 'Could not load results' : empty,
          })}
          {/* Commands being refreshed stay, with a loading row under them; so does a page on its way. */}
          {(loading || remote.loadingMore) && rows.length
            ? slot('loadMore', remote.loadingMore ? labels.loadingMore ?? 'Loading more…' : labels.loading ?? 'Loading…', 'div', { role: 'presentation', 'data-pending': '', className: cls('pinfold-command__loadMore pinfold-command__empty') })
            : null}
          </>,
          'div',
          { ref: list, id: listId, role: 'listbox', 'aria-label': config.label, 'aria-busy': loading || undefined },
        )}
        {config.footer === false
          ? null
          : slot(
              'footer',
              <>
                {/* Decorative: the keys are the field's own and are in the docs. */}
                <span aria-hidden="true" className={cls('pinfold-command__hints')}>
                  {hints.map((h, n) => (
                    <React.Fragment key={n}>
                      {slot(
                        'hint',
                        <>
                          {h.keys.map((k) => (
                            <kbd key={k}>{k}</kbd>
                          ))}
                          <span>{h.label}</span>
                        </>,
                        'span',
                      )}
                    </React.Fragment>
                  ))}
                </span>
                {config.footerContent != null ? slot('footerContent', config.footerContent, 'span') : null}
              </>,
              'div',
            )}
      </>,
      'div',
    );
    // A closed dialog stays in the DOM (the hotkey and the open state need it), empty.
    return renderSlot(config, 'root', rootBag, state, dialog && !isOpen ? null : panel, (p, c) => (dialog ? <dialog {...p}>{c}</dialog> : <div {...p}>{c}</div>)) as React.ReactElement;
  };

  const api: CommandApi = { isOpen: open, open: () => setOpen(true), close: () => setOpen(false), inputValue: query, focus: () => field.current?.focus(), setInputValue: setQuery, getRootProps, render };
  return usePinfoldComponent<CommandApi, CommandRootProps>('Command', api, (props) => render(props));
}
