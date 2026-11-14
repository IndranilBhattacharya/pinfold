import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { revealInStrip, useDragScroll } from './drag-scroll';

afterEach(cleanup);

/** A pointer event with the fields jsdom leaves out. */
function pointer(type: string, init: { x?: number; y?: number; pointerType?: string; button?: number } = {}) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: init.x ?? 0, clientY: init.y ?? 0, button: init.button ?? 0 });
  Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'mouse' });
  return event;
}

/** A strip 100px wide holding 300px: it overflows by 200. */
function overflowing(el: HTMLElement, axis: 'x' | 'y' = 'x') {
  const size = axis === 'x' ? ['scrollWidth', 'clientWidth'] : ['scrollHeight', 'clientHeight'];
  Object.defineProperty(el, size[0], { configurable: true, value: 300 });
  Object.defineProperty(el, size[1], { configurable: true, value: 100 });
}

function Strip({ on = true, onPick, axis = 'x' }: { on?: boolean; onPick?: () => void; axis?: 'x' | 'y' }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useDragScroll(ref, on, axis);
  return (
    <div ref={ref} data-testid="strip">
      <button type="button" onClick={onPick}>
        One
      </button>
      <span draggable="true" data-testid="own">
        Reorder me
      </span>
    </div>
  );
}

function setup(props: React.ComponentProps<typeof Strip> = {}) {
  const view = render(<Strip {...props} />);
  const strip = view.getByTestId('strip');
  overflowing(strip, props.axis);
  return { ...view, strip, button: view.getByRole('button') };
}

describe('useDragScroll', () => {
  it('a press that moves less than the slop is an ordinary click', () => {
    const onPick = vi.fn();
    const { strip, button } = setup({ onPick });
    button.dispatchEvent(pointer('pointerdown', { x: 50 }));
    window.dispatchEvent(pointer('pointermove', { x: 47 }));
    expect(strip.hasAttribute('data-dragging')).toBe(false);
    window.dispatchEvent(pointer('pointerup', { x: 47 }));
    button.click();
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(strip.scrollLeft).toBe(0);
  });

  it('past the slop it drags: marks the strip, scrolls it, and drops the click the release makes', () => {
    const onPick = vi.fn();
    const { strip, button } = setup({ onPick });
    button.dispatchEvent(pointer('pointerdown', { x: 80 }));
    window.dispatchEvent(pointer('pointermove', { x: 60 }));
    expect(strip.hasAttribute('data-dragging')).toBe(true);
    expect(strip.scrollLeft).toBe(20);
    window.dispatchEvent(pointer('pointermove', { x: 20 }));
    expect(strip.scrollLeft).toBe(60);
    window.dispatchEvent(pointer('pointerup', { x: 20 }));
    expect(strip.hasAttribute('data-dragging')).toBe(false);
    button.click();
    expect(onPick).not.toHaveBeenCalled();
    // Only that one click: the next is a real one.
    button.click();
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('scrolls along the block axis for a vertical strip', () => {
    const { strip, button } = setup({ axis: 'y' });
    button.dispatchEvent(pointer('pointerdown', { y: 80 }));
    window.dispatchEvent(pointer('pointermove', { y: 50 }));
    expect(strip.scrollTop).toBe(30);
    window.dispatchEvent(pointer('pointerup', { y: 50 }));
  });

  it('leaves draggable elements, touch and pen, other buttons and a strip that fits alone', () => {
    const { strip, button, getByTestId } = setup();
    getByTestId('own').dispatchEvent(pointer('pointerdown', { x: 80 }));
    window.dispatchEvent(pointer('pointermove', { x: 20 }));
    expect(strip.hasAttribute('data-dragging')).toBe(false);
    window.dispatchEvent(pointer('pointerup'));
    for (const init of [{ pointerType: 'touch' }, { pointerType: 'pen' }, { button: 2 }]) {
      button.dispatchEvent(pointer('pointerdown', { x: 80, ...init }));
      window.dispatchEvent(pointer('pointermove', { x: 20, ...init }));
      expect(strip.hasAttribute('data-dragging')).toBe(false);
      window.dispatchEvent(pointer('pointerup', init));
    }
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 100 });
    button.dispatchEvent(pointer('pointerdown', { x: 80 }));
    window.dispatchEvent(pointer('pointermove', { x: 20 }));
    expect(strip.hasAttribute('data-dragging')).toBe(false);
    expect(strip.scrollLeft).toBe(0);
  });

  it('a vertical wheel scrolls a sideways strip until its end, then lets the page have it', () => {
    const { strip } = setup();
    const wheel = (deltaY: number, deltaX = 0) => {
      const event = new WheelEvent('wheel', { deltaY, deltaX, bubbles: true, cancelable: true });
      strip.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(wheel(50)).toBe(true);
    expect(strip.scrollLeft).toBe(50);
    // A sideways wheel already scrolls natively.
    expect(wheel(0, 40)).toBe(false);
    // At the start a wheel up has nowhere to go: the page scrolls instead.
    strip.scrollLeft = 0;
    expect(wheel(-30)).toBe(false);
  });

  it('off: nothing is listened to', () => {
    const { strip, button } = setup({ on: false });
    button.dispatchEvent(pointer('pointerdown', { x: 80 }));
    window.dispatchEvent(pointer('pointermove', { x: 20 }));
    expect(strip.hasAttribute('data-dragging')).toBe(false);
  });

  it('unmounting mid-press removes the window listeners it added', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    try {
      const { button, unmount } = setup();
      button.dispatchEvent(pointer('pointerdown', { x: 80 }));
      const added = add.mock.calls.filter(([type]) => String(type).startsWith('pointer')).map(([type, fn]) => [type, fn]);
      expect(added.map(([type]) => type).sort()).toEqual(['pointercancel', 'pointermove', 'pointerup']);
      unmount();
      for (const [type, fn] of added) expect(remove.mock.calls.some(([t, f]) => t === type && f === fn)).toBe(true);
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });
});

describe('revealInStrip', () => {
  /** A 100px strip at x 0, scrolled by `scroll`, and an item at [left, right] on screen. */
  function strip(scroll: number, left: number, right: number, overflow = true) {
    const box = document.createElement('div');
    Object.defineProperty(box, 'scrollWidth', { configurable: true, value: overflow ? 500 : 100 });
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 100 });
    box.scrollLeft = scroll;
    box.getBoundingClientRect = () => ({ left: 0, right: 100, top: 0, bottom: 40, x: 0, y: 0, width: 100, height: 40, toJSON() {} });
    const item = document.createElement('span');
    item.getBoundingClientRect = () => ({ left, right, top: 0, bottom: 40, x: left, y: 0, width: right - left, height: 40, toJSON() {} });
    return { box, item };
  }

  it('brings an item past either edge in, with room to spare, and leaves one in view alone', () => {
    const right = strip(0, 90, 130);
    revealInStrip(right.box, right.item, 'x', 10);
    expect(right.box.scrollLeft).toBe(40);
    const left = strip(200, -30, 10);
    revealInStrip(left.box, left.item, 'x', 10);
    expect(left.box.scrollLeft).toBe(160);
    const inside = strip(50, 20, 60);
    revealInStrip(inside.box, inside.item, 'x', 10);
    expect(inside.box.scrollLeft).toBe(50);
  });

  it('does nothing for a strip that does not overflow, or with no item', () => {
    const fits = strip(0, 90, 130, false);
    revealInStrip(fits.box, fits.item, 'x', 10);
    expect(fits.box.scrollLeft).toBe(0);
    revealInStrip(fits.box, null);
    revealInStrip(null, fits.item);
  });
});
