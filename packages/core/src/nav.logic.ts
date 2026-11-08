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

/** How many pages `total` items fill, `pageSize` to a page. */
export function pageCount(total: number, pageSize: number): number {
  return total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 0;
}

/**
 * Where a page sits in the items: `offset` (what a server query skips), and the 1-based `from` and
 * `to` of the items it shows. Without `total` (a cursor-paged list), `to` is a full page.
 *
 *   pageWindow(3, 20, 45) // { offset: 40, from: 41, to: 45 }
 */
export function pageWindow(page: number, pageSize: number, total?: number): { offset: number; from: number; to: number } {
  const offset = Math.max(0, (page - 1) * pageSize);
  if (total === 0) return { offset: 0, from: 0, to: 0 };
  return { offset, from: offset + 1, to: total === undefined ? offset + pageSize : Math.min(total, offset + pageSize) };
}

/** The page that shows the item at `offset`: after a page-size change, the first item stays on screen. */
export function pageAt(offset: number, pageSize: number): number {
  return Math.floor(Math.max(0, offset) / Math.max(1, pageSize)) + 1;
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

/**
 * The crumbs of a URL path: the root, then one per segment, each linking to the path up to it. The
 * label is the segment made readable ("user-settings" reads "User settings").
 *
 *   breadcrumbPath('/projects/pinfold') // [{ segment: '', href: '/', label: 'Home' }, { segment: 'projects', href: '/projects', label: 'Projects' }, ...]
 */
export function breadcrumbPath(path: string, home = 'Home'): Array<{ segment: string; href: string; label: string }> {
  const clean = path.split(/[?#]/)[0];
  const segments = clean.split('/').filter(Boolean);
  const readable = (s: string) => {
    let text = s;
    try {
      text = decodeURIComponent(s);
    } catch {
      // A malformed escape: keep the raw segment.
    }
    text = text.replace(/[-_]+/g, ' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  return [{ segment: '', href: '/', label: home }, ...segments.map((segment, i) => ({ segment, href: '/' + segments.slice(0, i + 1).join('/'), label: readable(segment) }))];
}

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

/** A step's status from the current step (0-based). Past the last step, every step is complete. */
export function stepStatus(index: number, current: number): StepStatus {
  return index < current ? 'complete' : index === current ? 'current' : 'upcoming';
}

/** Options with no visible effect in the current config. */
export function inactiveTabsOptions(config: { placement?: string; onAdd?: unknown; onClose?: unknown }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.placement === 'start' || config.placement === 'end') out.fullWidth = 'a column of tabs already fills its side.';
  if (!config.onAdd) out.addLabel = 'only used with `onAdd`.';
  if (!config.onClose) out.closeLabel = 'only used with `onClose`.';
  return out;
}

export function inactiveBreadcrumbOptions(config: { maxItems?: number; items?: unknown; path?: string; variant?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.maxItems) {
    const why = 'only used with `maxItems`.';
    Object.assign(out, { itemsBeforeCollapse: why, itemsAfterCollapse: why, collapse: why, expandLabel: why });
  }
  if (config.items !== undefined) {
    const why = 'only used with `path`; `items` wins.';
    Object.assign(out, { path: why, pathLabels: why, homeLabel: why });
  } else if (config.path === undefined) {
    const why = 'only used with `path`.';
    Object.assign(out, { pathLabels: why, homeLabel: why });
  }
  if (config.variant !== 'pills') out.tone = 'only the `pills` variant colours the current crumb.';
  return out;
}

export function inactivePaginationOptions(config: { showControls?: boolean; compact?: boolean; count?: number; total?: number; hasNext?: boolean; pageSizes?: readonly number[] }): Record<string, string> {
  const out: Record<string, string> = {};
  const unknown = config.count === undefined && config.total === undefined;
  if (config.showControls === false) out.showEdges = 'the first and last buttons sit with the previous and next ones.';
  if (config.compact) {
    const why = 'a compact row shows "3 / 20", not page numbers.';
    out.siblings = why;
    out.boundaries = why;
    out.showControls = 'a compact row always has previous and next.';
  }
  if (unknown) {
    const why = 'the page count is unknown (`hasNext`): only previous and next show.';
    Object.assign(out, { showControls: why, siblings: why, boundaries: why, showEdges: why, compact: why });
  } else if (config.hasNext !== undefined) out.hasNext = 'only used when neither `count` nor `total` is known.';
  return out;
}

export function inactiveStepperOptions(config: { variant?: string; orientation?: string; onChange?: unknown; items?: ReadonlyArray<unknown> }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.variant === 'bar') {
    out.orientation = 'a bar is always a row.';
    out.labelPlacement = 'a bar always has its names under it.';
  } else if (config.orientation === 'vertical') out.labelPlacement = 'a vertical stepper always has its names beside the marks.';
  if (!config.onChange) out.linear = 'only used with `onChange`: without it no step is a button.';
  const panels = Array.isArray(config.items) && config.items.some((item) => typeof item === 'object' && item !== null && 'content' in item);
  if (!panels) {
    const why = 'only used when steps have `content`.';
    Object.assign(out, { showActions: why, doneContent: why });
  }
  return out;
}

/** A sidebar entry as the logic sees it: a string is an entry whose key and text are that string. */
export interface SidebarNode {
  id?: string;
  label: string;
  href?: string;
  items?: ReadonlyArray<SidebarNode | string>;
}

/** An entry's key: its id, else its href, else its text. `value` matches it. */
export const sidebarKey = (item: SidebarNode | string): string => (typeof item === 'string' ? item : (item.id ?? item.href ?? item.label));

/** Keys of the sections that hold `value`, outermost first; empty when it is at the top level or absent. */
export function sidebarTrail(items: ReadonlyArray<SidebarNode | string>, value: string | undefined): string[] {
  if (value === undefined) return [];
  for (const item of items) {
    if (typeof item === 'string' || !item.items) continue;
    if (item.items.some((child) => sidebarKey(child) === value)) return [sidebarKey(item)];
    const deeper = sidebarTrail(item.items, value);
    if (deeper.length) return [sidebarKey(item), ...deeper];
  }
  return [];
}

export function inactiveSidebarOptions(config: { collapsible?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.collapsible) out.labels = 'they name the collapse button, which shows with `collapsible`.';
  return out;
}

export function inactiveNavMenuOptions(config: { items?: ReadonlyArray<unknown> }): Record<string, string> {
  const out: Record<string, string> = {};
  const panels = Array.isArray(config.items) && config.items.some((item) => typeof item === 'object' && item !== null && ('items' in item || 'content' in item));
  if (!panels) {
    const why = 'no entry has a panel (`items` or `content`).';
    Object.assign(out, { openOn: why, open: why, defaultOpen: why });
  }
  return out;
}
