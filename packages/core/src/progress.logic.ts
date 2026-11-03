/** Progress and meter rules, framework-free. */

export interface ProgressAppearanceInput {
  value?: number;
  kind?: string;
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

/** Options with no visible effect in the current config. */
export function inactiveProgressOptions(config: ProgressAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.kind !== 'meter' && typeof config.value !== 'number') {
    out.showValue = 'an indeterminate progress has no value to show.';
    out.formatValue = 'an indeterminate progress has no value to show.';
  }
  return out;
}
