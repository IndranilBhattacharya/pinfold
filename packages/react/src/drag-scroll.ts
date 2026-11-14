import * as React from 'react';

/** How far the pointer travels (px) before a press becomes a drag: under it, the press is still a click. */
const SLOP = 5;

/**
 * A strip that hides part of itself (tabs, links in a bar) scrolls when dragged with the mouse, and
 * with the wheel: a mouse has no sideways swipe, so without this the hidden items are out of reach.
 * Touch and pen scroll natively and are left alone.
 *
 * - A press that moves past a few pixels becomes a drag: the box gets `data-dragging` (styles turn off
 *   text selection and show a grabbing cursor), and the click that would follow the release is dropped.
 * - A press that stays put is an ordinary click.
 * - A vertical wheel over a sideways strip scrolls it, until it reaches its end; then the page scrolls.
 * - Elements marked `draggable="true"` keep their own drag (tab reordering).
 *
 * Listeners on the window live only between press and release; everything is removed on unmount.
 */
export function useDragScroll(box: React.RefObject<HTMLElement | null>, on: boolean, axis: 'x' | 'y' = 'x'): void {
  React.useEffect(() => {
    const el = box.current;
    if (!on || !el) return;
    const horizontal = axis === 'x';
    let startAt = 0;
    let startScroll = 0;
    let dragging = false;
    let release: (() => void) | null = null;

    const overflows = () => (horizontal ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight) > 1;
    const point = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY);

    const onMove = (event: PointerEvent) => {
      const moved = point(event) - startAt;
      if (!dragging) {
        if (Math.abs(moved) < SLOP) return;
        dragging = true;
        el.setAttribute('data-dragging', '');
        // A selection that began with the press would grow with the drag.
        el.ownerDocument.defaultView?.getSelection?.()?.removeAllRanges();
      }
      if (horizontal) el.scrollLeft = startScroll - moved;
      else el.scrollTop = startScroll - moved;
    };
    const swallowClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const onUp = () => {
      release?.();
      if (!dragging) return;
      dragging = false;
      el.removeAttribute('data-dragging');
      // The release ends a drag, not a press: the click it produces must not follow a link or pick a tab.
      const view = el.ownerDocument.defaultView;
      if (!view) return;
      view.addEventListener('click', swallowClick, { capture: true, once: true });
      view.setTimeout(() => view.removeEventListener('click', swallowClick, true), 0);
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !overflows()) return;
      const target = event.target as Element | null;
      if (target?.closest?.('[draggable="true"], input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
      release?.();
      startAt = point(event);
      startScroll = horizontal ? el.scrollLeft : el.scrollTop;
      const view = el.ownerDocument.defaultView;
      if (!view) return;
      view.addEventListener('pointermove', onMove);
      view.addEventListener('pointerup', onUp);
      view.addEventListener('pointercancel', onUp);
      release = () => {
        view.removeEventListener('pointermove', onMove);
        view.removeEventListener('pointerup', onUp);
        view.removeEventListener('pointercancel', onUp);
        release = null;
      };
    };
    // A link or an image would start a native drag and steal the gesture.
    const onDragStart = (event: DragEvent) => {
      if (release && !(event.target as Element | null)?.closest?.('[draggable="true"]')) event.preventDefault();
    };
    const onWheel = (event: WheelEvent) => {
      if (!horizontal || event.ctrlKey || !overflows()) return;
      // A sideways wheel or trackpad already scrolls the strip natively.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      // Down moves toward the end of the strip. In right-to-left, scrollLeft runs from -max to 0.
      const max = el.scrollWidth - el.clientWidth;
      const rtl = el.ownerDocument.defaultView?.getComputedStyle(el).direction === 'rtl';
      const before = el.scrollLeft;
      const next = rtl ? Math.min(0, Math.max(-max, before - event.deltaY)) : Math.min(max, Math.max(0, before + event.deltaY));
      // At its end the strip lets go, so the page under it scrolls on.
      if (Math.abs(next - before) < 0.5) return;
      el.scrollLeft = next;
      event.preventDefault();
    };

    // In the capture phase: a child that stops the event (a menu trigger) is still part of the strip.
    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      release?.();
      el.removeAttribute('data-dragging');
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('dragstart', onDragStart);
      el.removeEventListener('wheel', onWheel);
    };
  }, [box, on, axis]);
}

/**
 * Scroll a strip, and only the strip, until `item` is inside it with `pad` px to spare. Unlike
 * `scrollIntoView` this never moves the page: a row that is itself off screen stays where it is.
 */
export function revealInStrip(box: HTMLElement | null, item: Element | null | undefined, axis: 'x' | 'y' = 'x', pad = 40): void {
  if (!box || !item) return;
  const outer = box.getBoundingClientRect();
  const inner = item.getBoundingClientRect();
  if (axis === 'x') {
    if (box.scrollWidth - box.clientWidth <= 1) return;
    if (inner.left < outer.left + pad) box.scrollLeft -= outer.left + pad - inner.left;
    else if (inner.right > outer.right - pad) box.scrollLeft += inner.right - (outer.right - pad);
  } else {
    if (box.scrollHeight - box.clientHeight <= 1) return;
    if (inner.top < outer.top + pad) box.scrollTop -= outer.top + pad - inner.top;
    else if (inner.bottom > outer.bottom - pad) box.scrollTop += inner.bottom - (outer.bottom - pad);
  }
}
