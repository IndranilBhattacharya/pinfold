import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { appshellMeta } from '@pinfold/core/meta';
import { AppShell } from './AppShell';
import { useAppShell } from './useAppShell';
import { defineAppShell } from './define';

const nav = (
  <nav aria-label="Main">
    <a href="#/inbox">Inbox</a>
  </nav>
);

describe('AppShell', () => {
  it('lays out the regions as landmarks; children are the page', () => {
    render(
      <AppShell navbar={<span>Bar</span>} sidebar={nav} aside={<p>Details</p>} footer={<p>Legal</p>} sidebarBehavior="inline">
        <h1>Page</h1>
      </AppShell>,
    );
    expect(screen.getByRole('main').textContent).toContain('Page');
    expect(screen.getByRole('banner').textContent).toBe('Bar');
    expect(screen.getByRole('contentinfo').textContent).toBe('Legal');
    expect(screen.getByRole('complementary').textContent).toBe('Details');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).toBeNull();
    expect(document.querySelector('.pinfold-appshell')!.hasAttribute('data-drawer')).toBe(false);
  });

  it('as a drawer: a menu button opens it, it is a named dialog, inert while closed; Escape, the backdrop and a link close it', () => {
    const onSidebarOpenChange = vi.fn();
    render(<AppShell navbar={<span>Bar</span>} sidebar={nav} sidebarBehavior="drawer" onSidebarOpenChange={onSidebarOpenChange} content="Page" />);
    const root = document.querySelector('.pinfold-appshell')!;
    const drawer = document.querySelector('.pinfold-appshell__sidebar')!;
    expect(root.hasAttribute('data-drawer')).toBe(true);
    expect(drawer.hasAttribute('inert')).toBe(true);
    const button = screen.getByRole('button', { name: 'Open navigation' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(drawer.id);
    fireEvent.click(button);
    expect(onSidebarOpenChange).toHaveBeenLastCalledWith(true);
    expect(root.hasAttribute('data-sidebar-open')).toBe(true);
    expect(drawer.hasAttribute('inert')).toBe(false);
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-label')).toBe('Navigation');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Inbox' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(root.hasAttribute('data-sidebar-open')).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open navigation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    fireEvent.click(document.querySelector('.pinfold-appshell__backdrop')!);
    expect(root.hasAttribute('data-sidebar-open')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    fireEvent.click(screen.getByText('Inbox'));
    expect(root.hasAttribute('data-sidebar-open')).toBe(false);
  });

  it('auto: becomes a drawer when the shell itself is narrower than the breakpoint', () => {
    const { container } = render(<AppShell navbar="Bar" sidebar={nav} breakpoint={600} content="Page" />);
    const root = container.querySelector('.pinfold-appshell') as HTMLElement;
    // jsdom measures 0: narrower than any breakpoint.
    expect(root.hasAttribute('data-drawer')).toBe(true);
    expect(root.hasAttribute('data-measured')).toBe(true);
  });

  it('the controller opens and closes; your own trigger exists only for a drawer; the sidebar can read the state', () => {
    let api: ReturnType<typeof useAppShell> | undefined;
    function App({ behavior }: { behavior: 'drawer' | 'inline' }) {
      api = useAppShell({ sidebarBehavior: behavior, sidebarTrigger: false, sidebar: (s) => <nav aria-label="Main">{s.drawer ? 'drawer' : 'inline'}</nav> });
      const Shell = api;
      return (
        <Shell>
          <Shell.SidebarTrigger aria-label="Menu" />
        </Shell>
      );
    }
    const { rerender } = render(<App behavior="drawer" />);
    expect(screen.getByRole('navigation', { hidden: true }).textContent).toBe('drawer');
    expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy();
    act(() => api!.openSidebar());
    expect(api!.sidebarOpen).toBe(true);
    act(() => api!.toggleSidebar());
    expect(api!.sidebarOpen).toBe(false);
    rerender(<App behavior="inline" />);
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    expect(screen.getByRole('navigation').textContent).toBe('inline');
  });
});

describePinfoldConformance({
  name: 'appshell',
  variants: false,
  inherits: [],
  slots: ['root', 'main', 'content'],
  optionalSlots: ['navbar', 'trigger', 'sidebar', 'backdrop', 'aside', 'footer'],
  dimension: { key: 'maxWidth', value: 960 },
  cssFile: 'packages/css/src/appshell.css',
  meta: appshellMeta,
  preset: { define: defineAppShell as any, props: { content: 'x', navbar: 'bar', sidebar: 'side' }, probe: { key: 'layout', values: ['sidebar-full', 'navbar-top', 'sidebar-full'] } },
  hook: { use: useAppShell as any, config: { content: 'x' } },
  render: (config) => <AppShell content="x" navbar="bar" sidebar="side" {...config} />,
});
