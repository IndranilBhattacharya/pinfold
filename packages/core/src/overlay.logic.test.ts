// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computePosition, inactiveDialogOptions, inactiveMenuOptions, inactivePopoverOptions, typeaheadIndex } from './overlay.logic';
import { createToastStore, toastDuration } from './toast.logic';

const viewport = { width: 1000, height: 800 };
const anchor = { x: 400, y: 300, width: 100, height: 40 };
const floating = { width: 200, height: 100 };

describe('computePosition', () => {
  it('places on the asked side, centred', () => {
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom', offset: 8 })).toMatchObject({ x: 350, y: 348, side: 'bottom' });
    expect(computePosition({ anchor, floating, viewport, placement: 'top', offset: 8 })).toMatchObject({ x: 350, y: 192, side: 'top' });
    expect(computePosition({ anchor, floating, viewport, placement: 'end', offset: 8 })).toMatchObject({ x: 508, y: 270, side: 'right' });
  });

  it('aligns to start and end, and swaps them in RTL', () => {
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-start' }).x).toBe(400);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-end' }).x).toBe(300);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-start', rtl: true }).x).toBe(300);
    expect(computePosition({ anchor, floating, viewport, placement: 'start', rtl: true }).side).toBe('right');
  });

  it('flips only when the other side has more room', () => {
    const low = { ...anchor, y: 750 };
    expect(computePosition({ anchor: low, floating, viewport, placement: 'bottom' }).side).toBe('top');
    const tiny = { width: 1000, height: 60 };
    expect(computePosition({ anchor: { ...anchor, y: 5, height: 10 }, floating, viewport: tiny, placement: 'top' }).side).toBe('bottom');
  });

  it('shifts along the edge to stay on screen; the arrow keeps pointing at the anchor', () => {
    const left = computePosition({ anchor: { ...anchor, x: 0 }, floating, viewport, placement: 'bottom', padding: 8 });
    expect(left.x).toBe(8);
    expect(left.arrow).toBe(42);
    const far = computePosition({ anchor: { ...anchor, x: 950, width: 50 }, floating, viewport, placement: 'bottom', padding: 8 });
    expect(far.x).toBe(792);
    expect(far.arrow).toBe(183);
  });
});

describe('typeaheadIndex', () => {
  const labels = ['Copy', 'Cut', 'Delete', 'Duplicate'];
  it('cycles on one repeated letter and refines on a longer query', () => {
    expect(typeaheadIndex(labels, 'c', 0)).toBe(1);
    expect(typeaheadIndex(labels, 'c', 1)).toBe(0);
    expect(typeaheadIndex(labels, 'dd', 2)).toBe(3);
    expect(typeaheadIndex(labels, 'du', 2)).toBe(3);
    expect(typeaheadIndex(labels, 'x', 0)).toBe(-1);
    expect(typeaheadIndex(labels, '', 0)).toBe(-1);
  });
});

describe('inactive options', () => {
  it('lists what has no effect', () => {
    expect(Object.keys(inactivePopoverOptions({}))).toEqual(['delay', 'closeDelay']);
    expect(inactivePopoverOptions({ openOn: 'hover' })).toEqual({});
    expect(Object.keys(inactiveDialogOptions({ placement: 'end', closeButton: false, modal: false }))).toEqual(['size', 'closeLabel', 'closeOnOutside']);
    expect(Object.keys(inactiveMenuOptions({ mode: 'context' }))).toEqual(['placement', 'offset']);
  });
});

describe('toast store', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('auto-dismisses, but keeps errors and toasts with an action', () => {
    expect(toastDuration({}, 5000)).toBe(5000);
    expect(toastDuration({ tone: 'danger' }, 5000)).toBe(0);
    expect(toastDuration({ action: {} }, 5000)).toBe(0);
    expect(toastDuration({ tone: 'danger', duration: 100 }, 5000)).toBe(100);
    const store = createToastStore();
    store.show({ id: 'a' });
    store.show({ id: 'b', tone: 'danger' });
    vi.advanceTimersByTime(5000);
    expect(store.getVisible().map((t) => t.id)).toEqual(['b']);
  });

  it('pauses with the time left, and resumes', () => {
    const onDismiss = vi.fn();
    const store = createToastStore({ duration: 1000 });
    store.show({ id: 'a', onDismiss });
    vi.advanceTimersByTime(600);
    store.pause();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).not.toHaveBeenCalled();
    store.resume();
    vi.advanceTimersByTime(399);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('queues past max: a waiting toast starts counting when it shows', () => {
    const store = createToastStore({ duration: 1000, max: 1 });
    store.show({ id: 'a' });
    store.show({ id: 'b' });
    expect(store.getVisible().map((t) => t.id)).toEqual(['a']);
    vi.advanceTimersByTime(1000);
    expect(store.getVisible().map((t) => t.id)).toEqual(['b']);
    vi.advanceTimersByTime(999);
    expect(store.getVisible().map((t) => t.id)).toEqual(['b']);
    vi.advanceTimersByTime(1);
    expect(store.getVisible()).toEqual([]);
  });

  it('updates a toast in place by id and restarts its timer; the array identity is stable between changes', () => {
    const store = createToastStore<{ id?: string; duration?: number; title?: string }>({ duration: 1000 });
    store.show({ id: 'save', title: 'Saving', duration: 0 });
    const before = store.getVisible();
    expect(store.getVisible()).toBe(before);
    store.show({ id: 'save', title: 'Saved', duration: 500 });
    expect(store.getVisible()).toHaveLength(1);
    expect(store.getVisible()[0].title).toBe('Saved');
    vi.advanceTimersByTime(500);
    expect(store.getVisible()).toEqual([]);
  });

  it('notifies subscribers and generates ids', () => {
    const store = createToastStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    const id = store.show({});
    expect(id).toBe('toast-1');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.clear();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
