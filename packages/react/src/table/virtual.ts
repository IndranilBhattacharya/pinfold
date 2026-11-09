import * as React from 'react';
import { GRID_MAX_SCROLL, gridWindow, type GridWindow, type RowSizes } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';

/**
 * The virtual scroll position of a table body. Up to `GRID_MAX_SCROLL` the scroll area is the real
 * height and this is the plain scroll position. Past it (a list taller than any browser allows), the
 * area is drawn at the cap, the wheel and keys move the virtual position pixel by pixel, and the
 * scrollbar maps proportionally, so a billion rows still scroll one row at a time.
 */
export function useVirtualRows(enabled: boolean, sizes: RowSizes, scroller: React.RefObject<HTMLElement | null>, headerHeight: number) {
  const top = React.useRef(0);
  const lastSet = React.useRef(-1);
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);
  const [viewport, setViewport] = React.useState(480);
  const total = sizes.total;
  const body = Math.max(1, viewport - headerHeight);
  const scrollHeight = Math.min(total, GRID_MAX_SCROLL);
  const ratio = total > scrollHeight && scrollHeight > body ? (total - body) / (scrollHeight - body) : 1;
  const ratioRef = React.useRef(ratio);
  ratioRef.current = ratio;

  const place = (el: HTMLElement, virtualTop: number) => {
    const max = Math.max(0, total - body);
    top.current = Math.max(0, Math.min(virtualTop, max));
    const real = Math.round(top.current / ratioRef.current);
    lastSet.current = real;
    el.scrollTop = real;
    rerender();
  };

  useIsomorphicLayoutEffect(() => {
    const el = scroller.current;
    if (!enabled || !el) return;
    setViewport(el.clientHeight || 480);
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => setViewport(el.clientHeight || 480));
    resize?.observe(el);
    const onScroll = () => {
      // Our own scroll (wheel or keys) already set the virtual position.
      if (el.scrollTop === lastSet.current) return;
      lastSet.current = -1;
      top.current = el.scrollTop * ratioRef.current;
      rerender();
    };
    const onWheel = (event: WheelEvent) => {
      if (ratioRef.current === 1 || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? sizes.height : event.deltaMode === 2 ? el.clientHeight : 1;
      place(el, top.current + event.deltaY * unit);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      resize?.disconnect();
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
    };
  }, [enabled, scroller]);

  const win: GridWindow | null = enabled ? gridWindow(sizes, top.current, body, 8) : null;
  return {
    window: win,
    /** Bring row `i` fully into view. */
    scrollToRow: (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const y = sizes.offset(i);
      const h = sizes.size(i);
      if (!enabled) return;
      if (y < top.current) place(el, y);
      else if (y + h > top.current + body) place(el, y + h - body);
    },
    /** Back to the first row (sort or filters changed). */
    reset: () => {
      const el = scroller.current;
      if (el && enabled) place(el, 0);
    },
  };
}
