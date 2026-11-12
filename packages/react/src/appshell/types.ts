import type * as React from 'react';
import type { Length, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type AppShellSlot = 'root' | 'navbar' | 'trigger' | 'sidebar' | 'backdrop' | 'main' | 'content' | 'aside' | 'footer';

/** Passed to slot `render` overrides and to a `sidebar` function. */
export interface AppShellState {
  /** The sidebar is a drawer right now (a narrow shell, or `sidebarBehavior: 'drawer'`). */
  drawer: boolean;
  /** The drawer is open. */
  sidebarOpen: boolean;
  layout: 'navbar-top' | 'sidebar-full';
}

export interface AppShellDimensions {
  /** Default: as wide as what is in it (16rem as a drawer). */
  sidebarWidth?: Length;
  /** Default 18rem. */
  asideWidth?: Length;
  /** Widest the page content gets; it is centred beyond that. */
  maxWidth?: Length;
  /** Space around the page content. */
  padding?: Length;
  /** With `scroll: 'content'`: the shell's height. Default the viewport's. */
  height?: Length;
}

/**
 *   const Shell = defineAppShell({ dimensions: { maxWidth: 1120, padding: 24 } });
 *   <Shell navbar={<TopBar />} sidebar={<AppNav label="Main" value={pathname} items={nav} />}><Outlet /></Shell>
 */
export interface AppShellConfig extends SlotOverrides<AppShellSlot, AppShellState> {
  /** The page. On the tag, `children` work too. */
  content?: React.ReactNode;
  /** The bar on top: a Navbar, or anything. */
  navbar?: React.ReactNode;
  /** The navigation beside the page: a Sidebar, or anything; a function gets the shell's state. */
  sidebar?: React.ReactNode | ((state: AppShellState) => React.ReactNode);
  /** A panel on the far side. */
  aside?: React.ReactNode;
  /** Under the page. */
  footer?: React.ReactNode;
  /** @default 'navbar-top' */
  layout?: 'navbar-top' | 'sidebar-full';
  /** Beside the page, a drawer over it, or the first when wide and the second when narrow. @default 'auto' */
  sidebarBehavior?: 'auto' | 'inline' | 'drawer';
  /** With `auto`: the shell width (px) under which the sidebar becomes a drawer. @default 768 */
  breakpoint?: number;
  /** What lies over the page while the drawer is open. @default 'dim' */
  backdrop?: 'dim' | 'blur' | 'none';
  /** The drawer is open, controlled. */
  sidebarOpen?: boolean;
  /** @default false */
  defaultSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  /** A menu button at the start of the bar while the sidebar is a drawer. @default true */
  sidebarTrigger?: boolean;
  /** Following a link in the drawer closes it. @default true */
  closeOnNavigate?: boolean;
  /** @default 'sticky' */
  navbarPosition?: 'sticky' | 'static';
  /** The whole page scrolls, or only the page region inside a shell with a height. @default 'page' */
  scroll?: 'page' | 'content';
  /** Hairlines between the regions. @default true */
  dividers?: boolean;
  labels?: { openSidebar?: string; closeSidebar?: string; sidebar?: string };
  dimensions?: AppShellDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type AppShellRootProps = React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: unknown };
export type AppShellTagProps = AppShellConfig & Omit<AppShellRootProps, keyof AppShellConfig | 'children'> & { children?: React.ReactNode };

export interface AppShellApi extends AppShellState {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  /** Props for your own button that opens the drawer. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: AppShellRootProps & { children?: React.ReactNode }) => React.ReactElement;
}
export type AppShellComponent = PinfoldComponent<AppShellApi & { SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement | null }, AppShellRootProps & { children?: React.ReactNode }>;
