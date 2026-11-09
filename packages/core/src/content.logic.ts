/** Rating, timeline and empty-state rules, framework-free. */

/**
 * The rating under a pointer: `x` from the left edge of a row of `max` symbols `width` wide, in
 * whole or half steps, mirrored in right-to-left text. Never below one step.
 */
export function ratingFromPointer(x: number, width: number, max: number, half = false, rtl = false): number {
  if (width <= 0 || max <= 0) return 0;
  const along = Math.min(Math.max(rtl ? width - x : x, 0), width) / width;
  const step = half ? 0.5 : 1;
  return Math.min(max, Math.max(step, Math.ceil((along * max) / step) * step));
}

/** How full each symbol is (0, 0.5 or 1) for a value: three and a half of five is [1, 1, 1, 0.5, 0]. */
export function ratingFill(value: number, max: number): number[] {
  return Array.from({ length: max }, (_, i) => Math.min(1, Math.max(0, Math.round((value - i) * 2) / 2)));
}

/** Options with no visible effect in the current config. */
export function inactiveRatingOptions(config: { readOnly?: boolean }): Record<string, string> {
  if (!config.readOnly) return {};
  const why = 'a read-only rating cannot be changed.';
  return { clearable: why, onChange: why };
}

export function inactiveTimelineOptions(config: { orientation?: string; variant?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.orientation === 'horizontal') out.align = 'a horizontal timeline always has its text under the marks.';
  if ((config.variant ?? 'dot') !== 'card') out.radius = 'only the card variant has corners; dots and icons are round.';
  return out;
}

export function inactiveEmptyOptions(_config: object): Record<string, string> {
  return {};
}
