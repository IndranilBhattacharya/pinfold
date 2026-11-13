import * as React from 'react';
import { buttonRel, cn, dataAttr, dimensionVars, inactiveMenuOptions, mergeProps, nextIndexFromKey, resolveNode, typeaheadIndex, warnOnce, watchScrollEdges, type OverlayRect, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { followLink } from '../link';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { renderTrigger, restoreFocus, triggerElement, useFloating, useMounted, useOverlayLayer, usePresence } from '../overlay';
import type { MenuActionItem, MenuApi, MenuChangeReason, MenuCheckItem, MenuComponent, MenuConfig, MenuItem, MenuRootProps, MenuRowState, MenuSlot, MenuState, MenuSubmenuItem } from './types';

const ROWS = '[role^="menuitem"]';
// A menu's own rows: not those of a submenu nested in the same tree.
const rowsOf = (menu: HTMLElement | null) => (menu ? Array.from(menu.querySelectorAll<HTMLElement>(ROWS)).filter((row) => row.closest('[role="menu"]') === menu) : []);
const HOVER_DELAY = 120;
const CHEVRON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path d="m6 4 4 4-4 4" />
  </svg>
);
const SEARCH = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" focusable="false" aria-hidden="true">
    <circle cx="7" cy="7" r="4.25" />
    <path d="m10.25 10.25 3 3" />
  </svg>
);

/** A submenu: its own floating menu beside the row that opened it. */
function SubPanel({ anchorId, props, children }: { anchorId: string; props: PropsBag; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useFloating({ open: true, anchor: () => document.getElementById(anchorId), floating: ref, placement: 'end-top', offset: 2 });
  return <div {...props} ref={ref}>{children}</div>;
}
const TYPEAHEAD_RESET = 500;

const TICK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);
const DOT = (
  <svg viewBox="0 0 16 16" fill="currentColor" focusable="false">
    <circle cx="8" cy="8" r="3" />
  </svg>
);

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const toArray = (v: string | readonly string[] | null | undefined): string[] => (v == null ? [] : typeof v === 'string' ? [v] : [...v]);
/** The text a row is found by: typeahead and search. */
const textOf = (item: { label?: React.ReactNode; textValue?: string }) => item.textValue ?? (typeof item.label === 'string' || typeof item.label === 'number' ? String(item.label) : '');

/** A set of rows whose checks the menu owns: the whole menu, or one group. */
interface Scope {
  key: string;
  mode: 'single' | 'multiple';
  value?: string | readonly string[];
  defaultValue?: string | readonly string[];
  onChange?: (value: string & string[], item: MenuItem) => void;
}

/**
 * A dropdown or context menu from a list of rows, as a hook that hands back a component.
 *
 *   const Actions = useMenu({ trigger: { label: 'Actions' }, items: [{ label: 'Edit', onSelect: edit }] });
 *   return <Actions />;
 *
 * The same value is the controller (`Actions.isOpen`, `.open()`, `.close()`, `.toggle()`).
 * Precedence: this config, then `defaults.menu`, then the provider (size), then the library default.
 */
