import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { breadcrumbMeta, paginationMeta, stepperMeta, tabsMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
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
    const { container } = render(<Tabs label="Settings" items={tabs} onChange={onChange} />);
    const all = screen.getAllByRole('tab');
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('billing', expect.anything());
    // The new panel slides in from the side the selection moved to.
    expect(container.firstElementChild!.getAttribute('data-direction')).toBe('forward');
    fireEvent.keyDown(all[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all[2]);
    expect(all[2].getAttribute('aria-selected')).toBe('false');
    expect(all[2].getAttribute('aria-disabled')).toBe('true');
    fireEvent.keyDown(all[2], { key: 'End' });
    fireEvent.keyDown(all[3], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(all[0]);
    expect(container.firstElementChild!.getAttribute('data-direction')).toBe('back');
  });

  it('manual activation: arrows only move focus; Enter or a click selects', () => {
    render(<Tabs label="Settings" items={tabs} activation="manual" />);
    const all = screen.getAllByRole('tab');
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'ArrowRight' });
    expect(all[1].getAttribute('aria-selected')).toBe('false');
    fireEvent.keyDown(all[1], { key: 'Enter' });
    expect(all[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(all[3]);
    expect(screen.getByText('Logs panel')).toBeTruthy();
  });

  it('strings are tabs; a side placement is a column; keepMounted keeps hidden panels; preset on the server', () => {
    render(<Tabs label="View" items={['Board', 'List']} placement="start" />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Board', 'List']);
    expect(screen.getByRole('tablist', { name: 'View' }).getAttribute('aria-orientation')).toBe('vertical');
    const { container } = render(<Tabs label="Settings" items={tabs} keepMounted defaultValue="logs" />);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(4);
    expect(container.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(3);
    const Settings = defineTabs({ variant: 'underline' });
    const html = renderToString(<Settings label="S" items={tabs} />);
    expect(html).toContain('data-variant="underline"');
    expect(html).toContain('aria-selected="true"');
    expect(html).not.toContain('data-direction');
  });

  it('onClose: Delete closes the focused tab, the selected one hands over to its neighbour; the mark is for pointers', () => {
    const onClose = vi.fn();
    const onChange = vi.fn();
    const { container } = render(<Tabs label="Files" items={tabs} onClose={onClose} onChange={onChange} />);
    const all = screen.getAllByRole('tab');
    expect(all[0].getAttribute('aria-keyshortcuts')).toBe('Delete');
    expect(document.getElementById(all[0].getAttribute('aria-describedby')!)!.textContent).toBe('Press Delete to close');
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'Delete' });
    expect(onChange).toHaveBeenCalledWith('billing', expect.anything());
    expect(onClose).toHaveBeenCalledWith('profile', expect.anything());
    const marks = container.querySelectorAll('.pinfold-tabs__close');
    expect(marks[0].getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(marks[3]);
    expect(onClose).toHaveBeenLastCalledWith('logs', expect.anything());
  });

  it('onAdd: a named + button outside the tab list; link tabs follow the router', () => {
    const onAdd = vi.fn();
    const navigate = vi.fn();
    render(
      <PinfoldProvider navigate={navigate}>
        <Tabs label="Project" onAdd={onAdd} items={[{ id: '/a', label: 'A', href: '/a' }, { id: '/b', label: 'B', href: '/b' }]} />
      </PinfoldProvider>,
    );
    const add = screen.getByRole('button', { name: 'New tab' });
    expect(add.closest('[role="tablist"]')).toBeNull();
    fireEvent.click(add);
    expect(onAdd).toHaveBeenCalled();
    const b = screen.getByRole('tab', { name: 'B' });
    expect(b.tagName).toBe('A');
    fireEvent.click(b);
    expect(navigate).toHaveBeenCalledWith('/b');
    expect(b.getAttribute('aria-selected')).toBe('true');
  });

  it('the controller selects without onChange', () => {
    const onChange = vi.fn();
    let api: ReturnType<typeof useTabs> | null = null;
    function Probe() {
      const T = useTabs({ label: 'S', items: tabs, onChange });
      api = T;
      return <T />;
    }
    render(<Probe />);
    act(() => api!.next());
    expect(screen.getByRole('tab', { name: 'Billing' }).getAttribute('aria-selected')).toBe('true');
    act(() => api!.next());
    expect(screen.getByRole('tab', { name: 'Logs' }).getAttribute('aria-selected')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
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

  it('collapse "menu": the ellipsis opens a menu of the hidden crumbs, as links', () => {
    render(<Breadcrumb items={trail} maxItems={3} itemsAfterCollapse={1} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Show the full path' }));
    const rows = screen.getAllByRole('menuitem');
    expect(rows.map((r) => r.textContent)).toEqual(['Projects', 'Pinfold', 'Docs']);
    expect(rows[0].getAttribute('href')).toBe('/p');
  });

  it('collapse "expand": the ellipsis reveals the crumbs and moves focus to the first one', () => {
    render(<Breadcrumb items={trail} maxItems={3} itemsAfterCollapse={1} collapse="expand" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the full path' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(document.activeElement!.textContent).toBe('Projects');
  });

  it('path: crumbs from the URL, named or made readable; onNavigate takes plain clicks, a new-tab click stays the browser\'s', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb path="/projects/user-settings/billing" pathLabels={{ 'user-settings': 'Settings' }} onNavigate={onNavigate} />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Home', 'Projects', 'Settings', 'Billing']);
    const settings = screen.getByRole('link', { name: 'Settings' });
    expect(settings.getAttribute('href')).toBe('/projects/user-settings');
    const plain = fireEvent.click(settings);
    expect(plain).toBe(false);
    expect(onNavigate).toHaveBeenCalledWith('/projects/user-settings', expect.anything());
    const newTab = fireEvent.click(settings, { metaKey: true });
    expect(newTab).toBe(true);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('a crumb menu: a named button beside the crumb opens the other pages; without onNavigate the provider routes', () => {
    const navigate = vi.fn();
    render(
      <PinfoldProvider navigate={navigate}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Pinfold', href: '/p/pinfold', menu: [{ label: 'Atlas', href: '/p/atlas' }, { label: 'Nova', href: '/p/nova' }] }, 'Docs']} />
      </PinfoldProvider>,
    );
    const toggle = screen.getByRole('button', { name: 'Other pages' });
    expect(toggle.getAttribute('aria-haspopup')).toBe('menu');
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nova' }));
    expect(navigate).toHaveBeenCalledWith('/p/nova');
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(navigate).toHaveBeenLastCalledWith('/');
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
    expect(container.querySelector('.pinfold-pagination__cursor')!.getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenLastCalledWith(7, expect.objectContaining({ pageSize: 10, offset: 60, reason: 'page' }));
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

  it('server side: total and page size give the pages and the summary; a size change keeps the first item on screen', () => {
    const onChange = vi.fn();
    const { container } = render(<Pagination total={532} defaultPage={3} pageSizes={[20, 50]} showInfo onChange={onChange} />);
    expect(container.querySelector('.pinfold-pagination__info')!.textContent).toBe('41–60 of 532');
    expect(screen.getByRole('button', { name: 'Page 27' })).toBeTruthy();
    const select = screen.getByRole('combobox', { name: 'Rows per page' });
    fireEvent.change(select, { target: { value: '50' } });
    // Item 41 was first; with 50 a page it is on page 1.
    expect(onChange).toHaveBeenLastCalledWith(1, expect.objectContaining({ pageSize: 50, offset: 0, reason: 'pageSize' }));
    expect(container.querySelector('.pinfold-pagination__info')!.textContent).toBe('1–50 of 532');
  });

  it('go to page: Enter jumps, clamped to the range', () => {
    const onChange = vi.fn();
    render(<Pagination count={12} showJump onChange={onChange} />);
    const field = screen.getByRole('spinbutton', { name: 'Go to page' });
    fireEvent.change(field, { target: { value: '99' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(12, expect.anything());
    expect((field as HTMLInputElement).value).toBe('');
  });

  it('an unknown total (hasNext) and compact show previous, where you are, next; loading blocks and is busy', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<Pagination hasNext defaultPage={4} onChange={onChange} />);
    expect(container.querySelector('.pinfold-pagination__status')!.textContent).toBe('Page 4');
    expect(screen.queryByRole('button', { name: 'Page 4' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenLastCalledWith(5, expect.anything());
    rerender(<Pagination hasNext={false} page={5} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Next page' }).getAttribute('aria-disabled')).toBe('true');
    rerender(<Pagination count={20} page={3} compact onChange={onChange} />);
    expect(container.querySelector('.pinfold-pagination__status')!.textContent).toBe('3 / 20Page 3 of 20');
    rerender(<Pagination count={20} page={3} loading onChange={onChange} />);
    expect(screen.getByRole('navigation').getAttribute('aria-busy')).toBe('true');
    onChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('the controller slices an array you hold', () => {
    let api: ReturnType<typeof usePagination> | null = null;
    function Probe() {
      const P = usePagination({ total: 7, defaultPageSize: 3 });
      api = P;
      return <P />;
    }
    render(<Probe />);
    expect(api!.slice(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual(['a', 'b', 'c']);
    act(() => api!.next());
    act(() => api!.next());
    expect(api!.slice(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual(['g']);
    act(() => api!.next());
    expect(api!.page).toBe(3);
  });
});

const steps = [{ label: 'Cart' }, { label: 'Shipping', description: 'Address' }, { label: 'Payment' }];
const wizard = [
  { label: 'Cart', content: <p>Cart content</p> },
  { label: 'Shipping', content: <p>Shipping form</p>, optional: true },
  { label: 'Payment', content: <p>Payment form</p> },
];

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

  it('without onChange there are no step buttons; the circle shows the number, a check when done, a mark on an error', () => {
    const { container } = render(<Stepper items={['Cart', { label: 'Pay', error: true }, 'Review']} defaultValue={1} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    const marks = container.querySelectorAll('.pinfold-stepper__indicator');
    expect(marks[0].querySelector('svg')).toBeTruthy();
    expect(marks[2].textContent).toBe('3');
    expect(container.querySelectorAll('li')[1].getAttribute('data-status')).toBe('error');
    expect(container.querySelectorAll('li')[1].textContent).toContain(', error');
  });

  it('linear: false makes every other step a button', () => {
    render(<Stepper items={steps} value={0} onChange={() => {}} linear={false} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('content: the current step\'s panel, labelled by it; Back and Next move and focus the panel', () => {
    const onChange = vi.fn();
    render(<Stepper items={wizard} onChange={onChange} />);
    const panel = screen.getByRole('group', { name: 'Cart' });
    expect(panel.textContent).toBe('Cart content');
    expect(screen.getByRole('button', { name: 'Back' }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChange).toHaveBeenLastCalledWith(1, expect.anything());
    expect(screen.getByRole('group', { name: 'Shipping' }).textContent).toBe('Shipping form');
    expect(document.activeElement).toBe(screen.getByRole('group', { name: 'Shipping' }));
    expect(screen.getByText('Optional')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('group', { name: 'Cart' })).toBeTruthy();
  });

  it('onNext false stays; a promise waits; Finish runs onComplete, then the done content shows', async () => {
    let valid = false;
    const onComplete = vi.fn(() => Promise.resolve());
    render(<Stepper items={wizard} onNext={(step) => (step === 0 ? valid : Promise.resolve(true))} onComplete={onComplete} doneContent={<p>Thanks</p>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('group', { name: 'Cart' })).toBeTruthy();
    valid = true;
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
    expect(screen.getByRole('group', { name: 'Payment' })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    expect(onComplete).toHaveBeenCalled();
    expect(screen.getByText('Thanks')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });
});

describePinfoldConformance({
  name: 'tabs',
  slots: ['root', 'header', 'list', 'tab', 'indicator', 'panel'],
  optionalSlots: ['icon', 'endContent', 'close', 'add'],
  dimension: { key: 'height', value: 36 },
  cssFile: 'packages/css/src/tabs.css',
  meta: tabsMeta,
  preset: { define: defineTabs as any, props: { label: 'S', items: tabs.slice(0, 2) } },
  hook: { use: useTabs as any, config: { label: 'S', items: tabs.slice(0, 2) } },
  render: (config) => <Tabs label="S" items={tabs.slice(0, 2)} {...config} />,
});

describePinfoldConformance({
  name: 'breadcrumb',
  slots: ['root', 'list', 'item', 'link', 'separator'],
  optionalSlots: ['icon', 'ellipsis', 'menuButton'],
  cssFile: 'packages/css/src/breadcrumb.css',
  meta: breadcrumbMeta,
  preset: { define: defineBreadcrumb as any, props: { items: trail } },
  hook: { use: useBreadcrumb as any, config: { items: trail } },
  render: (config) => <Breadcrumb items={trail.slice(-2)} {...config} />,
});

describePinfoldConformance({
  name: 'pagination',
  slots: ['root', 'list', 'item', 'previous', 'next'],
  optionalSlots: ['gap', 'first', 'last', 'info', 'cursor', 'status', 'size', 'jump'],
  cssFile: 'packages/css/src/pagination.css',
  meta: paginationMeta,
  preset: { define: definePagination as any, props: { count: 5 } },
  hook: { use: usePagination as any, config: { count: 5 } },
  render: (config) => <Pagination count={3} defaultPage={2} {...config} />,
});

describePinfoldConformance({
  name: 'stepper',
  slots: ['root', 'list', 'step', 'indicator', 'connector', 'text', 'label'],
  optionalSlots: ['button', 'description', 'panel', 'actions'],
  cssFile: 'packages/css/src/stepper.css',
  meta: stepperMeta,
  preset: { define: defineStepper as any, props: { items: steps } },
  hook: { use: useStepper as any, config: { items: steps } },
  render: (config) => <Stepper items={steps} defaultValue={1} {...config} />,
});
