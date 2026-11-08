// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { breadcrumbVisible, inactiveBreadcrumbOptions, inactivePaginationOptions, inactiveStepperOptions, inactiveTabsOptions, paginationRange, stepStatus } from './nav.logic';

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

  it('breadcrumb: the first and last crumbs around a gap', () => {
    expect(breadcrumbVisible(4)).toEqual([0, 1, 2, 3]);
    expect(breadcrumbVisible(6, 4)).toEqual([0, -1, 5]);
    expect(breadcrumbVisible(6, 4, 1, 2)).toEqual([0, -1, 4, 5]);
    expect(breadcrumbVisible(3, 2, 1, 2)).toEqual([0, 1, 2]);
  });

  it('stepper: complete, current, upcoming', () => {
    expect([0, 1, 2].map((i) => stepStatus(i, 1))).toEqual(['complete', 'current', 'upcoming']);
    expect(stepStatus(2, 3)).toBe('complete');
  });

  it('inactive options', () => {
    expect(Object.keys(inactiveTabsOptions({ orientation: 'vertical' }))).toEqual(['fullWidth']);
    expect(inactiveTabsOptions({})).toEqual({});
    expect(Object.keys(inactiveBreadcrumbOptions({}))).toEqual(['itemsBeforeCollapse', 'itemsAfterCollapse']);
    expect(inactiveBreadcrumbOptions({ maxItems: 3 })).toEqual({});
    expect(Object.keys(inactivePaginationOptions({ showControls: false }))).toEqual(['showEdges']);
    expect(Object.keys(inactiveStepperOptions({ variant: 'bar' }))).toEqual(['orientation']);
  });
});
