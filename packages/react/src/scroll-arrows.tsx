import * as React from 'react';
import { watchScrollEdges } from '@pinfold/core';

const ROWS_PER_SECOND = 8;

const chevron = (up: boolean) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d={up ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
  </svg>
);

/**
 * Chevron bars at the top and bottom of a list that scrolls (Select, Combobox, Command, Menu): they
 * show only while that edge hides rows. Resting the pointer on one scrolls at a steady eight rows a
 * second; pressing it scrolls a page. They are pointer helpers only: hidden from assistive tech,
 * never focusable, and a press never moves focus (a select keeps its open list). The keys already
 * scroll the list.
 *
 * Place `up` first and `down` last inside the scrolling element: they are sticky and take no room.
 */
export function useScrollArrows(box: React.RefObject<HTMLElement | null>, on: boolean, open = true, watch = true): { up: React.ReactNode; down: React.ReactNode } {
  const frame = React.useRef(0);
  const stop = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
  };
  // The edges that hide rows (data-overflow-top / -bottom on the list), written without a render.
  React.useEffect(() => {
    const el = box.current;
    if (!on || !open || !watch || !el) return;
    return watchScrollEdges(el);
  }, [on, open, watch, box]);
  React.useEffect(() => stop, []);
  if (!on) return { up: null, down: null };

  const row = (el: HTMLElement) => (el.querySelector<HTMLElement>('[role="option"], [role^="menuitem"]')?.offsetHeight || 36);
  const glide = (dir: 1 | -1) => {
    const el = box.current;
    if (!el) return;
    stop();
    let last = performance.now();
    const speed = row(el) * ROWS_PER_SECOND;
    const tick = (now: number) => {
      el.scrollTop += (dir * speed * (now - last)) / 1000;
      last = now;
      const atEnd = dir > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - 1 : el.scrollTop <= 0;
      frame.current = atEnd ? 0 : requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  const bar = (dir: 1 | -1) => (
    <div
      className="pinfold-scroll-arrow"
      data-dir={dir < 0 ? 'up' : 'down'}
      aria-hidden="true"
      onPointerEnter={(e) => e.pointerType === 'mouse' && glide(dir)}
      onPointerLeave={stop}
      // Keep focus where it is (the select's field, the menu's row).
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        const el = box.current;
        if (el) el.scrollTop += dir * Math.max(row(el), el.clientHeight - row(el));
      }}
    >
      <span>{chevron(dir < 0)}</span>
    </div>
  );
  return { up: bar(-1), down: bar(1) };
}
