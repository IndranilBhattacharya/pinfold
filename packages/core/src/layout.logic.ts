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
