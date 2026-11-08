import type * as React from 'react';
import { useIsomorphicLayoutEffect } from './hooks';

/**
 * A sliding indicator (a pill, an underline) measured from the selected element in a box: writes
 * `<prefix>x/y/w/h` in px on the box and marks it `data-placed`. One observer per box, only while
 * `on`; until placed (first paint, no script) the selected element draws the indicator itself.
 */
export function useSlidingIndicator(box: React.RefObject<HTMLElement | null>, on: boolean, selector: string, index: number, prefix: string, extra?: unknown): void {
  useIsomorphicLayoutEffect(() => {
    const el = box.current;
    if (!on || !el) return;
    const place = () => {
      const target = el.querySelectorAll<HTMLElement>(selector)[index];
      if (!target) {
        el.removeAttribute('data-placed');
        return;
      }
      el.style.setProperty(prefix + 'x', `${target.offsetLeft}px`);
      el.style.setProperty(prefix + 'y', `${target.offsetTop}px`);
      el.style.setProperty(prefix + 'w', `${target.offsetWidth}px`);
      el.style.setProperty(prefix + 'h', `${target.offsetHeight}px`);
      el.setAttribute('data-placed', '');
    };
    place();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [on, index, extra]);
}
