import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, radiusProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useControllableState, useEvent, useId, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { useSlidingIndicator } from '../indicator';
import { useOverlayLayer } from '../overlay';
import { CHEVRON_DOWN_ICON } from '../nav-icons';
import { Button } from '../button/Button';
import { Menu } from '../menu/Menu';
import type { MenuItem } from '../menu/types';
import type { NavbarApi, NavbarBrand, NavbarComponent, NavbarConfig, NavbarCustomPart, NavbarItem, NavbarItemContext, NavbarLayout, NavbarPart, NavbarRootProps, NavbarSlot, NavbarState, NavbarTool } from './types';

const MENU_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const toItem = (item: NavbarItem | string): NavbarItem => (typeof item === 'string' ? { label: item } : item);
const keyOf = (item: NavbarItem) => item.id ?? item.href ?? item.label;
const isBrand = (b: unknown): b is NavbarBrand => !!b && typeof b === 'object' && !React.isValidElement(b) && 'label' in (b as object);
/** A link holds the current page when it is it, or one of the links under it is. */
const holds = (item: NavbarItem, value: string | undefined): boolean => value !== undefined && (keyOf(item) === value || !!item.items?.some((child) => holds(toItem(child), value)));

/**
 * The bar across the top of an app or a site, as a hook that hands back a component: a brand, links
 * (with dropdowns), your own content and actions. Links that do not fit move under "More"; a narrow
 * bar folds them into a menu button. Works with any router: links go through `onNavigate`, or the
 * provider's `navigate`, or the browser.
 *
 *   const TopBar = useNavbar({ label: 'Main', value: pathname, items: ['Docs', 'Pricing'] });
 *   return <TopBar />;
 *
 * Precedence: this config, then `defaults.navbar`, then the provider (size, tone), then the library default.
 */
