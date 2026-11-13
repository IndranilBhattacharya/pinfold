/** Progress and meter rules, framework-free. */

export interface ProgressAppearanceInput {
  value?: number;
  kind?: string;
  shape?: string;
  variant?: string;
  buffer?: number;
  valuePosition?: string;
  showValue?: boolean;
}

/** One step of `tones`: from `at` (in value units) upwards, the progress takes `tone`. */
export interface ProgressToneStep<Tone extends string = string> {
  at: number;
  tone: Tone;
}

/** Where `value` sits between `min` and `max`, as 0–100 (clamped). `null` when there is no value. */
export function progressPercent(value: number | undefined, min = 0, max = 100): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const span = max - min;
  if (!(span > 0)) return 0;
  return Math.min(100, Math.max(0, ((value - min) / span) * 100));
}

/**
 * The default value text: a whole percentage ("42%"). Deliberately not locale-formatted, so the
 * server and the browser render the same text (pass `formatValue` for a localised one).
 */
export function progressValueText(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * The tone for a value from threshold steps: the step with the highest `at` that the value has
 * reached, whatever the order they are written in. `undefined` below every step (or without a value).
 */
export function progressToneAt<Tone extends string>(value: number | undefined, steps: ReadonlyArray<ProgressToneStep<Tone>> | undefined): Tone | undefined {
  if (!steps || typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  let best: ProgressToneStep<Tone> | undefined;
  for (const step of steps) if (value >= step.at && (!best || step.at >= best.at)) best = step;
  return best?.tone;
}

/** The segment count, clamped to a drawable 2–48 (whole numbers). */
export function progressSegmentCount(segments: number | undefined): number {
  const n = Math.floor(typeof segments === 'number' && Number.isFinite(segments) ? segments : 5);
  return Math.min(48, Math.max(2, n));
}

/**
 * How full each of `count` equal segments is, as 0–100, for an overall `percent`: full segments,
 * one partly filled, then empty ones.
 */
export function progressSegmentFills(percent: number, count: number): number[] {
  const n = progressSegmentCount(count);
  return Array.from({ length: n }, (_, i) => Math.round(Math.min(1, Math.max(0, (percent * n) / 100 - i)) * 10000) / 100);
}

/**
 * Where the value text goes. `auto`: above a bar, inside a ring or gauge. A segmented bar has no
 * single fill to write in, so `inside` moves to its end.
 */
export function progressValuePosition(position: string | undefined, shape: string | undefined, variant?: string): 'top' | 'bottom' | 'end' | 'inside' {
  const ring = shape === 'circle' || shape === 'semicircle';
  if (!position || position === 'auto') return ring ? 'inside' : 'top';
  if (position === 'inside' && !ring && variant === 'segmented') return 'end';
  return position as 'top' | 'bottom' | 'end' | 'inside';
}

/** Options with no visible effect in the current config. */
export function inactiveProgressOptions(config: ProgressAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  const indeterminate = config.kind !== 'meter' && typeof config.value !== 'number';
  if (indeterminate) {
    out.showValue = 'an indeterminate progress has no value to show.';
    out.formatValue = 'an indeterminate progress has no value to show.';
  }
  const ring = config.shape === 'circle' || config.shape === 'semicircle';
  if (ring) out.radius = 'a ring has no corners.';
  if (ring && config.variant === 'striped') out.variant = 'stripes are drawn on a bar only.';
  if (config.variant !== 'segmented') out.segments = 'only used with `variant: \'segmented\'`.';
  if (config.buffer !== undefined) {
    if (config.kind === 'meter') out.buffer = 'a meter measures one value.';
    else if (indeterminate) out.buffer = 'an indeterminate progress has no value to buffer ahead of.';
    else if (config.variant === 'segmented') out.buffer = 'segments show one value.';
  }
  if (config.kind === 'meter') out.onComplete = 'a meter is a measurement, never complete.';
  if (config.showValue === false || indeterminate) out.valuePosition = 'no value text is shown.';
  return out;
}
