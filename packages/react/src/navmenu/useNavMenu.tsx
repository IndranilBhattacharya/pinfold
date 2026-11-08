import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveNavMenuOptions, mergeProps, pushOverlayLayer, sidebarKey, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { CHEVRON_DOWN_ICON } from '../nav-icons';
import type { NavMenuApi, NavMenuComponent, NavMenuConfig, NavMenuItem, NavMenuLink, NavMenuRootProps, NavMenuSlot, NavMenuState } from './types';

const toItem = (item: NavMenuItem | string): NavMenuItem => (typeof item === 'string' ? { label: item } : item);
const hasPanel = (item: NavMenuItem) => !!item.items?.length || item.content != null;
const OPEN_DELAY = 120;
const CLOSE_DELAY = 260;

/** Focus the next, previous, first or last element of a list, wrapping. */
function moveFocus(list: HTMLElement[], from: Element | null, key: string, forward: string, back: string): boolean {
  if (!list.length) return false;
  const at = list.indexOf(from as HTMLElement);
  const next = key === forward ? (at + 1) % list.length : key === back ? (at - 1 + list.length) % list.length : key === 'Home' ? 0 : key === 'End' ? list.length - 1 : -1;
  if (next < 0) return false;
  list[next].focus();
  return true;
}

/**
 * A site's top navigation: links, and buttons that open panels of links with descriptions and
 * icons (a mega menu), on hover or press. The disclosure pattern: no menu roles, plain Tab order,
 * plus arrow keys. As a hook that hands back a component.
 *
 *   const Nav = useNavMenu({ label: 'Main', value: pathname, items });
 *   return <Nav />;
 *
 * Precedence: this config, then `defaults.navmenu`, then the provider (size, tone), then the library default.
 */
