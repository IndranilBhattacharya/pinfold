/** Carousel and resizable-panel rules, framework-free. */

/** The slide in view from a scroll offset: the one whose start is nearest, as scroll snapping picks it. */
export function slideFromScroll(offset: number, slideSize: number, gap: number, count: number): number {
  if (slideSize <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(Math.abs(offset) / (slideSize + gap))));
}

/** The next index with wrapping (`loop`) or held at the ends. */
export function stepIndex(index: number, by: number, count: number, loop: boolean): number {
  if (count <= 0) return 0;
  const next = index + by;
  if (loop) return ((next % count) + count) % count;
  return Math.min(count - 1, Math.max(0, next));
}

/**
 * Move a handle between panels `at` and `at + 1` by `delta` percent: the space moves between those
 * two, each held within its min and max. Sizes are percents that add up to 100.
 */
export function resizePanels(sizes: readonly number[], at: number, delta: number, mins: readonly number[], maxs: readonly number[]): number[] {
  const out = [...sizes];
  const a = at;
  const b = at + 1;
  if (b >= out.length) return out;
  const total = out[a] + out[b];
  let nextA = out[a] + delta;
  nextA = Math.max(mins[a] ?? 0, Math.min(maxs[a] ?? 100, nextA));
  let nextB = total - nextA;
  if (nextB < (mins[b] ?? 0)) nextB = mins[b] ?? 0;
  if (nextB > (maxs[b] ?? 100)) nextB = maxs[b] ?? 100;
  nextA = total - nextB;
  out[a] = Math.round(nextA * 100) / 100;
  out[b] = Math.round((total - out[a]) * 100) / 100;
  return out;
}

/** Sizes from defaults: given ones kept, the rest share what is left equally; then scaled to 100. */
export function initialSizes(defaults: ReadonlyArray<number | undefined>): number[] {
  const given = defaults.reduce<number>((sum, d) => sum + (d ?? 0), 0);
  const open = defaults.filter((d) => d === undefined).length;
  const share = open ? Math.max(0, 100 - given) / open : 0;
  const raw = defaults.map((d) => d ?? share);
  const total = raw.reduce((s, d) => s + d, 0) || 1;
  return raw.map((d) => Math.round((d / total) * 10000) / 100);
}

/** Options with no visible effect in the current config. */
export function inactiveCarouselOptions(config: { slidesPerView?: number; slides?: readonly unknown[] }): Record<string, string> {
  // Everything fits: nothing to move to.
  if (config.slides && config.slides.length <= (config.slidesPerView ?? 1)) return { controls: 'every slide is already in view.', loop: 'every slide is already in view.' };
  return {};
}

export function inactiveResizableOptions(_config: object): Record<string, string> {
  return {};
}

/**
 * App shell options with no visible effect in the current config. `drawer` is what the shell
 * measured when `sidebarBehavior` is `auto` (whether it is narrower than `breakpoint`); leave it
 * out when that is not known, and only what the config alone rules out is listed.
 */
export function inactiveAppShellOptions(
  config: {
    sidebar?: unknown;
    navbar?: unknown;
    sidebarBehavior?: string;
    scroll?: string;
    sidebarCollapsible?: boolean;
    sidebarCollapsed?: boolean;
    defaultSidebarCollapsed?: boolean;
    onSidebarCollapsedChange?: unknown;
    autoSaveId?: string;
  },
  drawer?: boolean,
): Record<string, string> {
  const out: Record<string, string> = {};
  const hasSidebar = config.sidebar != null && config.sidebar !== false;
  const behavior = config.sidebarBehavior ?? 'auto';
  const collapsible = Boolean(config.sidebarCollapsible);
  const why = !hasSidebar
    ? 'there is no `sidebar`.'
    : behavior === 'inline'
      ? 'with `sidebarBehavior: "inline"` the sidebar always sits beside the page: there is no drawer.'
      : behavior === 'auto' && drawer === false
        ? 'the shell is wider than `breakpoint`, so the sidebar sits beside the page; this applies once it is a drawer.'
        : '';
  if (why) {
    if (!collapsible || !hasSidebar) {
      out.sidebarTrigger = why;
    }
    out.backdrop = why;
    out.closeOnNavigate = why;
  }
  if (!hasSidebar) {
    out.sidebarBehavior = why;
    out.breakpoint = why;
    out.sidebarCollapsible = why;
    out.sidebarCollapsed = why;
    out.defaultSidebarCollapsed = why;
    out.onSidebarCollapsedChange = why;
    out.autoSaveId = why;
  } else {
    if (behavior !== 'auto') out.breakpoint = 'only `sidebarBehavior: "auto"` measures the shell against it.';
    if (behavior === 'drawer') {
      const always = 'with `sidebarBehavior: "drawer"` the sidebar is always a drawer: collapsing applies to an inline sidebar.';
      Object.assign(out, { sidebarCollapsible: always, sidebarCollapsed: always, defaultSidebarCollapsed: always, onSidebarCollapsedChange: always, autoSaveId: always });
    } else if (!collapsible) {
      out.sidebarCollapsed = 'only used with `sidebarCollapsible`.';
      out.defaultSidebarCollapsed = 'only used with `sidebarCollapsible`.';
      out.onSidebarCollapsedChange = 'only used with `sidebarCollapsible`.';
      out.autoSaveId = 'only used with `sidebarCollapsible`.';
    }
  }
  if (config.navbar == null) {
    out.navbarPosition = 'there is no `navbar`.';
    if (!out.sidebarTrigger) out.sidebarTrigger = 'there is no `navbar` to hold the button: place `Shell.SidebarTrigger` yourself.';
    if (!hasSidebar) out.layout = 'there is no `navbar` and no `sidebar` to arrange.';
  } else if ((config.scroll ?? 'page') === 'content') out.navbarPosition = 'with `scroll: "content"` only the page region scrolls: the bar never leaves the top.';
  return out;
}
