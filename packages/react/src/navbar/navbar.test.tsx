import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { navbarMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Navbar } from './Navbar';
import { useNavbar } from './useNavbar';
import { defineNavbar } from './define';

const links = [{ label: 'Docs', href: '/docs' }, { label: 'Pricing', href: '/pricing', badge: 'New' }, { label: 'Resources', items: [{ label: 'Blog', href: '/blog' }] }, 'About'];

/** jsdom has no layout: give the bar a width, so it can decide to fold. */
function width(px: number) {
  const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('pinfold-navbar') ? px : 0;
  });
  return () => spy.mockRestore();
}

describe('Navbar', () => {
  it('a named navigation landmark; the current link is marked; a brand links home', () => {
    render(<Navbar label="Main" value="/pricing" brand={{ label: 'Acme', href: '/' }} items={links} />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Acme' }).getAttribute('href')).toBe('/');
    expect(within(nav).getByRole('link', { name: /Pricing/ }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBeNull();
    expect(within(nav).getByRole('button', { name: 'About' })).toBeTruthy();
  });

  it('links go to your router: onNavigate, else the provider\'s navigate; a new-tab click is the browser\'s', () => {
    const onNavigate = vi.fn();
    const onChange = vi.fn();
    const navigate = vi.fn();
    const { unmount } = render(<Navbar label="Main" items={links} onNavigate={onNavigate} onChange={onChange} />);
    fireEvent.click(screen.getByRole('link', { name: 'Docs' }));
    expect(onNavigate).toHaveBeenCalledWith('/docs', expect.anything());
    expect(onChange).toHaveBeenCalledWith('/docs', expect.objectContaining({ label: 'Docs' }), expect.anything());
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('link', { name: /Pricing/ }), { ctrlKey: true });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    unmount();
    render(
      <PinfoldProvider navigate={navigate}>
        <Navbar label="Main" items={links} />
      </PinfoldProvider>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Docs' }));
    expect(navigate).toHaveBeenCalledWith('/docs');
  });

  it('a link with links under it opens a dropdown; it holds the current page when one of them is it', () => {
    render(<Navbar label="Main" value="/blog" items={links} />);
    const trigger = screen.getByRole('button', { name: 'Resources' });
    expect(trigger.hasAttribute('data-current')).toBe(true);
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Blog' }).getAttribute('href')).toBe('/blog');
  });

  it('a narrow bar folds its links into a menu button and a panel; Escape closes it and returns focus', () => {
    const restore = width(400);
    render(<Navbar label="Main" value="/docs" items={links} actions={[{ label: 'Sign in' }]} />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav.hasAttribute('data-collapsed')).toBe(true);
    expect(screen.queryByRole('link', { name: 'Docs' })).toBeNull();
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('page');
    // Links under a dropdown are listed too: nothing is lost on a narrow bar.
    expect(screen.getByRole('link', { name: 'Blog' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: 'Docs' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('link', { name: /Pricing/ }));
    expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe('false');
    restore();
  });

  it('shrinkOnScroll and hideOnScroll follow the page; the listener leaves with the bar', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    let api: ReturnType<typeof useNavbar> | undefined;
    function Bar() {
      api = useNavbar({ label: 'Main', items: links, shrinkOnScroll: true, hideOnScroll: true, position: 'sticky' });
      const B = api;
      return <B />;
    }
    const { unmount } = render(<Bar />);
    const nav = screen.getByRole('navigation');
    expect(nav.hasAttribute('data-scrolled')).toBe(false);
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      // Ran at once: no frame is pending.
      return 0;
    });
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 400 });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(nav.hasAttribute('data-scrolled')).toBe(true);
    expect(nav.hasAttribute('data-hidden')).toBe(true);
    expect(api!.scrolled).toBe(true);
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(nav.hasAttribute('data-hidden')).toBe(false);
    unmount();
    expect(remove.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
    raf.mockRestore();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });
});

describePinfoldConformance({
  name: 'navbar',
  slots: ['root', 'inner', 'list', 'item', 'link', 'indicator'],
  optionalSlots: ['brand', 'start', 'icon', 'badge', 'more', 'center', 'end', 'actions', 'toggle', 'panel', 'panelLink'],
  dimension: { key: 'height', value: 72 },
  cssFile: 'packages/css/src/navbar.css',
  meta: navbarMeta,
  preset: { define: defineNavbar as any, props: { label: 'Main', items: ['One', 'Two'] } },
  hook: { use: useNavbar as any, config: { label: 'Main', items: ['One', 'Two'] } },
  render: (config) => <Navbar label="Main" items={['One', 'Two']} {...config} />,
});
