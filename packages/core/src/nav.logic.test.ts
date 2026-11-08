// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { breadcrumbPath, breadcrumbVisible, inactiveBreadcrumbOptions, inactivePaginationOptions, inactiveStepperOptions, inactiveTabsOptions, pageAt, pageCount, pageWindow, paginationRange, stepStatus } from './nav.logic';
import { validateConfig } from './meta';
import { tabsMeta } from './tabs.meta';
import { stepperMeta } from './stepper.meta';

describe('navigation logic', () => {
  it('pagination: boundaries, siblings, gaps, and a list that keeps its length', () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationRange(6, 20)).toEqual([1, 'start-gap', 5, 6, 7, 'end-gap', 20]);
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'end-gap', 20]);
    expect(paginationRange(20, 20)).toEqual([1, 'start-gap', 16, 17, 18, 19, 20]);
    // A gap never hides a single page.
    expect(paginationRange(4, 20)).toEqual([1, 2, 3, 4, 5, 'end-gap', 20]);
    for (let p = 1; p <= 20; p++) expect(paginationRange(p, 20)).toHaveLength(7);
    expect(paginationRange(10, 30, 2, 2)).toEqual([1, 2, 'start-gap', 8, 9, 10, 11, 12, 'end-gap', 29, 30]);
    expect(paginationRange(99, 3)).toEqual([1, 2, 3]);
    expect(paginationRange(1, 0)).toEqual([]);
  });

  it('pagination: pages from a total, the window a page shows, and the page that keeps an item', () => {
    expect(pageCount(45, 20)).toBe(3);
    expect(pageCount(0, 20)).toBe(0);
    expect(pageCount(40, 20)).toBe(2);
    expect(pageWindow(3, 20, 45)).toEqual({ offset: 40, from: 41, to: 45 });
    expect(pageWindow(1, 20, 0)).toEqual({ offset: 0, from: 0, to: 0 });
    expect(pageWindow(2, 10)).toEqual({ offset: 10, from: 11, to: 20 });
    expect(pageAt(40, 25)).toBe(2);
    expect(pageAt(0, 50)).toBe(1);
  });

  it('breadcrumb: the first and last crumbs around a gap', () => {
    expect(breadcrumbVisible(4)).toEqual([0, 1, 2, 3]);
    expect(breadcrumbVisible(6, 4)).toEqual([0, -1, 5]);
    expect(breadcrumbVisible(6, 4, 1, 2)).toEqual([0, -1, 4, 5]);
    expect(breadcrumbVisible(3, 2, 1, 2)).toEqual([0, 1, 2]);
  });

  it('breadcrumb: crumbs from a path, readable and linked', () => {
    expect(breadcrumbPath('/projects/user-settings/?tab=1#top')).toEqual([
      { segment: '', href: '/', label: 'Home' },
      { segment: 'projects', href: '/projects', label: 'Projects' },
      { segment: 'user-settings', href: '/projects/user-settings', label: 'User settings' },
    ]);
    expect(breadcrumbPath('/', 'Start')).toEqual([{ segment: '', href: '/', label: 'Start' }]);
    expect(breadcrumbPath('/caf%C3%A9/%E0%A4')[1].label).toBe('Café');
    expect(breadcrumbPath('/caf%C3%A9/%E0%A4')[2].label).toBe('%E0%A4');
  });

  it('stepper: complete, current, upcoming', () => {
    expect([0, 1, 2].map((i) => stepStatus(i, 1))).toEqual(['complete', 'current', 'upcoming']);
    expect(stepStatus(2, 3)).toBe('complete');
  });

  it('string rows are valid where the meta allows them, and only there', () => {
    expect(validateConfig(tabsMeta, { label: 'View', items: ['Board', { id: 'list' }] })).toEqual([]);
    expect(validateConfig(stepperMeta, { items: ['Cart', 'Pay'] })).toEqual([]);
    expect(validateConfig(tabsMeta, { label: 'View', items: [3] }).map((p) => p.message)).toEqual(['Tabs: `items[0]` must be an object or a string.']);
  });

  it('inactive options', () => {
    expect(Object.keys(inactiveTabsOptions({ placement: 'start', onAdd: () => {} }))).toEqual(['fullWidth', 'closeLabel']);
    expect(inactiveTabsOptions({ onAdd: 1, onClose: 1 })).toEqual({});
    expect(Object.keys(inactiveBreadcrumbOptions({ items: [] }))).toEqual(['itemsBeforeCollapse', 'itemsAfterCollapse', 'collapse', 'expandLabel', 'path', 'pathLabels', 'homeLabel', 'tone']);
    expect(inactiveBreadcrumbOptions({ maxItems: 3, path: '/a', variant: 'pills' })).toEqual({});
    expect(Object.keys(inactivePaginationOptions({ count: 5, showControls: false, pageSizes: [10] }))).toEqual(['showEdges']);
    expect(Object.keys(inactivePaginationOptions({ total: 50, compact: true, hasNext: true }))).toEqual(['siblings', 'boundaries', 'showControls', 'hasNext']);
    expect(Object.keys(inactivePaginationOptions({ hasNext: true, pageSizes: [10] }))).toEqual(['showControls', 'siblings', 'boundaries', 'showEdges', 'compact']);
    expect(Object.keys(inactiveStepperOptions({ variant: 'bar', onChange: () => {}, items: [{ content: 1 }] }))).toEqual(['orientation', 'labelPlacement']);
    expect(Object.keys(inactiveStepperOptions({ orientation: 'vertical', items: ['a'] }))).toEqual(['labelPlacement', 'linear', 'showActions', 'doneContent']);
  });
});