export function useNavMenu(input: NavMenuConfig): NavMenuComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.navmenu ? mergeConfig<NavMenuConfig>(ctx.defaults.navmenu, input) : input;
  const base = useId();
  const items = (config.items ?? []).map(toItem);
  const [value, setValue] = useControllableState<string | undefined>({ value: config.value, defaultValue: config.defaultValue });
  const [open, setOpenState] = useControllableState<string | null>({ value: config.open, defaultValue: config.defaultOpen ?? null, onChange: config.onOpenChange });
  const root = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverOpenedAt = React.useRef(0);
  const latest = React.useRef(open);
  latest.current = open;
  const hover = (config.openOn ?? 'hover') === 'hover';

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ navmenuMeta, validateConfig }) => {
      for (const problem of validateConfig(navmenuMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveNavMenuOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Navigation menu: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const setOpen = (key: string | null) => {
    clearTimeout(timer.current);
    if (key !== latest.current) setOpenState(key);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const trigger = (key: string | null) => [...(root.current?.querySelectorAll<HTMLElement>('[data-nm-key]') ?? [])].find((el) => el.dataset.nmKey === key) ?? null;

  // Escape closes and returns focus to the button; a press outside closes.
  React.useEffect(() => {
    if (open === null || typeof document === 'undefined') return;
    return pushOverlayLayer({
      contains: (node) => !!root.current?.contains(node),
      onEscape: () => {
        const t = trigger(latest.current);
        setOpen(null);
        t?.focus();
      },
      onOutside: () => setOpen(null),
    });
  }, [open !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep every panel inside the viewport, shut ones too: they are hidden, not removed, so a panel
  // past the edge would still widen the page. Shift each back by what overflows.
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const place = () => {
      const width = document.documentElement.clientWidth;
      for (const panel of root.current?.querySelectorAll<HTMLElement>('[data-nm-panel]') ?? []) {
        panel.style.setProperty('--pinfold-nm-ix', '0px');
        const box = panel.getBoundingClientRect();
        if (!width || !box.width) continue;
        let shift = 0;
        if (box.right > width - 8) shift = width - 8 - box.right;
        if (box.left + shift < 8) shift = 8 - box.left;
        panel.style.setProperty('--pinfold-nm-ix', `${Math.round(shift)}px`);
      }
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  const state: NavMenuState = { variant: config.variant ?? 'ghost', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value, open };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-label': config.label,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        // Focus leaving the whole menu closes it.
        onBlur: (event: React.FocusEvent) => {
          const to = event.relatedTarget as Node | null;
          if (to && !root.current?.contains(to)) setOpen(null);
        },
      },
      props,
    );

  const choose = (link: NavMenuLink, key: string) => (event: React.MouseEvent) => {
    link.onClick?.(event);
    if (event.defaultPrevented || link.disabled) {
      if (link.disabled) event.preventDefault();
      return;
    }
    setValue(key);
    config.onChange?.(key, link, event);
    if (link.href !== undefined) {
      const own = config.onNavigate;
      followLink(event, link.href, own ? (href) => own(href, event) : ctx.navigate, link.target);
    }
    setOpen(null);
  };

  const topKeys = (event: React.KeyboardEvent<HTMLElement>, key: string, panel: boolean) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const tops = [...(root.current?.querySelectorAll<HTMLElement>('[data-nm-top]') ?? [])];
    if (moveFocus(tops, event.currentTarget, event.key, rtl ? 'ArrowLeft' : 'ArrowRight', rtl ? 'ArrowRight' : 'ArrowLeft')) {
      event.preventDefault();
      return;
    }
    if (panel && event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(key);
      // The panel is in the DOM already: its links take focus once it shows.
      requestAnimationFrame(() => document.getElementById(`${base}-p-${key}`)?.querySelector<HTMLElement>('[data-nm-link]')?.focus());
    }
  };

  const render = (rootProps?: NavMenuRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: NavMenuSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-navmenu__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('navmenu', config.dimensions);
    const rootEl = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ ref: root, className: config.unstyled ? config.className : cn('pinfold pinfold-navmenu', config.className), style: vars ? { ...vars, ...config.style } : config.style }, rootProps)),
    );

    const entries = items.map((item) => {
      const key = sidebarKey(item);
      const panel = hasPanel(item);
      const isOpen = panel && open === key;
      const links = (item.items ?? []).map((l) => (typeof l === 'string' ? { label: l } : l));
      const holds = links.some((l) => sidebarKey(l) === value);
      const panelId = `${base}-p-${key}`;
      const hoverProps =
        panel && hover
          ? {
              onPointerEnter: (e: React.PointerEvent) => {
                if (e.pointerType === 'touch') return;
                clearTimeout(timer.current);
                // Moving across from another open panel switches at once.
                const go = () => {
                  hoverOpenedAt.current = Date.now();
                  setOpen(key);
                };
                if (latest.current !== null && latest.current !== key) go();
                else if (latest.current !== key) timer.current = setTimeout(go, OPEN_DELAY);
              },
              onPointerLeave: (e: React.PointerEvent) => {
                if (e.pointerType === 'touch') return;
                clearTimeout(timer.current);
                if (latest.current === key) timer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
              },
            }
          : {};
      const top = panel
        ? slot(
            'trigger',
            <>
              {item.icon ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
              {item.label}
              {slot('chevron', CHEVRON_DOWN_ICON, 'span', { 'aria-hidden': true })}
            </>,
            'button',
            {
              type: 'button',
              'aria-expanded': isOpen,
              'aria-controls': panelId,
              'aria-disabled': item.disabled || undefined,
              'data-nm-top': '',
              'data-nm-key': key,
              'data-open': dataAttr(isOpen),
              'data-holds-current': dataAttr(holds),
              onClick: (event: React.MouseEvent) => {
                item.onClick?.(event);
                if (event.defaultPrevented || item.disabled) return;
                // A press right after hover opened it keeps it open.
                if (isOpen && Date.now() - hoverOpenedAt.current < 400) return;
                setOpen(isOpen ? null : key);
              },
              onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => topKeys(event, key, true),
            },
          )
        : slot(
            'link',
            <>
              {item.icon ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
              {item.label}
            </>,
            item.href !== undefined && !item.disabled ? 'a' : 'button',
            {
              ...(item.href !== undefined && !item.disabled ? { href: item.href, target: item.target } : { type: 'button', 'aria-disabled': item.disabled || undefined }),
              'aria-current': key === value ? 'page' : undefined,
              'data-current': dataAttr(key === value),
              'data-nm-top': '',
              onClick: choose(item, key),
              onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => topKeys(event, key, false),
            },
          );
      const columns = item.columns ?? (links.length > 3 ? 2 : 1);
      const panelEl = panel
        ? slot(
            'panel',
            <>
              {item.content != null ? slot('content', item.content, 'div') : null}
              {links.length
                ? slot(
                    'grid',
                    links.map((l) => {
                      const k = sidebarKey(l);
                      const current = k === value;
                      const link = l.href !== undefined && !l.disabled;
                      return (
                        <li key={k}>
                          {slot(
                            'panelLink',
                            <>
                              {l.icon ? slot('icon', l.icon, 'span', { 'aria-hidden': true }) : null}
                              <span className={cls('pinfold-navmenu__text')}>
                                <span className={cls('pinfold-navmenu__label')}>{l.label}</span>
                                {l.description != null ? slot('description', l.description, 'span') : null}
                              </span>
                            </>,
                            link ? 'a' : 'button',
                            {
                              ...(link ? { href: l.href, target: l.target } : { type: 'button', 'aria-disabled': l.disabled || undefined }),
                              'aria-current': current ? 'page' : undefined,
                              'data-current': dataAttr(current),
                              'data-nm-link': '',
                              onClick: choose(l, k),
                              onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
                                const list = [...(event.currentTarget.closest('[data-nm-panel]')?.querySelectorAll<HTMLElement>('[data-nm-link]') ?? [])];
                                if (moveFocus(list, event.currentTarget, event.key, 'ArrowDown', 'ArrowUp')) event.preventDefault();
                              },
                            },
                          )}
                        </li>
                      );
                    }),
                    'ul',
                    { style: { '--pinfold-nm-cols': columns } as React.CSSProperties },
                  )
                : null}
            </>,
            'div',
            { id: panelId, 'data-nm-panel': '', 'data-open': dataAttr(isOpen), 'data-has-content': dataAttr(item.content != null) },
          )
        : null;
      return (
        <React.Fragment key={key}>
          {slot(
            'item',
            <>
              {top}
              {panelEl}
            </>,
            'li',
            { ...hoverProps, 'data-open': dataAttr(isOpen) },
          )}
        </React.Fragment>
      );
    });

    return renderSlot(config, 'root', rootEl, state, slot('list', entries, 'ul'), (p, c) => <nav {...p}>{c}</nav>) as React.ReactElement;
  };

  const api: NavMenuApi = { value, open, setOpen, getRootProps, render };
  return usePinfoldComponent<NavMenuApi, NavMenuRootProps>('NavMenu', api, (props) => render(props));
}
