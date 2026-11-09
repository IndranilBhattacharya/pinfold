import * as React from 'react';
import { buttonRel, cn, dataAttr, dimensionVars, inactiveMenuOptions, mergeProps, nextIndexFromKey, typeaheadIndex, warnOnce, type OverlayRect, type PropsBag } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { followLink } from '../link';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { renderTrigger, restoreFocus, triggerElement, useFloating, useMounted, useOverlayLayer } from '../overlay';
import type { MenuActionItem, MenuApi, MenuCheckItem, MenuComponent, MenuConfig, MenuItem, MenuRootProps, MenuSlot, MenuState, MenuSubmenuItem } from './types';

const ROWS = '[role^="menuitem"]';
// A menu's own rows: not those of a submenu nested in the same tree.
const rowsOf = (menu: HTMLElement | null) => (menu ? Array.from(menu.querySelectorAll<HTMLElement>(ROWS)).filter((row) => row.closest('[role="menu"]') === menu) : []);
const HOVER_DELAY = 120;
const CHEVRON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path d="m6 4 4 4-4 4" />
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
  const menu = React.useRef<HTMLDivElement | null>(null);
  const focusOnOpen = React.useRef<'first' | 'last'>('first');
  const query = React.useRef({ text: '', at: 0 });
  const [isOpen, setOpen] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false, onChange: config.onOpenChange });
  // Open submenus, outermost first, by the id of the row that opened each.
  const [path, setPath] = React.useState<string[]>([]);
  const subItems = React.useRef<Record<string, readonly MenuItem[]>>({});
  const focusSub = React.useRef(false);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const mode = config.mode ?? 'dropdown';

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ menuMeta, validateConfig }) => {
      for (const problem of validateConfig(menuMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveMenuOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Menu: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(mode === 'context' && !config.label, 'Menu: a context menu has no trigger to be named by. Give it a `label`.');
  }

  const showing = isOpen && mounted;
  const state: MenuState = { open: showing, mode, size: config.size ?? ctx.size };
  const close = () => setOpen(false);
  const openWith = (focus: 'first' | 'last') => {
    focusOnOpen.current = focus;
    setOpen(true);
  };

  const contextAnchor = (): Element | OverlayRect | null => {
    const area = anchor.current;
    if (!area || !point.current) return area;
    const rect = area.getBoundingClientRect();
    spot.current.x = rect.x + point.current.dx;
    spot.current.y = rect.y + point.current.dy;
    return spot.current;
  };
  useFloating({ open: showing, key: placed, anchor: () => (mode === 'context' ? contextAnchor() : anchor.current), floating: menu, placement: mode === 'context' ? 'bottom-start' : config.placement ?? 'bottom-start', offset: mode === 'context' ? 0 : config.offset ?? 4 });
  const inSubmenu = (node: Node) => !!(node instanceof Element ? node : node.parentElement)?.closest(`[data-menu-of="${id}"]`);
  useOverlayLayer(showing, (node) => !!menu.current?.contains(node) || inSubmenu(node) || (mode === 'dropdown' && !!anchor.current?.contains(node)), close, close);
  React.useEffect(() => {
    if (!showing) setPath([]);
  }, [showing]);
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

  // Opening moves focus to a row and closing brings it back. A menu open from the first render
  // (a preview, a test) never takes focus.
  const wasOpen = React.useRef(showing);
  useIsomorphicLayoutEffect(() => {
    if (wasOpen.current === showing) return;
    wasOpen.current = showing;
    if (showing) {
      const rows = rowsOf(menu.current);
      (focusOnOpen.current === 'last' ? rows[rows.length - 1] : rows[0])?.focus();
    } else restoreFocus(anchor.current, menu.current);
  }, [showing]);

  const onKeys = (depth: number) => (event: React.KeyboardEvent<HTMLElement>) => {
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
      // Back on the trigger first, so the browser's Tab moves on from there.
      if (anchor.current instanceof HTMLElement) anchor.current.focus();
      close();
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
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      query.current = { text: now - query.current.at > TYPEAHEAD_RESET ? event.key : query.current.text + event.key, at: now };
      const match = typeaheadIndex(rows.map((row) => row.textContent ?? ''), query.current.text, current);
      if (match !== -1) rows[match].focus();
    }
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
              if (!showing) openWith('first');
              else (menu.current?.querySelector('[role^="menuitem"]:not([aria-disabled="true"])') as HTMLElement | null)?.focus();
            },
          }
        : {
            id: triggerId,
            'aria-haspopup': 'menu',
            'aria-expanded': showing,
            'aria-controls': showing ? id : undefined,
            onClick: () => (showing ? close() : openWith('first')),
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
              event.preventDefault();
              openWith(event.key === 'ArrowUp' ? 'last' : 'first');
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
        ref: menu,
        id,
        role: 'menu',
        tabIndex: -1,
        'aria-label': config.label,
        'aria-labelledby': config.label || mode === 'context' ? undefined : triggerId,
        'data-mode': mode,
        'data-size': state.size,
        'data-placement': config.placement ?? 'bottom-start',
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        onKeyDown: onKeys(0),
      },
      props,
    );

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const slot = (name: MenuSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
    renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-menu__${name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));

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

  const row = (item: MenuActionItem | MenuCheckItem, key: React.Key, depth = 0): React.ReactNode => {
    const check = item.type === 'checkbox' || item.type === 'radio';
    const link = !check && (item as MenuActionItem).href !== undefined && !item.disabled;
    const select = (event: React.MouseEvent<HTMLElement>) => {
      if (item.disabled) {
        event.preventDefault();
        return;
      }
      item.onSelect?.(event);
      if (link) followLink(event, (item as MenuActionItem).href, ctx.navigate, (item as MenuActionItem).target);
      if (item.closeOnSelect ?? !check) {
        setPath([]);
        close();
      }
    };
    const base: PropsBag = {
      key,
      role: item.type === 'checkbox' ? 'menuitemcheckbox' : item.type === 'radio' ? 'menuitemradio' : 'menuitem',
      tabIndex: -1,
      'aria-checked': check ? !!(item as MenuCheckItem).checked : undefined,
      'aria-disabled': item.disabled ? true : undefined,
      'data-disabled': dataAttr(item.disabled),
      'data-tone': item.tone,
      'data-type': check ? item.type : undefined,
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
    const content = (
      <>
        {check ? slot('indicator', (item as MenuCheckItem).checked ? (item.type === 'radio' ? DOT : TICK) : null, 'span', { 'aria-hidden': true }) : null}
        {item.icon != null && item.icon !== false ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
        {slot('label', item.label, 'span')}
        {item.shortcut != null && item.shortcut !== false ? slot('shortcut', item.shortcut, 'span') : null}
      </>
    );
    return slot('item', content, link ? 'a' : 'div', base);
  };

  const rows = (items: readonly MenuItem[], prefix = '', depth = 0): React.ReactNode =>
    items.map((item, i) => {
      const key = item.id ?? `${prefix}${i}`;
      if (item.type === 'submenu') return submenuRow(item, key, `${id}-row-${prefix}${i}`, depth);
      if (item.type === 'separator') return slot('separator', null, 'div', { key, role: 'separator' });
      if (item.type === 'group') {
        const labelId = `${id}-group-${prefix}${i}`;
        return slot('group', <>{slot('groupLabel', item.label, 'div', { id: labelId })}{rows(item.items, `${prefix}${i}-`, depth)}</>, 'div', { key, role: 'group', 'aria-labelledby': labelId });
      }
      return row(item, key, depth);
    });

  const render = (rootProps?: MenuRootProps): React.ReactElement => {
    const vars = dimensionVars('menu', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-menu', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    return (
      <>
        {renderTrigger(config.trigger, triggerProps(), (el) => {
          if (el) anchor.current = triggerElement(el);
        })}
        {showing ? renderSlot(config, 'root', root, state, rows(config.items ?? []), (p, c) => <div {...p}>{c}</div>) : null}
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

  const api: MenuApi = { isOpen: showing, open: () => openWith('first'), close, toggle: () => (showing ? close() : openWith('first')), getTriggerProps, getRootProps, render };
  return usePinfoldComponent<MenuApi, MenuRootProps>('Menu', api, (props) => render(props));
}