export function useMenu(input: MenuConfig): MenuComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.menu ? mergeConfig<MenuConfig>(ctx.defaults.menu, input) : input;
  const id = useId();
  const triggerId = `${id}-trigger`;
  const mounted = useMounted();
  const anchor = React.useRef<Element | null>(null);
  // A context menu's point, kept as an offset inside the area that was clicked, so it moves with that
  // area when the page scrolls. One object, reused for every frame of tracking.
  const point = React.useRef<{ dx: number; dy: number } | null>(null);
  const spot = React.useRef<OverlayRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [placed, setPlaced] = React.useState(0);
  const panel = React.useRef<HTMLDivElement | null>(null);
  const menu = React.useRef<HTMLDivElement | null>(null);
  const search = React.useRef<HTMLInputElement | null>(null);
  const focusOnOpen = React.useRef<'first' | 'last'>('first');
  const query = React.useRef({ text: '', at: 0 });
  const reason = React.useRef<MenuChangeReason>('api');
  const [isOpen, setOpenState] = useControllableState<boolean>({
    value: config.open,
    defaultValue: config.defaultOpen ?? false,
    onChange: (open) => config.onOpenChange?.(open, reason.current),
  });
  const setOpen = (next: boolean, why: MenuChangeReason) => {
    reason.current = why;
    setOpenState(next);
  };
  // Open submenus, outermost first, by the id of the row that opened each.
  const [path, setPath] = React.useState<string[]>([]);
  const subItems = React.useRef<Record<string, readonly MenuItem[]>>({});
  const focusSub = React.useRef(false);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(hoverTimer.current), []);
  // The checks the menu owns, per scope, while uncontrolled.
  const [owned, setOwned] = React.useState<Record<string, string[]>>({});
  const [term, setTermState] = React.useState('');
  const setTerm = (next: string) => {
    setTermState(next);
    config.onSearchChange?.(next);
  };
  const mode = config.mode ?? 'dropdown';
  const searchable = !!config.searchable;
  const labels = { search: 'Search', empty: 'No results', loading: 'Loading', ...config.labels };

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ menuMeta, validateConfig }) => {
      for (const problem of validateConfig(menuMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveMenuOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Menu: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(mode === 'context' && !config.label, 'Menu: a context menu has no trigger to be named by. Give it a `label`.');
  }

  const showing = isOpen && mounted;
  const present = usePresence(showing, panel);
  const state: MenuState = { open: showing, mode, size: config.size ?? ctx.size };
  const close = (why: MenuChangeReason = 'api') => setOpen(false, why);
  const openWith = (focus: 'first' | 'last', why: MenuChangeReason) => {
    focusOnOpen.current = focus;
    setOpen(true, why);
  };

  const contextAnchor = (): Element | OverlayRect | null => {
    const area = anchor.current;
    if (!area || !point.current) return area;
    const rect = area.getBoundingClientRect();
    spot.current.x = rect.x + point.current.dx;
    spot.current.y = rect.y + point.current.dy;
    return spot.current;
  };
  useFloating({ open: present, key: placed, anchor: () => (mode === 'context' ? contextAnchor() : anchor.current), floating: panel, placement: mode === 'context' ? 'bottom-start' : config.placement ?? 'bottom-start', offset: mode === 'context' ? 0 : config.offset ?? 4 });
  const inSubmenu = (node: Node) => !!(node instanceof Element ? node : node.parentElement)?.closest(`[data-menu-of="${id}"]`);
  useOverlayLayer(
    showing,
    (node) => !!panel.current?.contains(node) || inSubmenu(node) || (mode === 'dropdown' && !!anchor.current?.contains(node)),
    () => close('escape'),
    () => close('outside'),
  );
  React.useEffect(() => {
    if (showing) return;
    setPath([]);
    setTermState('');
  }, [showing]);
  // The rows scroll inside the panel: say which edges hide more, for the fades.
  useIsomorphicLayoutEffect(() => {
    const list = menu.current;
    if (!present || !list || !panel.current) return;
    return watchScrollEdges(list, { target: panel.current });
  }, [present]);
  // A submenu opened from the keyboard takes focus on its first row.
  useIsomorphicLayoutEffect(() => {
    if (!focusSub.current || !path.length) return;
    focusSub.current = false;
    rowsOf(document.getElementById(`${path[path.length - 1]}-menu`))[0]?.focus();
  }, [path]);
  const openSub = (depth: number, rowId: string, focus: boolean) => {
    focusSub.current = focus;
    setPath((p) => (p[depth] === rowId && p.length === depth + 1 ? p : [...p.slice(0, depth), rowId]));
    if (focus && path[depth] === rowId && path.length === depth + 1) rowsOf(document.getElementById(`${rowId}-menu`))[0]?.focus();
  };

  // Opening moves focus to a row (or the search field) and closing brings it back. A menu open from
  // the first render (a preview, a test) never takes focus.
  const wasOpen = React.useRef(showing);
  useIsomorphicLayoutEffect(() => {
    if (wasOpen.current === showing) return;
    wasOpen.current = showing;
    if (showing) {
      if (search.current) {
        search.current.focus();
        return;
      }
      const rows = rowsOf(menu.current);
      (focusOnOpen.current === 'last' ? rows[rows.length - 1] : rows[0])?.focus();
    } else restoreFocus(anchor.current, panel.current);
  }, [showing]);

  const leave = () => {
    // Back on the trigger first, so the browser's Tab moves on from there.
    if (anchor.current instanceof HTMLElement) anchor.current.focus();
    close('tab');
  };
  const typeInto = (next: string) => {
    search.current?.focus();
    setTerm(next);
  };

  const onKeys = (depth: number) => (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLInputElement && event.target === search.current) return;
    const rows = rowsOf(event.currentTarget);
    const current = rows.indexOf(document.activeElement as HTMLElement);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const inward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const outward = rtl ? 'ArrowRight' : 'ArrowLeft';
    const row = rows[current];
    if (event.key === inward && row?.getAttribute('aria-haspopup') === 'menu' && row.getAttribute('aria-disabled') !== 'true') {
      event.preventDefault();
      openSub(depth, row.id, true);
      return;
    }
    // Out of a submenu: back to the row that opened it. The whole menu stays open.
    if (depth > 0 && (event.key === outward || event.key === 'Escape')) {
      event.preventDefault();
      event.stopPropagation();
      const parent = path[depth - 1];
      setPath((p) => p.slice(0, depth - 1));
      document.getElementById(parent)?.focus();
      return;
    }
    if (event.key === 'Tab') {
      leave();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (current !== -1) rows[current].click();
      return;
    }
    const next = nextIndexFromKey(event.key, current, rows.length, { loop: config.loop ?? true });
    if (next !== null) {
      event.preventDefault();
      rows[next]?.focus();
      return;
    }
    const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    // A searchable menu: typing on a row goes on in the search field.
    if (depth === 0 && searchable && (printable || event.key === 'Backspace')) {
      event.preventDefault();
      typeInto(event.key === 'Backspace' ? term.slice(0, -1) : term + event.key);
      return;
    }
    if (printable) {
      const now = Date.now();
      query.current = { text: now - query.current.at > TYPEAHEAD_RESET ? event.key : query.current.text + event.key, at: now };
      const match = typeaheadIndex(rows.map((r) => r.getAttribute('data-text') ?? r.textContent ?? ''), query.current.text, current);
      if (match !== -1) rows[match].focus();
    }
  };

  const onSearchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const rows = rowsOf(menu.current);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      (event.key === 'ArrowDown' ? rows[0] : rows[rows.length - 1])?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      rows.find((r) => r.getAttribute('aria-disabled') !== 'true')?.click();
    } else if (event.key === 'Escape' && term) {
      // The first Escape clears the search; the dismiss stack skips a handled key.
      event.preventDefault();
      setTerm('');
    } else if (event.key === 'Tab') leave();
  };

  const triggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      mode === 'context'
        ? {
            onContextMenu: (event: React.MouseEvent<Element>) => {
              event.preventDefault();
              // The keyboard's Menu key reports no pointer position: open at the area's corner instead.
              const area = event.currentTarget;
              const rect = area.getBoundingClientRect();
              point.current = event.clientX || event.clientY ? { dx: event.clientX - rect.x, dy: event.clientY - rect.y } : null;
              anchor.current = area;
              // Already open: move it to the new point, with no close and reopen.
              setPlaced((n) => n + 1);
              if (!showing) openWith('first', 'contextmenu');
              else (menu.current?.querySelector('[role^="menuitem"]:not([aria-disabled="true"])') as HTMLElement | null)?.focus();
            },
          }
        : {
            id: triggerId,
            'aria-haspopup': 'menu',
            'aria-expanded': showing,
            'aria-controls': showing ? id : undefined,
            onClick: () => (showing ? close('trigger') : openWith('first', 'trigger')),
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
              event.preventDefault();
              openWith(event.key === 'ArrowUp' ? 'last' : 'first', 'keyboard');
            },
          },
      props,
    );
  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: (el: Element | null) => {
          anchor.current = el;
        },
      },
      triggerProps(props),
    );

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: panel,
        id: `${id}-panel`,
        'aria-hidden': showing ? undefined : true,
        'data-mode': mode,
        'data-size': state.size,
        'data-state': showing ? 'open' : 'closed',
        'data-placement': config.placement ?? 'bottom-start',
        'data-searchable': dataAttr(searchable),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );
  const getListProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: menu,
        id,
        role: 'menu',
        tabIndex: -1,
        'aria-label': config.label,
        'aria-labelledby': config.label || mode === 'context' ? undefined : triggerId,
        'aria-busy': config.loading || undefined,
        onKeyDown: onKeys(0),
      },
      props,
    );

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const slot = (name: MenuSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
    renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-menu__${name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));

  // ---- selection the menu owns ----
  const checkedIn = (scope: Scope): string[] => (scope.value !== undefined ? toArray(scope.value) : owned[scope.key] ?? toArray(scope.defaultValue));
  const toggleIn = (scope: Scope, rowId: string, item: MenuItem) => {
    const now = checkedIn(scope);
    const next = scope.mode === 'single' ? [rowId] : now.includes(rowId) ? now.filter((v) => v !== rowId) : [...now, rowId];
    if (scope.value === undefined) setOwned((o) => ({ ...o, [scope.key]: next }));
    scope.onChange?.((scope.mode === 'single' ? rowId : next) as string & string[], item);
  };

  // ---- search ----
  const needle = searchable ? term.trim().toLocaleLowerCase() : '';
  const matches = (item: MenuItem): boolean => {
    if (!needle || item.type === 'separator' || item.type === 'group') return true;
    if (config.filter) return config.filter(item, term);
    const description = (item as MenuActionItem).description;
    const text = `${textOf(item as MenuActionItem)} ${typeof description === 'string' ? description : ''}`.toLocaleLowerCase();
    return text.includes(needle);
  };
  const visible = (item: MenuItem): boolean => {
    if (!needle) return true;
    if (item.type === 'separator') return false;
    if (item.type === 'group') return item.items.some(visible);
    return matches(item);
  };

  const submenuRow = (item: MenuSubmenuItem, key: React.Key, rowId: string, depth: number): React.ReactNode => {
    subItems.current[rowId] = item.items;
    const open = path[depth] === rowId;
    const content = (
      <>
        {item.icon != null && item.icon !== false ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
        {slot('label', item.label, 'span')}
        {slot('chevron', CHEVRON, 'span', { 'aria-hidden': true })}
      </>
    );
    return slot('item', content, 'div', {
      [ITEM]: { ...item, index: Number(key) || 0, open },
      key,
      id: rowId,
      role: 'menuitem',
      tabIndex: -1,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      'aria-controls': open ? `${rowId}-menu` : undefined,
      'aria-disabled': item.disabled ? true : undefined,
      'data-disabled': dataAttr(item.disabled),
      'data-tone': item.tone,
      'data-type': 'submenu',
      'data-open': dataAttr(open),
      'data-text': textOf(item) || undefined,
      onClick: () => {
        if (!item.disabled) openSub(depth, rowId, true);
      },
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        if (event.pointerType === 'touch') return;
        if (document.activeElement !== event.currentTarget) event.currentTarget.focus();
        clearTimeout(hoverTimer.current);
        if (!item.disabled && !open) hoverTimer.current = setTimeout(() => openSub(depth, rowId, false), HOVER_DELAY);
      },
    });
  };

  const row = (item: MenuActionItem | MenuCheckItem, key: string, depth: number, scope: Scope | null): React.ReactNode => {
    const rowId = item.id ?? (textOf(item) || key);
    const managed = !!scope && item.type !== 'checkbox' && item.type !== 'radio';
    const kind = managed ? (scope!.mode === 'single' ? 'radio' : 'checkbox') : item.type === 'checkbox' || item.type === 'radio' ? item.type : null;
    const check = kind !== null;
    const checked = managed ? checkedIn(scope!).includes(rowId) : !!(item as MenuCheckItem).checked;
    const selected = !check && !!(item as MenuActionItem).selected;
    const link = !check && (item as MenuActionItem).href !== undefined && !item.disabled;
    const reasonId = item.disabled && item.disabledReason ? `${id}-reason-${key}` : undefined;
    const select = (event: React.MouseEvent<HTMLElement>) => {
      if (item.disabled) {
        event.preventDefault();
        return;
      }
      item.onSelect?.(event);
      if (managed) toggleIn(scope!, rowId, item);
      config.onAction?.(item.id ?? key, item);
      if (link) followLink(event, (item as MenuActionItem).href, ctx.navigate, (item as MenuActionItem).target);
      if (item.closeOnSelect ?? config.closeOnSelect ?? !check) {
        setPath([]);
        close('select');
      }
    };
    const base: PropsBag = {
      [ITEM]: item,
      key,
      role: kind === 'checkbox' ? 'menuitemcheckbox' : kind === 'radio' ? 'menuitemradio' : 'menuitem',
      tabIndex: -1,
      title: reasonId ? item.disabledReason : undefined,
      'aria-checked': check ? checked : undefined,
      'aria-current': selected ? true : undefined,
      'aria-disabled': item.disabled ? true : undefined,
      'aria-describedby': reasonId,
      'data-disabled': dataAttr(item.disabled),
      'data-selected': dataAttr(selected),
      'data-tone': item.tone,
      'data-type': kind ?? undefined,
      'data-text': textOf(item) || undefined,
      onClick: select,
      // Pointer and keyboard share one highlight: the focused row.
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        if (event.pointerType === 'touch') return;
        if (document.activeElement !== event.currentTarget) event.currentTarget.focus();
        // Resting on a plain row shuts the submenus deeper than it.
        clearTimeout(hoverTimer.current);
        if (path.length > depth) hoverTimer.current = setTimeout(() => setPath((p) => p.slice(0, depth)), HOVER_DELAY);
      },
      ...(link ? { href: (item as MenuActionItem).href, target: (item as MenuActionItem).target, rel: buttonRel((item as MenuActionItem).target, undefined) } : null),
    };
    const rowState: MenuRowState = { checked, selected, disabled: !!item.disabled };
    const start = item.startContent ?? item.icon;
    const custom = item.content !== undefined ? resolveNode(item.content, rowState) : undefined;
    const inner =
      custom !== undefined ? (
        custom
      ) : (
        <>
          {filled(start) ? slot('icon', start, 'span', { 'aria-hidden': item.startContent === undefined ? true : undefined }) : null}
          {filled(item.description)
            ? slot('text', <>{slot('label', item.label, 'span')}{slot('description', item.description, 'span')}</>, 'span')
            : slot('label', item.label, 'span')}
          {filled(item.endContent) ? slot('end', item.endContent, 'span') : null}
          {filled(item.shortcut) ? slot('shortcut', item.shortcut, 'span') : null}
          {selected ? slot('indicator', TICK, 'span', { 'aria-hidden': true, 'data-position': 'end' }) : null}
        </>
      );
    const content = (
      <>
        {check ? slot('indicator', checked ? (kind === 'radio' ? DOT : TICK) : null, 'span', { 'aria-hidden': true }) : null}
        {inner}
        {reasonId ? (
          <span id={reasonId} hidden>
            {item.disabledReason}
          </span>
        ) : null}
      </>
    );
    return slot('item', content, link ? 'a' : 'div', base);
  };

  const menuScope: Scope | null =
    config.selectionMode && config.selectionMode !== 'none' ? { key: '', mode: config.selectionMode, value: config.value, defaultValue: config.defaultValue, onChange: config.onValueChange } : null;

  const rows = (items: readonly MenuItem[], prefix = '', depth = 0, scope: Scope | null = null): React.ReactNode =>
    items.map((item, i) => {
      if (!visible(item)) return null;
      const key = item.id ?? `${prefix}${i}`;
      if (item.type === 'submenu') return submenuRow(item, key, `${id}-row-${prefix}${i}`, depth);
      if (item.type === 'separator') return slot('separator', null, 'div', { key, role: 'separator' });
      if (item.type === 'group') {
        const labelId = `${id}-group-${prefix}${i}`;
        const own: Scope | null = item.selectionMode ? { key: `g${prefix}${i}`, mode: item.selectionMode, value: item.value, defaultValue: item.defaultValue, onChange: item.onValueChange } : scope;
        return slot(
          'group',
          <>
            {slot('groupLabel', item.label, 'div', { id: labelId })}
            {rows(item.items, `${prefix}${i}-`, depth, own)}
          </>,
          'div',
          { key, role: 'group', 'aria-labelledby': labelId, 'data-selection-mode': item.selectionMode },
        );
      }
      return row(item, key, depth, scope);
    });

  const render = (rootProps?: MenuRootProps): React.ReactElement => {
    const vars = dimensionVars('menu', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-menu', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const items = config.items ?? [];
    const renderContext = { close: () => close('api') };
    const header = resolveNode(config.header, renderContext);
    const footer = resolveNode(config.footer, renderContext);
    const any = items.some((item) => item.type !== 'separator' && visible(item));
    const body = (
      <>
        {filled(header) ? slot('header', header, 'div') : null}
        {searchable
          ? slot(
              'search',
              <>
                {SEARCH}
                <input
                  ref={search}
                  type="search"
                  value={term}
                  placeholder={labels.search}
                  aria-label={labels.search}
                  aria-controls={id}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setTerm(e.target.value)}
                  onKeyDown={onSearchKeys}
                />
              </>,
              'div',
            )
          : null}
        {slot('list', rows(items, '', 0, menuScope), 'div', getListProps())}
        {config.loading
          ? slot(
              'loading',
              <>
                <span data-spinner="" data-motion="essential" aria-hidden="true" />
                {labels.loading}
              </>,
              'div',
              { role: 'status' },
            )
          : !any
            ? slot('empty', config.emptyContent ?? labels.empty, 'div', { role: 'status' })
            : null}
        {filled(footer) ? slot('footer', footer, 'div') : null}
      </>
    );
    return (
      <>
        {renderTrigger(config.trigger, triggerProps(), (el) => {
          if (el) anchor.current = triggerElement(el);
        })}
        {present ? renderSlot(config, 'root', root, state, body, (p, c) => <div {...p}>{c}</div>) : null}
        {showing
          ? path.map((rowId, depth) =>
              subItems.current[rowId] ? (
                <SubPanel
                  key={rowId}
                  anchorId={rowId}
                  props={slotProps(config, 'submenu', {
                    id: `${rowId}-menu`,
                    role: 'menu',
                    tabIndex: -1,
                    'aria-labelledby': rowId,
                    'data-menu-of': id,
                    'data-size': state.size,
                    'data-state': 'open',
                    'data-animate': dataAttr(!ctx.disableAnimation),
                    className: config.unstyled ? undefined : 'pinfold pinfold-menu pinfold-menu__submenu',
                    onKeyDown: onKeys(depth + 1),
                  })}
                >
                  {rows(subItems.current[rowId], `${rowId}-`, depth + 1)}
                </SubPanel>
              ) : null,
            )
          : null}
      </>
    );
  };

  const api: MenuApi = {
    isOpen: showing,
    open: () => openWith('first', 'api'),
    close: () => close('api'),
    toggle: () => (showing ? close('api') : openWith('first', 'api')),
    getTriggerProps,
    getRootProps,
    getListProps,
    render,
  };
  return usePinfoldComponent<MenuApi, MenuRootProps>('Menu', api, (props) => render(props));
}
