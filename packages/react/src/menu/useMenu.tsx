import * as React from 'react';
import { buttonRel, cn, dataAttr, dimensionVars, inactiveMenuOptions, mergeProps, nextIndexFromKey, typeaheadIndex, warnOnce, type OverlayRect, type PropsBag } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { followLink } from '../link';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { renderTrigger, restoreFocus, triggerElement, useFloating, useMounted, useOverlayLayer } from '../overlay';
import type { MenuActionItem, MenuApi, MenuCheckItem, MenuComponent, MenuConfig, MenuItem, MenuRootProps, MenuSlot, MenuState } from './types';

const ROWS = '[role^="menuitem"]';
const rowsOf = (menu: HTMLElement | null) => (menu ? Array.from(menu.querySelectorAll<HTMLElement>(ROWS)) : []);
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
  useOverlayLayer(showing, (node) => !!menu.current?.contains(node) || (mode === 'dropdown' && !!anchor.current?.contains(node)), close, close);

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

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const rows = rowsOf(menu.current);
    const current = rows.indexOf(document.activeElement as HTMLElement);
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
        onKeyDown: onMenuKeyDown,
      },
      props,
    );

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const slot = (name: MenuSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
    renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-menu__${name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));

  const row = (item: MenuActionItem | MenuCheckItem, key: React.Key): React.ReactNode => {
    const check = item.type === 'checkbox' || item.type === 'radio';
    const link = !check && (item as MenuActionItem).href !== undefined && !item.disabled;
    const select = (event: React.MouseEvent<HTMLElement>) => {
      if (item.disabled) {
        event.preventDefault();
        return;
      }
      item.onSelect?.(event);
      if (link) followLink(event, (item as MenuActionItem).href, ctx.navigate, (item as MenuActionItem).target);
      if (item.closeOnSelect ?? !check) close();
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
        if (event.pointerType !== 'touch' && document.activeElement !== event.currentTarget) event.currentTarget.focus();
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

  const rows = (items: readonly MenuItem[], prefix = ''): React.ReactNode =>
    items.map((item, i) => {
      const key = item.id ?? `${prefix}${i}`;
      if (item.type === 'separator') return slot('separator', null, 'div', { key, role: 'separator' });
      if (item.type === 'group') {
        const labelId = `${id}-group-${prefix}${i}`;
        return slot('group', <>{slot('groupLabel', item.label, 'div', { id: labelId })}{rows(item.items, `${prefix}${i}-`)}</>, 'div', { key, role: 'group', 'aria-labelledby': labelId });
      }
      return row(item, key);
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
      </>
    );
  };

  const api: MenuApi = { isOpen: showing, open: () => openWith('first'), close, toggle: () => (showing ? close() : openWith('first')), getTriggerProps, getRootProps, render };
  return usePinfoldComponent<MenuApi, MenuRootProps>('Menu', api, (props) => render(props));
}
