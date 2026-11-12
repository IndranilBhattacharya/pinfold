import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useControllableState, useEvent, useId, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { useOverlayLayer } from '../overlay';
import type { AppShellApi, AppShellComponent, AppShellConfig, AppShellRootProps, AppShellSlot, AppShellState } from './types';

const MENU_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
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
    });
  }

  const behavior = config.sidebarBehavior ?? 'auto';
  const breakpoint = config.breakpoint ?? 768;
  const hasSidebar = config.sidebar != null && config.sidebar !== false;
  const root = React.useRef<HTMLDivElement | null>(null);
  const navbar = React.useRef<HTMLElement | null>(null);
  const sidebar = React.useRef<HTMLDivElement | null>(null);
  const trigger = React.useRef<HTMLElement | null>(null);
  // Narrow is only known once measured: the server and the first paint lay the sidebar out by CSS alone.
  const [narrow, setNarrow] = React.useState<boolean | null>(null);
  const [open, setOpenState] = useControllableState<boolean>({ value: config.sidebarOpen, defaultValue: config.defaultSidebarOpen ?? false });
  const drawer = hasSidebar && (behavior === 'drawer' || (behavior === 'auto' && narrow === true));
  const sidebarOpen = drawer && open;
  const state: AppShellState = { drawer, sidebarOpen, layout: config.layout ?? 'navbar-top' };

  const setOpen = useEvent((next: boolean) => {
    if (next === open) return;
    setOpenState(next);
    config.onSidebarOpenChange?.(next);
  });
  const close = useEvent(() => {
    setOpen(false);
    trigger.current?.focus();
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

  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: trigger,
        type: 'button',
        'aria-label': sidebarOpen ? config.labels?.closeSidebar ?? 'Close navigation' : config.labels?.openSidebar ?? 'Open navigation',
        'aria-expanded': sidebarOpen,
        'aria-controls': `${base}-sidebar`,
        onClick: () => setOpen(!open),
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
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-appshell', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rest as PropsBag)),
    );
    const side = typeof config.sidebar === 'function' ? config.sidebar(state) : config.sidebar;
    const body = (
      <>
        {config.navbar != null
          ? slot(
              'navbar',
              <>
                {drawer && config.sidebarTrigger !== false ? slot('trigger', MENU_ICON, 'button', getTriggerProps()) : null}
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
        )}
        {config.aside != null ? slot('aside', config.aside, 'aside') : null}
      </>
    );
    return renderSlot(config, 'root', rootBag, state, body, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AppShellApi = { ...state, openSidebar: () => setOpen(true), closeSidebar: () => setOpen(false), toggleSidebar: () => setOpen(!open), getTriggerProps, getRootProps, render };
  // The latest state for the part below, which is built once.
  const live = React.useRef({ drawer, getTriggerProps });
  live.current = { drawer, getTriggerProps };
  return usePinfoldComponent<AppShellApi, AppShellRootProps & { children?: React.ReactNode }, { SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement | null }>(
    'AppShell',
    api,
    (props) => render(props),
    () => ({
      /** A menu button of your own placing: there only while the sidebar is a drawer. */
      SidebarTrigger: (props) => (live.current.drawer ? <button {...(live.current.getTriggerProps({ className: 'pinfold-appshell__trigger', ...props } as PropsBag) as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{props.children ?? MENU_ICON}</button> : null),
    }),
  );
}