export function useNavbar(input: NavbarConfig): NavbarComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.navbar ? mergeConfig<NavbarConfig>(ctx.defaults.navbar as NavbarConfig, input) : input;
  const base = useId();
  const items = (config.items ?? []).map(toItem);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ navbarMeta, validateConfig }) => {
      for (const problem of validateConfig(navbarMeta, input)) warnOnce(true, problem.message);
    });
    warnOnce(!config.label, 'Navbar: give it a `label`, e.g. "Main": it names the navigation landmark.');
  }

  const [value, setValueState] = useControllableState<string | undefined>({ value: config.value, defaultValue: config.defaultValue });
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  // How many links fit; null until measured (then all of them are shown, as the server sends them).
  const [fit, setFit] = React.useState<number | null>(null);
  const [narrow, setNarrow] = React.useState(false);
  // The bar's width, for parts that leave under a width of their own.
  const [barWidth, setBarWidth] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hover, setHover] = React.useState<number | null>(null);
  const root = React.useRef<HTMLElement | null>(null);
  const list = React.useRef<HTMLUListElement | null>(null);
  const toggle = React.useRef<HTMLButtonElement | null>(null);
  const panel = React.useRef<HTMLDivElement | null>(null);
  const widths = React.useRef<number[]>([]);

  const watchWidth = React.useRef(false);
  watchWidth.current = [...(config.layout?.start ?? []), ...(config.layout?.center ?? []), ...(config.layout?.end ?? [])].some((p) => !!p && typeof p === 'object' && !React.isValidElement(p) && (p as NavbarCustomPart).hideBelow !== undefined);
  const overflow = config.overflow ?? 'more';
  const collapseAt = config.collapseAt ?? 640;
  const collapsed = narrow && items.length > 0;
  const shown = overflow === 'more' && fit !== null ? Math.min(fit, items.length) : items.length;
  const state: NavbarState = { variant: config.variant ?? 'solid', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value, scrolled, collapsed, menuOpen: collapsed && menuOpen };

  const choose = useEvent((item: NavbarItem, event: React.SyntheticEvent) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    item.onClick?.(event as React.MouseEvent);
    const key = keyOf(item);
    if (item.href !== undefined || !item.items) {
      setValueState(key);
      config.onChange?.(key, item, event);
    }
    if (item.href !== undefined) {
      const own = config.onNavigate;
      followLink(event as React.MouseEvent, item.href, own ? (href) => own(href, event) : ctx.navigate, item.target);
    }
    setMenuOpen(false);
  });

  // ---- the page's scroll: shrink, hide ----
  const watchScroll = !!config.shrinkOnScroll || !!config.hideOnScroll;
  React.useEffect(() => {
    if (!watchScroll) return;
    let last = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hide only once well past the bar, and only on a real move down; any move up brings it back.
      if (config.hideOnScroll) setHidden(y > 120 && y > last + 2 ? true : y < last - 2 ? false : (h) => h);
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [watchScroll, config.hideOnScroll]);

  // ---- what fits: the bar's own width folds it; the row's width decides how many links stay ----
  const count = items.length;
  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      setNarrow(el.clientWidth > 0 && el.clientWidth < collapseAt);
      if (watchWidth.current) setBarWidth(el.clientWidth);
      const row = list.current;
      if (!row || overflow !== 'more') return setFit(null);
      const cells = Array.from(row.querySelectorAll<HTMLElement>(':scope > [data-nav-item]'));
      // A link under "More" is not laid out: its last known width stands.
      cells.forEach((cell, i) => {
        if (cell.offsetWidth > 0) widths.current[i] = cell.offsetWidth;
      });
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const more = row.querySelector<HTMLElement>(':scope > [data-nav-more]')?.offsetWidth ?? 88;
      const room = row.clientWidth;
      if (room <= 0) return setFit(null);
      let used = 0;
      let n = 0;
      for (let i = 0; i < cells.length; i++) {
        const w = (widths.current[i] ?? 80) + (i ? gap : 0);
        // Everything fits without "More"; otherwise "More" needs its room too.
        const reserve = i === cells.length - 1 ? 0 : more + gap;
        if (used + w + reserve > room + 0.5) break;
        used += w;
        n++;
      }
      setFit(n);
    };
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (list.current) observer.observe(list.current);
    return () => observer.disconnect();
  }, [collapseAt, overflow, count]);

  // ---- the folded panel ----
  React.useEffect(() => {
    if (!collapsed && menuOpen) setMenuOpen(false);
  }, [collapsed]); // eslint-disable-line react-hooks/exhaustive-deps
  useOverlayLayer(
    collapsed && menuOpen,
    (node) => !!panel.current?.contains(node) || !!toggle.current?.contains(node),
    () => {
      setMenuOpen(false);
      toggle.current?.focus();
    },
    () => setMenuOpen(false),
  );

  const currentIndex = items.findIndex((item) => holds(item, value));
  const marker = config.indicator ?? 'pill';
  const at = hover ?? (currentIndex >= 0 && currentIndex < shown ? currentIndex : -1);
  useSlidingIndicator(list as React.RefObject<HTMLElement | null>, marker !== 'none' && !collapsed, ':scope > [data-nav-item]', at, '--pinfold-navbar-i-', `${shown}:${value}:${collapsed}`);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: root,
        'aria-label': config.label,
        'data-variant': state.variant,
        'data-align': config.align ?? 'start',
        'data-indicator': marker,
        'data-position': config.position ?? 'static',
        'data-overflow': overflow,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-shrink': dataAttr(config.shrinkOnScroll),
        'data-scrolled': dataAttr(scrolled),
        'data-hidden': dataAttr(hidden && !menuOpen),
        'data-collapsed': dataAttr(collapsed),
        'data-menu-open': dataAttr(collapsed && menuOpen),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: NavbarRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: NavbarSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-navbar__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('navbar', config.dimensions);
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-navbar', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );

    const brand = config.brand == null ? null : isBrand(config.brand) ? (
      slot(
        'brand',
        <>
          {config.brand.logo}
          <span>{config.brand.label}</span>
        </>,
        config.brand.href !== undefined ? 'a' : 'span',
        config.brand.href !== undefined
          ? { href: config.brand.href, onClick: (event: React.MouseEvent) => followLink(event, (config.brand as NavbarBrand).href, config.onNavigate ? (href) => config.onNavigate!(href, event) : ctx.navigate) }
          : {},
      )
    ) : (
      slot('brand', config.brand as React.ReactNode, 'span')
    );

    /** A link's rows as a menu's rows: for dropdowns and for "More". */
    const menuRows = (list: ReadonlyArray<NavbarItem | string>): MenuItem[] =>
      list.map((raw) => {
        const item = toItem(raw);
        if (item.items?.length) return { type: 'submenu', label: item.label, icon: item.icon, disabled: item.disabled, items: menuRows(item.items) } as MenuItem;
        return { label: item.label, icon: item.icon, href: item.href, target: item.target, disabled: item.disabled, onSelect: (event: React.SyntheticEvent<HTMLElement>) => choose(item, event) } as MenuItem;
      });

    const linkContent = (item: NavbarItem, caret: boolean) => (
      <>
        {item.icon != null ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
        <span>{item.label}</span>
        {item.badge != null ? slot('badge', item.badge, 'span') : null}
        {caret ? <span className={cls('pinfold-navbar__caret')}>{CHEVRON_DOWN_ICON}</span> : null}
      </>
    );
    const cells = items.map((item, i) => {
      const key = keyOf(item);
      const current = holds(item, value);
      const over = i >= shown;
      const context: NavbarItemContext = { ...item, key, current, overflowed: over };
      const common: PropsBag = {
        [ITEM]: context,
        'data-current': dataAttr(current),
        'aria-current': current && !item.items ? 'page' : undefined,
        'aria-disabled': item.disabled || undefined,
        tabIndex: over ? -1 : undefined,
      };
      const control = item.items?.length ? (
        <Menu
          items={menuRows(item.items)}
          size={state.size}
          trigger={slot('link', linkContent(item, true), 'button', { type: 'button', ...common }) as React.ReactElement}
        />
      ) : item.href !== undefined ? (
        slot('link', linkContent(item, false), 'a', { href: item.disabled ? undefined : item.href, target: item.target, rel: item.target === '_blank' ? 'noreferrer' : undefined, ...common, onClick: (event: React.MouseEvent) => choose(item, event) })
      ) : (
        slot('link', linkContent(item, false), 'button', { type: 'button', ...common, onClick: (event: React.MouseEvent) => choose(item, event) })
      );
      return (
        <React.Fragment key={key}>
          {slot('item', control, 'li', {
            [ITEM]: context,
            'data-nav-item': '',
            // A link that moved under "More" stays in the DOM (so its width is known) but out of sight and reach.
            'data-overflowed': dataAttr(over),
            'aria-hidden': over || undefined,
            onPointerEnter: () => setHover(i),
            onPointerLeave: () => setHover(null),
          })}
        </React.Fragment>
      );
    });
    const more =
      overflow === 'more' && shown < items.length ? (
        <li data-nav-more="" className={cls('pinfold-navbar__item')}>
          <Menu
            items={menuRows(items.slice(shown))}
            size={state.size}
            placement="bottom-end"
            trigger={slot('more', <><span>{config.labels?.more ?? 'More'}</span><span className={cls('pinfold-navbar__caret')}>{CHEVRON_DOWN_ICON}</span></>, 'button', { type: 'button', 'data-current': dataAttr(currentIndex >= shown) }) as React.ReactElement}
          />
        </li>
      ) : null;

    const actions = config.actions?.length
      ? slot(
          'actions',
          config.actions.map((action, i) => <Button key={i} size={state.size === 'lg' ? 'md' : 'sm'} {...action} />),
          'div',
        )
      : null;

    const panelRows = (list: ReadonlyArray<NavbarItem | string>, depth: number): React.ReactNode =>
      list.map((raw) => {
        const item = toItem(raw);
        const key = keyOf(item);
        const current = keyOf(item) === value;
        const own: PropsBag = { [ITEM]: { ...item, key, current, overflowed: false }, 'data-current': dataAttr(current), 'data-depth': depth, 'aria-current': current ? 'page' : undefined, 'aria-disabled': item.disabled || undefined };
        return (
          <React.Fragment key={key}>
            {item.items?.length ? (
              <>
                <span className={cls('pinfold-navbar__panelGroup')} data-depth={depth}>
                  {item.label}
                </span>
                {panelRows(item.items, depth + 1)}
              </>
            ) : item.href !== undefined ? (
              slot('panelLink', linkContent(item, false), 'a', { href: item.disabled ? undefined : item.href, target: item.target, ...own, onClick: (event: React.MouseEvent) => choose(item, event) })
            ) : (
              slot('panelLink', linkContent(item, false), 'button', { type: 'button', ...own, onClick: (event: React.MouseEvent) => choose(item, event) })
            )}
          </React.Fragment>
        );
      });

    // ---- tools: icon buttons (or anything) placed in any zone ----
    const tools = config.tools ?? [];
    const toolNode = (tool: NavbarTool, i: number): React.ReactNode => {
      if (tool.content != null) return <React.Fragment key={tool.id ?? i}>{slot('tool', tool.content, 'span', { [ITEM]: tool, 'data-tool': tool.id ?? tool.label })}</React.Fragment>;
      const inner = (
        <>
          {tool.icon != null ? slot('icon', tool.icon, 'span', { 'aria-hidden': true }) : null}
          {tool.showLabel || tool.icon == null ? <span>{tool.label}</span> : null}
          {tool.badge != null && tool.badge !== false ? slot('toolBadge', tool.badge === true ? null : tool.badge, 'span', { 'data-dot': dataAttr(tool.badge === true) }) : null}
        </>
      );
      const own: PropsBag = {
        [ITEM]: tool,
        'data-tool': tool.id ?? tool.label,
        'data-labelled': dataAttr(tool.showLabel || tool.icon == null),
        'data-active': dataAttr(tool.active),
        'aria-label': tool.showLabel || tool.icon == null ? undefined : tool.label,
        'aria-pressed': tool.active === undefined ? undefined : tool.active,
        'aria-disabled': tool.disabled || undefined,
        title: tool.showLabel || tool.icon == null ? undefined : tool.label,
      };
      const press = (event: React.MouseEvent) => {
        if (tool.disabled) return event.preventDefault();
        tool.onClick?.(event);
        if (tool.href !== undefined) followLink(event, tool.href, config.onNavigate ? (href) => config.onNavigate!(href, event) : ctx.navigate, tool.target);
      };
      const control = tool.menu?.length ? (
        <Menu items={tool.menu} size={state.size} placement="bottom-end" trigger={slot('tool', inner, 'button', { type: 'button', ...own }) as React.ReactElement} />
      ) : tool.href !== undefined ? (
        slot('tool', inner, 'a', { href: tool.disabled ? undefined : tool.href, target: tool.target, ...own, onClick: press })
      ) : (
        slot('tool', inner, 'button', { type: 'button', ...own, onClick: press })
      );
      return <React.Fragment key={tool.id ?? i}>{control}</React.Fragment>;
    };
    // Folded, a tool stays in the bar, moves into the panel as a row, or goes away: its own choice.
    const inBar = (tool: NavbarTool) => !collapsed || (tool.whenCollapsed ?? 'keep') === 'keep';
    const panelTools = collapsed ? tools.filter((tool) => tool.whenCollapsed === 'panel') : [];

    const linkList =
      items.length && !collapsed
        ? slot(
            'list',
            <>
              {cells}
              {more}
              {marker !== 'none' ? slot('indicator', null, 'li', { 'aria-hidden': true, role: 'presentation' }) : null}
            </>,
            'ul',
            { ref: list, role: 'list' },
          )
        : null;
    const toggleButton = collapsed
      ? slot('toggle', menuOpen ? CLOSE_ICON : MENU_ICON, 'button', {
          ref: toggle,
          type: 'button',
          'aria-label': menuOpen ? config.labels?.closeMenu ?? 'Close menu' : config.labels?.openMenu ?? 'Open menu',
          'aria-expanded': menuOpen,
          'aria-controls': `${base}-panel`,
          onClick: () => setMenuOpen(!menuOpen),
        })
      : null;

    // ---- the arrangement: three zones, each a list of parts in order ----
    const align = config.align ?? 'start';
    const fallback: Required<NavbarLayout> = {
      start: ['brand', 'tools', 'start', ...(align === 'start' ? (['links'] as const) : [])],
      center: [...(align === 'center' ? (['links'] as const) : []), 'tools', 'center'],
      end: [...(align === 'end' ? (['links'] as const) : []), 'tools', 'actions', 'end', 'toggle'],
    };
    const layout: Required<NavbarLayout> = { start: config.layout?.start ?? fallback.start, center: config.layout?.center ?? fallback.center, end: config.layout?.end ?? fallback.end };
    // A part named in a custom layout is drawn where it is named; the menu button always exists while folded.
    const named = new Set<string>();
    for (const zone of ['start', 'center', 'end'] as const) for (const part of layout[zone]) if (typeof part === 'string') named.add(part);
    const part = (zone: 'start' | 'center' | 'end', entry: NavbarPart, i: number): React.ReactNode => {
      if (typeof entry !== 'string') {
        if (React.isValidElement(entry) || entry === null || typeof entry !== 'object') return <React.Fragment key={i}>{entry as React.ReactNode}</React.Fragment>;
        const custom = entry as NavbarCustomPart;
        if (custom.hideBelow !== undefined && barWidth > 0 && barWidth < custom.hideBelow) return null;
        if (collapsed && custom.whenCollapsed === 'hide') return null;
        return <React.Fragment key={i}>{custom.content}</React.Fragment>;
      }
      const key = `${entry}-${i}`;
      if (entry === 'brand') return <React.Fragment key={key}>{brand}</React.Fragment>;
      if (entry === 'links') return <React.Fragment key={key}>{linkList}</React.Fragment>;
      if (entry === 'start') return config.start != null ? <React.Fragment key={key}>{slot('start', config.start, 'div')}</React.Fragment> : null;
      if (entry === 'center') return config.center != null ? <React.Fragment key={key}>{slot('center', config.center, 'div')}</React.Fragment> : null;
      if (entry === 'end') return config.end != null ? <React.Fragment key={key}>{slot('end', config.end, 'div')}</React.Fragment> : null;
      if (entry === 'actions') return collapsed ? null : <React.Fragment key={key}>{actions}</React.Fragment>;
      if (entry === 'toggle') return <React.Fragment key={key}>{toggleButton}</React.Fragment>;
      if (entry === 'spacer') return <span key={key} className={cls('pinfold-navbar__spacer')} aria-hidden="true" />;
      if (entry === 'separator') return <span key={key} className={cls('pinfold-navbar__separator')} role="separator" aria-orientation="vertical" />;
      if (entry === 'tools') {
        // Tools with no placement belong to the end; a zone draws its own.
        const mine = tools.filter((tool) => (tool.placement ?? 'end') === zone && inBar(tool));
        return mine.length ? <React.Fragment key={key}>{slot('tools', mine.map(toolNode), 'div', { role: 'group' })}</React.Fragment> : null;
      }
      if (entry.startsWith('tool:')) {
        const tool = tools.find((t) => (t.id ?? t.label) === entry.slice(5));
        return tool && inBar(tool) ? toolNode(tool, i) : null;
      }
      return null;
    };
    const zone = (name: 'start' | 'center' | 'end') => {
      const parts = layout[name].map((entry, i) => part(name, entry, i)).filter((node) => node !== null && node !== undefined && node !== false);
      // The menu button must exist while folded, even in a layout that forgot it.
      if (name === 'end' && collapsed && !named.has('toggle')) parts.push(<React.Fragment key="toggle">{toggleButton}</React.Fragment>);
      if (!parts.length && name !== 'center') return null;
      return slot('zone', parts, 'div', { 'data-zone': name, 'data-grow': dataAttr(layout[name].includes('links') && !collapsed), 'data-empty': dataAttr(!parts.length) });
    };

    const content = (
      <>
        {slot(
          'inner',
          <>
            {zone('start')}
            {zone('center')}
            {zone('end')}
          </>,
          'div',
        )}
        {config.secondary != null ? slot('secondary', config.secondary, 'div') : null}
        {collapsed
          ? slot(
              'panel',
              menuOpen ? (
                <>
                  {panelRows(items, 0)}
                  {panelTools.map((tool, i) => (
                    <React.Fragment key={tool.id ?? i}>
                      {tool.content != null
                        ? tool.content
                        : slot('panelLink', <>{tool.icon != null ? slot('icon', tool.icon, 'span', { 'aria-hidden': true }) : null}<span>{tool.label}</span></>, tool.href !== undefined ? 'a' : 'button', {
                            ...(tool.href !== undefined ? { href: tool.href, target: tool.target } : { type: 'button' }),
                            [ITEM]: tool,
                            'data-depth': 0,
                            onClick: (event: React.MouseEvent) => {
                              tool.onClick?.(event);
                              if (tool.href !== undefined) followLink(event, tool.href, config.onNavigate ? (href) => config.onNavigate!(href, event) : ctx.navigate, tool.target);
                              setMenuOpen(false);
                            },
                          })}
                    </React.Fragment>
                  ))}
                  {actions}
                </>
              ) : null,
              'div',
              { ref: panel, id: `${base}-panel`, hidden: !menuOpen },
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', rootBag, state, content, (p, c) => <nav {...p}>{c}</nav>) as React.ReactElement;
  };

  const api: NavbarApi = {
    value,
    setValue: (key) => setValueState(key),
    scrolled,
    collapsed,
    menuOpen: collapsed && menuOpen,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
    getRootProps,
    render,
  };
  return usePinfoldComponent<NavbarApi, NavbarRootProps>('Navbar', api, (props) => render(props));
}
