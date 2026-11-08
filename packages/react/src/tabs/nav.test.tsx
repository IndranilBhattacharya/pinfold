import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { breadcrumbMeta, paginationMeta, stepperMeta, tabsMeta } from '@pinfold/core/meta';
import { Tabs } from './Tabs';
import { useTabs } from './useTabs';
import { defineTabs } from './define';
import { Breadcrumb } from '../breadcrumb/Breadcrumb';
import { useBreadcrumb } from '../breadcrumb/useBreadcrumb';
import { defineBreadcrumb } from '../breadcrumb/define';
import { Pagination } from '../pagination/Pagination';
import { usePagination } from '../pagination/usePagination';
import { definePagination } from '../pagination/define';
import { Stepper } from '../stepper/Stepper';
import { useStepper } from '../stepper/useStepper';
import { defineStepper } from '../stepper/define';

const tabs = [
  { id: 'profile', label: 'Profile', content: <p>Profile panel</p> },
  { id: 'billing', label: 'Billing', content: <p>Billing panel</p> },
  { id: 'team', label: 'Team', content: <p>Team panel</p>, disabled: true },
  { id: 'logs', label: 'Logs', content: <p>Logs panel</p> },
] as const;

describe('Tabs', () => {
  it('a named tab list; the selected tab controls its panel, which is labelled by it', () => {
    render(<Tabs label="Settings" items={tabs} />);
    const list = screen.getByRole('tablist', { name: 'Settings' });
    const [profile] = screen.getAllByRole('tab');
    expect(profile.getAttribute('aria-selected')).toBe('true');
    expect(profile.tabIndex).toBe(0);
    const panel = screen.getByRole('tabpanel', { name: 'Profile' });
    expect(profile.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.textContent).toBe('Profile panel');
    // Only the selected panel renders by default.
    expect(screen.queryByText('Billing panel')).toBeNull();
    expect(list.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('arrows move and select (auto), pass over disabled tabs without selecting them, and wrap', () => {
    const onChange = vi.fn();
    render(<Tabs label="Settings" items={tabs} onChange={onChange} />);
    const all = screen.getAllByRole('tab');
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('billing', expect.anything());
    fireEvent.keyDown(all[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all[2]);
    expect(all[2].getAttribute('aria-selected')).toBe('false');
    expect(all[2].getAttribute('aria-disabled')).toBe('true');
    fireEvent.keyDown(all[2], { key: 'End' });
    fireEvent.keyDown(all[3], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all[0]);
  });

  it('manual activation: arrows only move focus; a click selects', () => {
    render(<Tabs label="Settings" items={tabs} activation="manual" />);
    const all = screen.getAllByRole('tab');
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'ArrowRight' });
    expect(all[1].getAttribute('aria-selected')).toBe('false');
    fireEvent.click(all[1]);
    expect(all[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Billing panel')).toBeTruthy();
  });

  it('keepMounted keeps hidden panels; vertical orientation; preset on the server', () => {
    const { container } = render(<Tabs label="Settings" items={tabs} keepMounted orientation="vertical" defaultValue="logs" />);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(4);
    expect(container.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(3);
    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
    const Settings = defineTabs({ variant: 'segmented' });
    const html = renderToString(<Settings label="S" items={tabs} />);
    expect(html).toContain('data-variant="segmented"');
    expect(html).toContain('aria-selected="true"');
  });
});

const trail = [{ label: 'Home', href: '/' }, { label: 'Projects', href: '/p' }, { label: 'Pinfold', href: '/p/pinfold' }, { label: 'Docs', href: '/p/pinfold/docs' }, { label: 'Settings' }];

describe('Breadcrumb', () => {
  it('a named nav around an ordered list; the last crumb is the current page and no link', () => {
    render(<Breadcrumb items={trail} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.querySelector('ol')!.children).toHaveLength(5);
    expect(screen.getAllByRole('link')).toHaveLength(4);
    const current = screen.getByText('Settings').closest('[aria-current]')!;
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.tagName).toBe('SPAN');
    // Separators are not read.
    expect(nav.querySelectorAll('.pinfold-breadcrumb__separator[aria-hidden="true"]')).toHaveLength(4);
  });

  it('maxItems collapses the middle behind a button that reveals it and moves focus there', () => {
    render(<Breadcrumb items={trail} maxItems={3} itemsAfterCollapse={1} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Show the full path' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(document.activeElement!.textContent).toBe('Projects');
  });
});

describe('Pagination', () => {
  it('a named nav; pages read "Page n", the current one marked; gaps hidden', () => {
    const onChange = vi.fn();
    const { container } = render(<Pagination count={20} defaultPage={6} onChange={onChange} />);
    screen.getByRole('navigation', { name: 'Pagination' });
    const current = screen.getByRole('button', { name: 'Page 6' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(container.querySelectorAll('.pinfold-pagination__gap[aria-hidden="true"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenLastCalledWith(7, expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Page 20' }));
    expect(onChange).toHaveBeenLastCalledWith(20, expect.anything());
  });

  it('at an end, previous stays focusable but does nothing; getHref makes real links', () => {
    const onChange = vi.fn();
    render(<Pagination count={5} onChange={onChange} showEdges />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(previous);
    expect(onChange).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'Last page' });
    const { container } = render(<Pagination count={5} defaultPage={2} getHref={(p) => `/blog?page=${p}`} />);
    expect(container.querySelector('a[aria-label="Page 3"]')!.getAttribute('href')).toBe('/blog?page=3');
    expect(container.querySelector('a[aria-label="Next page"]')!.getAttribute('href')).toBe('/blog?page=3');
  });
});

const steps = [{ label: 'Cart' }, { label: 'Shipping', description: 'Address' }, { label: 'Payment' }];

describe('Stepper', () => {
  it('an ordered list; state is spoken, the current step marked; only done steps go back', () => {
    const onChange = vi.fn();
    render(<Stepper items={steps} value={1} onChange={onChange} />);
    const list = screen.getByRole('list', { name: 'Progress' });
    const items = list.querySelectorAll('li');
    expect([...items].map((li) => li.getAttribute('data-status'))).toEqual(['complete', 'current', 'upcoming']);
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[0].textContent).toContain(', done');
    expect(items[2].textContent).toContain(', not started');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(0, expect.anything());
  });

  it('without onChange there are no buttons; the circle shows the number, a check when done', () => {
    const { container } = render(<Stepper items={steps} defaultValue={1} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    const marks = container.querySelectorAll('.pinfold-stepper__indicator');
    expect(marks[0].querySelector('svg')).toBeTruthy();
    expect(marks[1].textContent).toBe('2');
  });
});

describePinfoldConformance({
  name: 'tabs',
  slots: ['root', 'list', 'tab', 'indicator', 'panel'],
  optionalSlots: ['icon', 'endContent'],
  dimension: { key: 'height', value: 36 },
  cssFile: 'packages/css/src/tabs.css',
  meta: tabsMeta,
  preset: { define: defineTabs as any, props: { label: 'S', items: tabs.slice(0, 2) } },
  hook: { use: useTabs as any, config: { label: 'S', items: tabs.slice(0, 2) } },
  render: (config) => <Tabs label="S" items={tabs.slice(0, 2)} {...config} />,
});

describePinfoldConformance({
  name: 'breadcrumb',
  inherits: ['size'],
  slots: ['root', 'list', 'item', 'link', 'separator'],
  optionalSlots: ['icon', 'ellipsis'],
  cssFile: 'packages/css/src/breadcrumb.css',
  meta: breadcrumbMeta,
  preset: { define: defineBreadcrumb as any, props: { items: trail } },
  hook: { use: useBreadcrumb as any, config: { items: trail } },
  render: (config) => <Breadcrumb items={trail.slice(-2)} {...config} />,
});

describePinfoldConformance({
  name: 'pagination',
  slots: ['root', 'list', 'item', 'previous', 'next'],
  optionalSlots: ['gap', 'first', 'last'],
  cssFile: 'packages/css/src/pagination.css',
  meta: paginationMeta,
  preset: { define: definePagination as any, props: { count: 5 } },
  hook: { use: usePagination as any, config: { count: 5 } },
  render: (config) => <Pagination count={3} defaultPage={2} {...config} />,
});

describePinfoldConformance({
  name: 'stepper',
  slots: ['root', 'step', 'indicator', 'connector', 'text', 'label'],
  optionalSlots: ['button', 'description'],
  cssFile: 'packages/css/src/stepper.css',
  meta: stepperMeta,
  preset: { define: defineStepper as any, props: { items: steps } },
  hook: { use: useStepper as any, config: { items: steps } },
  render: (config) => <Stepper items={steps} defaultValue={1} {...config} />,
});
