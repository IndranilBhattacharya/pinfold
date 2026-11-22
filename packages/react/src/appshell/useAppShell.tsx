import * as React from 'react';
import { ScrollRegion } from '../scroll-target';
import { cn, dataAttr, dimensionVars, inactiveAppShellOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useControllableState, useEvent, useId, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { useOverlayLayer } from '../overlay';
import type { AppShellApi, AppShellComponent, AppShellConfig, AppShellRootProps, AppShellSlot, AppShellState } from './types';

const MENU_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const PANEL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

/**
 * The frame of an app, as a hook that hands back a component: a bar, a sidebar, the page, an optional
 * far panel and a footer. Each region takes anything; the shell lays them out, keeps the bar and the
 * sidebar in view and turns the sidebar into a drawer when the shell is narrow.
 *
 *   const Shell = useAppShell({ navbar: <TopBar />, sidebar: <AppNav /> });
 *   return <Shell>{page}</Shell>;   // Shell.toggleSidebar()
 *
 * Precedence: this config, then `defaults.appshell`, then the library default.
 */
export function useAppShell(input: AppShellConfig = {}): AppShellComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.appshell ? mergeConfig<AppShellConfig>(ctx.defaults.appshell, input) : input;
  const base = useId();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ appshellMeta, validateConfig }) => {
      for (const problem of validateConfig(appshellMeta, input)) warnOnce(true, problem.message);
      // Only what the config alone rules out: whether an `auto` sidebar is a drawer depends on the width.
      const inactive = inactiveAppShellOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `AppShell: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const behavior = config.sidebarBehavior ?? 'auto';
  const breakpoint = config.breakpoint ?? 768;
  const hasSidebar = config.sidebar != null && config.sidebar !== false;
  const main = React.useRef<HTMLElement | null>(null);
  const root = React.useRef<HTMLDivElement | null>(null);
  const navbar = React.useRef<HTMLElement | null>(null);
  const sidebar = React.useRef<HTMLDivElement | null>(null);
  const trigger = React.useRef<HTMLElement | null>(null);
  // Narrow is only known once measured: the server and the first paint lay the sidebar out by CSS alone.
  const [narrow, setNarrow] = React.useState<boolean | null>(null);
  const [open, setOpenState] = useControllableState<boolean>({ value: config.sidebarOpen, defaultValue: config.defaultSidebarOpen ?? false });
  const [collapsedVal, setCollapsedState] = useControllableState<boolean>({
    value: config.sidebarCollapsed,
    defaultValue: config.defaultSidebarCollapsed ?? false,
  });
  const collapsed = collapsedVal ?? false;
  const setCollapsed = useEvent((next: boolean) => {
    if (next === collapsed) return;
    setCollapsedState(next);
    config.onSidebarCollapsedChange?.(next);
  });
  const autoSaveId = config.autoSaveId;
  const loaded = React.useRef(false);
  const controlledRef = React.useRef(config.sidebarCollapsed);
  controlledRef.current = config.sidebarCollapsed;
  React.useEffect(() => {
    if (!autoSaveId) return;
    if (!loaded.current) {
      loaded.current = true;
      if (controlledRef.current === undefined) {
        try {
          const stored = localStorage.getItem(`pinfold-appshell:${autoSaveId}`);
          if (stored === 'true') {
            setCollapsed(true);
            return;
          }
          if (stored === 'false') {
            setCollapsed(false);
            return;
          }
        } catch {
          // ignore
        }
      }
    }
    try {
      localStorage.setItem(`pinfold-appshell:${autoSaveId}`, String(collapsed));
    } catch {
      // ignore
    }
  }, [autoSaveId, collapsed]); // eslint-disable-line react-hooks/exhaustive-deps
  const drawer = hasSidebar && (behavior === 'drawer' || (behavior === 'auto' && narrow === true));
  const sidebarOpen = drawer && open;
  const state: AppShellState = { drawer, sidebarOpen, collapsed, layout: config.layout ?? 'navbar-top' };

  const setOpen = useEvent((next: boolean) => {
    if (next === open) return;
    setOpenState(next);
    config.onSidebarOpenChange?.(next);
  });
  const close = useEvent(() => {
    setOpen(false);
    trigger.current?.focus();
  });
  const toggleSidebar = useEvent(() => {
    if (drawer) setOpen(!open);
    else if (config.sidebarCollapsible) setCollapsed(!collapsed);
  });
  const openSidebar = useEvent(() => {
    if (drawer) setOpen(true);
    else if (config.sidebarCollapsible) setCollapsed(false);
  });
  const closeSidebar = useEvent(() => {
    if (drawer) setOpen(false);
    else if (config.sidebarCollapsible) setCollapsed(true);
  });

  // The shell's own width decides, not the window's: a shell in a split view behaves like a narrow one.
  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || behavior !== 'auto') return;
    const measure = () => setNarrow(el.clientWidth < breakpoint);
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [behavior, breakpoint]);
  // Wide again: a drawer left open must not come back open the next time the shell narrows.
  React.useEffect(() => {
    if (!drawer && open) setOpen(false);
  }, [drawer]); // eslint-disable-line react-hooks/exhaustive-deps

  // The bar's height, for the sidebar that sticks under it. Written straight to the element.
  useIsomorphicLayoutEffect(() => {
    const el = navbar.current;
    const shell = root.current;
    if (!el || !shell) return;
    const write = () => shell.style.setProperty('--pinfold-appshell-i-navbar', `${el.offsetHeight}px`);
    write();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(write);
    observer.observe(el);
    return () => {
      observer.disconnect();
      shell.style.removeProperty('--pinfold-appshell-i-navbar');
    };
  }, [config.navbar != null]);

  // A closed drawer is out of reach of the keyboard and of assistive technology; an open one takes the focus.
  useIsomorphicLayoutEffect(() => {
    const el = sidebar.current;
    if (!el) return;
    if (drawer && !sidebarOpen) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
    if (sidebarOpen) (el.querySelector<HTMLElement>('a[href], button, [tabindex="0"]') ?? el).focus({ preventScroll: true });
  }, [drawer, sidebarOpen]);
  useOverlayLayer(sidebarOpen, (node) => !!sidebar.current?.contains(node) || !!trigger.current?.contains(node), close, () => setOpen(false));

  const triggerLabel = drawer
    ? sidebarOpen
      ? config.labels?.closeSidebar ?? 'Close navigation'
      : config.labels?.openSidebar ?? 'Open navigation'
    : collapsed
      ? config.labels?.expandSidebar ?? 'Expand sidebar'
      : config.labels?.collapseSidebar ?? 'Collapse sidebar';
  const triggerExpanded = drawer ? sidebarOpen : !collapsed;
  const canTrigger = drawer || Boolean(config.sidebarCollapsible);
  const showBuiltinTrigger = canTrigger && config.sidebarTrigger !== false;

  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: trigger,
        type: 'button',
        'aria-label': triggerLabel,
        'aria-expanded': triggerExpanded,
        'aria-controls': `${base}-sidebar`,
        onClick: toggleSidebar,
      },
      props,
    );
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: root,
        'data-layout': state.layout,
        'data-scroll': config.scroll ?? 'page',
        'data-backdrop': config.backdrop ?? 'dim',
        'data-navbar-position': config.navbarPosition ?? 'sticky',
        'data-sidebar-behavior': behavior,
        'data-measured': dataAttr(behavior !== 'auto' || narrow !== null),
        'data-drawer': dataAttr(drawer),
        'data-sidebar-open': dataAttr(sidebarOpen),
        'data-sidebar-collapsible': dataAttr(config.sidebarCollapsible),
        'data-sidebar-collapsed': dataAttr(!drawer && config.sidebarCollapsible && collapsed),
        'data-has-sidebar': dataAttr(hasSidebar),
        'data-has-navbar': dataAttr(config.navbar != null),
        'data-has-aside': dataAttr(config.aside != null),
        'data-dividers': dataAttr(config.dividers !== false),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const render = (rootProps?: AppShellRootProps & { children?: React.ReactNode }): React.ReactElement => {
    const { children, ...rest } = rootProps ?? {};
    const slot = (name: AppShellSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-appshell__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('appshell', config.dimensions);
    const combinedStyle = vars || config.style ? { ...vars, ...config.style } : undefined;
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-appshell', config.className), style: combinedStyle }, rest as PropsBag)),
    );
    const side = typeof config.sidebar === 'function' ? config.sidebar(state) : config.sidebar;
    const body = (
      <>
        {config.navbar != null
          ? slot(
              'navbar',
              <>
                {showBuiltinTrigger ? slot('trigger', !drawer && config.sidebarCollapsible ? PANEL_ICON : MENU_ICON, 'button', getTriggerProps()) : null}
                {config.navbar}
              </>,
              'header',
              { ref: navbar },
            )
          : null}
        {hasSidebar
          ? slot('sidebar', side, 'div', {
              ref: sidebar,
              id: `${base}-sidebar`,
              tabIndex: -1,
              ...(drawer ? { role: 'dialog', 'aria-modal': sidebarOpen || undefined, 'aria-label': config.labels?.sidebar ?? 'Navigation' } : null),
              onClick: (event: React.MouseEvent) => {
                // A link was followed: the drawer has done its job.
                if (sidebarOpen && config.closeOnNavigate !== false && (event.target as HTMLElement).closest('a[href]')) setOpen(false);
              },
            })
          : null}
        {drawer && (config.backdrop ?? 'dim') !== 'none' ? slot('backdrop', null, 'div', { 'aria-hidden': true, 'data-open': dataAttr(sidebarOpen), onClick: () => setOpen(false) }) : null}
        {slot(
          'main',
          <>
            {slot('content', config.content ?? children, 'div')}
            {config.footer != null ? slot('footer', config.footer, 'footer') : null}
          </>,
          'main',
          { ref: main },
        )}
        {config.aside != null ? slot('aside', config.aside, 'aside') : null}
      </>
    );
    // With `scroll: 'content'` the page region scrolls, not the window: bars inside listen there.
    const scoped = (config.scroll ?? 'page') === 'content' ? <ScrollRegion.Provider value={main}>{body}</ScrollRegion.Provider> : body;
    return renderSlot(config, 'root', rootBag, state, scoped, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AppShellApi = { ...state, openSidebar, closeSidebar, toggleSidebar, getTriggerProps, getRootProps, render };
  // The latest state for the part below, which is built once.
  const live = React.useRef({ drawer, canTrigger, getTriggerProps });
  live.current = { drawer, canTrigger, getTriggerProps };
  return usePinfoldComponent<AppShellApi, AppShellRootProps & { children?: React.ReactNode }, { SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement | null }>(
    'AppShell',
    api,
    (props) => render(props),
    () => ({
      /** A menu button of your own placing: there while the sidebar is a drawer, or to collapse an inline sidebar. */
      SidebarTrigger: (props) => (live.current.canTrigger ? <button {...(live.current.getTriggerProps({ className: 'pinfold-appshell__trigger', ...props } as PropsBag) as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{props.children ?? (live.current.drawer ? MENU_ICON : PANEL_ICON)}</button> : null),
    }),
  );
}
