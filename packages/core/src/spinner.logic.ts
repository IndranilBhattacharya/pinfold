/** Spinner rules, framework-free. */

export interface SpinnerAppearanceInput {
  variant?: string;
}

/** Variants drawn with a stroke: `thickness` changes them. */
export const SPINNER_STROKED: readonly string[] = ['ring', 'arc', 'dual', 'track', 'orbit'];

/** Moving parts per variant (the rest are drawn by the root alone). */
export const SPINNER_PARTS: Readonly<Record<string, number>> = { ring: 0, arc: 0, dual: 1, track: 1, dots: 3, bars: 4, pulse: 2, orbit: 1 };

/** Options with no visible effect in the current config. */
export function inactiveSpinnerOptions(config: SpinnerAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  const variant = config.variant ?? 'ring';
  if (SPINNER_STROKED.indexOf(variant) === -1) out.thickness = `\`${variant}\` has no stroke.`;
  return out;
}
