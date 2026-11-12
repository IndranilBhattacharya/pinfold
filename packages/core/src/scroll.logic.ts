/** Scroll rules shared by every scrolling surface: which edges have more content, and keeping an end in view. */

export interface ScrollEdges {
  /** More content above. */
  top: boolean;
  /** More content below. */
  bottom: boolean;
  /** More content before the inline start (left in LTR). */
  start: boolean;
  /** More content after the inline end. */
  end: boolean;
}

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export const NO_EDGES: ScrollEdges = { top: false, bottom: false, start: false, end: false };

/**
 * Which edges hide content. `threshold` (px) absorbs fractional scroll offsets on zoomed screens.
 * In RTL `scrollLeft` runs from 0 down to a negative number, so the absolute value is the distance
 * from the inline start in both directions.
 */
export function scrollEdges(m: ScrollMetrics, threshold = 1): ScrollEdges {
  const y = m.scrollHeight - m.clientHeight;
  const x = m.scrollWidth - m.clientWidth;
  const left = Math.abs(m.scrollLeft);
  return {
    top: y > threshold && m.scrollTop > threshold,
    bottom: y > threshold && m.scrollTop < y - threshold,
    start: x > threshold && left > threshold,
    end: x > threshold && left < x - threshold,
  };
}

export function sameEdges(a: ScrollEdges, b: ScrollEdges): boolean {
  return a.top === b.top && a.bottom === b.bottom && a.start === b.start && a.end === b.end;
}

/** Whether a viewport is within `slack` px of its block end: a chat only follows new messages while this holds. */
export function atScrollEnd(m: Pick<ScrollMetrics, 'scrollTop' | 'scrollHeight' | 'clientHeight'>, slack = 24): boolean {
  return m.scrollHeight - m.clientHeight - m.scrollTop <= slack;
}

const EDGE_KEYS = ['top', 'bottom', 'start', 'end'] as const;

/**
 * Keep `data-overflow-top | -bottom | -start | -end` on `target` (default the viewport itself) in
 * step with what `viewport` hides, and report every change. Writes attributes directly, so a
 * component gets edge fades with no re-render. Returns the cleanup; every listener and observer it
 * added is removed there.
 */
export function watchScrollEdges(
  viewport: HTMLElement,
  options: { target?: HTMLElement | null; onChange?: (edges: ScrollEdges) => void; threshold?: number } = {},
): () => void {
  const target = options.target ?? viewport;
  let last: ScrollEdges = NO_EDGES;
  let frame = 0;
  const measure = () => {
    frame = 0;
    const next = scrollEdges(viewport, options.threshold);
    for (const key of EDGE_KEYS) {
      if (next[key]) target.setAttribute(`data-overflow-${key}`, '');
      else target.removeAttribute(`data-overflow-${key}`);
    }
    if (!sameEdges(last, next)) {
      last = next;
      options.onChange?.(next);
    }
  };
  const schedule = () => {
    if (frame) return;
    frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(measure) : (setTimeout(measure, 16) as unknown as number);
  };
  viewport.addEventListener('scroll', schedule, { passive: true });
  let resize: ResizeObserver | undefined;
  let mutate: MutationObserver | undefined;
  if (typeof ResizeObserver === 'function') {
    resize = new ResizeObserver(schedule);
    resize.observe(viewport);
    for (const child of Array.from(viewport.children)) resize.observe(child);
  }
  if (typeof MutationObserver === 'function') {
    // Rows added or removed change what is hidden without resizing the viewport.
    mutate = new MutationObserver(() => {
      if (resize) for (const child of Array.from(viewport.children)) resize.observe(child);
      schedule();
    });
    mutate.observe(viewport, { childList: true });
  }
  measure();
  return () => {
    viewport.removeEventListener('scroll', schedule);
    resize?.disconnect();
    mutate?.disconnect();
    if (frame) (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout)(frame);
    frame = 0;
    for (const key of EDGE_KEYS) target.removeAttribute(`data-overflow-${key}`);
  };
}

/** Options with no visible effect in the current config. */
export function inactiveScrollAreaOptions(config: { indicator?: string; indicatorSize?: unknown; tone?: unknown; stickToEnd?: boolean; orientation?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  const indicator = config.indicator ?? 'fade';
  if (indicator === 'none') out.indicatorSize = 'there is no indicator.';
  if (indicator !== 'glow' && indicator !== 'line') out.tone = 'only the glow and line indicators are coloured.';
  if (config.stickToEnd && config.orientation === 'horizontal') out.stickToEnd = 'it follows the block end; this area scrolls sideways.';
  return out;
}
