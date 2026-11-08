/** Tabs, breadcrumb, pagination and stepper rules, framework-free. */

/** A gap in a page list: the pages hidden between the start pages and the ones around the current. */
export type PaginationGap = 'start-gap' | 'end-gap';

const span = (from: number, to: number): number[] => (to < from ? [] : Array.from({ length: to - from + 1 }, (_, i) => from + i));

/**
 * The pages to show: `boundaries` at each end, `siblings` either side of the current page, and a gap
 * where pages are hidden. The list keeps the same length whatever the page, so the controls never
 * jump under the pointer. A gap that would hide a single page shows that page instead.
 *
 *   paginationRange(6, 20) // [1, 'start-gap', 5, 6, 7, 'end-gap', 20]
 */
export function paginationRange(page: number, count: number, siblings = 1, boundaries = 1): Array<number | PaginationGap> {
  if (count < 1) return [];
  const current = Math.min(Math.max(1, page), count);
  // Everything fits: boundaries + gaps + siblings + current.
  if (count <= boundaries * 2 + siblings * 2 + 3) return span(1, count);
  const start = span(1, boundaries);
  const end = span(count - boundaries + 1, count);
  const from = Math.max(Math.min(current - siblings, count - boundaries - siblings * 2 - 1), boundaries + 2);
  const to = Math.min(Math.max(current + siblings, boundaries + siblings * 2 + 2), count - boundaries - 1);
  return [
    ...start,
    from > boundaries + 2 ? 'start-gap' : boundaries + 1,
    ...span(from, to),
    to < count - boundaries - 1 ? 'end-gap' : count - boundaries,
    ...end,
  ];
}

/**
 * Which crumbs show when there are more than `max`: the first `before`, a gap (-1), and the last
 * `after`. Without `max`, or when they fit, every index.
 */
export function breadcrumbVisible(count: number, max?: number, before = 1, after = 1): number[] {
  const all = span(0, count - 1);
  if (!max || count <= max || before + after >= count) return all;
  return [...span(0, before - 1), -1, ...span(count - after, count - 1)];
}

export type StepStatus = 'complete' | 'current' | 'upcoming';

/** A step's status from the current step (0-based). Past the last step, every step is complete. */
export function stepStatus(index: number, current: number): StepStatus {
  return index < current ? 'complete' : index === current ? 'current' : 'upcoming';
}

/** Options with no visible effect in the current config. */
export function inactiveTabsOptions(config: { orientation?: string }): Record<string, string> {
  return config.orientation === 'vertical' ? { fullWidth: 'a vertical list already fills its column.' } : {};
}

export function inactiveBreadcrumbOptions(config: { maxItems?: number }): Record<string, string> {
  if (config.maxItems) return {};
  const why = 'only used with `maxItems`.';
  return { itemsBeforeCollapse: why, itemsAfterCollapse: why };
}

export function inactivePaginationOptions(config: { showControls?: boolean; count?: number; siblings?: number; boundaries?: number }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.showControls === false) out.showEdges = 'the first and last buttons sit with the previous and next ones.';
  return out;
}

export function inactiveStepperOptions(config: { variant?: string }): Record<string, string> {
  return config.variant === 'bar' ? { orientation: 'a bar is always a row.' } : {};
}
