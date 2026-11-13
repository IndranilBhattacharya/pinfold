/**
 * Tour rules: the hole a spotlight cuts around its target, and the clip path that draws it. Pure
 * geometry, so any adapter shares it.
 */

export interface TourRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The spotlight around a target: its box grown by `padding`, kept inside the viewport. */
export function spotlightRect(target: TourRect, padding: number, viewport: { width: number; height: number }): TourRect {
  const x = Math.max(0, target.x - padding);
  const y = Math.max(0, target.y - padding);
  const right = Math.min(viewport.width, target.x + target.width + padding);
  const bottom = Math.min(viewport.height, target.y + target.height + padding);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

/**
 * A `clip-path: path()` that covers the viewport except a rounded hole: one outer rectangle and the
 * hole drawn the other way, filled even-odd. Every path has the same commands, so CSS can animate
 * from one hole to the next. No hole: an empty one in the middle.
 */
export function spotlightPath(viewport: { width: number; height: number }, hole: TourRect | null, radius: number): string {
  const w = Math.round(viewport.width);
  const h = Math.round(viewport.height);
  const box = hole ?? { x: w / 2, y: h / 2, width: 0, height: 0 };
  const r = Math.max(0, Math.min(radius, box.width / 2, box.height / 2));
  const n = (v: number) => Math.round(v * 10) / 10;
  const x = n(box.x);
  const y = n(box.y);
  const x2 = n(box.x + box.width);
  const y2 = n(box.y + box.height);
  const rr = n(r);
  return (
    `path(evenodd, 'M0 0H${w}V${h}H0Z` +
    `M${n(x + r)} ${y}H${n(x2 - r)}A${rr} ${rr} 0 0 1 ${x2} ${n(y + r)}V${n(y2 - r)}A${rr} ${rr} 0 0 1 ${n(x2 - r)} ${y2}H${n(x + r)}A${rr} ${rr} 0 0 1 ${x} ${n(y2 - r)}V${n(y + r)}A${rr} ${rr} 0 0 1 ${n(x + r)} ${y}Z')`
  );
}

/** Options with no visible effect in the current config. */
export function inactiveTourOptions(config: { mask?: string; progress?: string; steps?: ReadonlyArray<unknown> }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.mask === 'none') out.interactive = 'nothing covers the page with `mask: "none"`: it is all usable.';
  if (Array.isArray(config.steps) && config.steps.length <= 1) out.progress = 'a tour of one step has no progress to show.';
  return out;
}
