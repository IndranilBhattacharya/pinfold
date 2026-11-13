import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { resetWarnings } from '@pinfold/core';
import { Breadcrumb } from './Breadcrumb';

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnings();
});

const trail = [{ label: 'Projects', href: '/p' }, { label: 'Pinfold', href: '/p/pinfold', menu: [{ label: 'Atlas', href: '/p/atlas' }, { label: 'Nova', key: 'nova' }] }, { label: 'Docs', href: '/p/pinfold/docs' }, 'Settings'];

describe('Breadcrumb: home, icon-only, onChange, separators', () => {
  it('home: true puts an icon-only home crumb first, named by homeLabel and its tooltip', () => {
    render(<Breadcrumb items={trail} home homeLabel="Start" />);
    const home = screen.getByRole('link', { name: 'Start' });
    expect(home.getAttribute('href')).toBe('/');
    expect(home.getAttribute('title')).toBe('Start');
    expect(home.hasAttribute('data-icon-only')).toBe(true);
    expect(home.querySelector('svg')).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('home as a crumb object sets its own href and label; with path it dresses the root crumb', () => {
    const { rerender } = render(<Breadcrumb items={trail} home={{ label: 'Dashboard', href: '/app', iconOnly: false }} />);
    const home = screen.getByRole('link', { name: 'Dashboard' });
    expect(home.getAttribute('href')).toBe('/app');
    expect(home.hasAttribute('data-icon-only')).toBe(false);
    rerender(<Breadcrumb path="/projects/billing" home />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Home' }).hasAttribute('data-icon-only')).toBe(true);
  });

  it('the current page is aria-current="page" and not a link, even with an href', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Now', href: '/now' }]} />);
    const current = screen.getByText('Now').closest('[aria-current]')!;
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.tagName).toBe('SPAN');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('onChange(key, item, event): crumbs, hidden crumbs and sibling pages; preventDefault keeps the page', () => {
    const onChange = vi.fn();
    const onNavigate = vi.fn();
    const { rerender } = render(<Breadcrumb items={trail} onChange={onChange} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }));
    expect(onChange).toHaveBeenLastCalledWith('/p', trail[0], expect.objectContaining({ type: 'click' }));
    expect(onNavigate).toHaveBeenLastCalledWith('/p', expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Other pages' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nova' }));
    expect(onChange).toHaveBeenLastCalledWith('nova', expect.objectContaining({ label: 'Nova' }), expect.anything());
    // Collapsed: hidden crumbs report their own key.
    rerender(<Breadcrumb items={trail} maxItems={3} itemsAfterCollapse={1} onChange={onChange} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the full path' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Docs' }));
    expect(onChange).toHaveBeenLastCalledWith('/p/pinfold/docs', expect.objectContaining({ label: 'Docs' }), expect.anything());
    // Cancelling in onChange stops navigation.
    onNavigate.mockClear();
    rerender(<Breadcrumb items={trail} onChange={(_k, _i, e) => e.preventDefault()} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('separator and variant reach the root; a custom separator is a node', () => {
    const { container, rerender } = render(<Breadcrumb items={trail} separator="slash" variant="pills" />);
    const nav = container.querySelector('nav')!;
    expect(nav.getAttribute('data-separator')).toBe('slash');
    expect(nav.getAttribute('data-variant')).toBe('pills');
    rerender(<Breadcrumb items={trail} separator={<b>»</b>} />);
    expect(nav.getAttribute('data-separator')).toBe('custom');
    expect(container.querySelector('.pinfold-breadcrumb__separator')!.textContent).toBe('»');
  });

  it('long labels are cut visually and keep the full text as the tooltip', () => {
    const long = 'A very long project name that does not fit';
    render(<Breadcrumb items={[{ label: long, href: '/x' }, 'Now']} />);
    expect(screen.getByText(long).getAttribute('title')).toBe(long);
  });
});
