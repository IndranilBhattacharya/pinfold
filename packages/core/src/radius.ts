import type { PinfoldRadius, PropsBag } from './types';

/** A component's corner radius: a theme preset, or a length (`12` is px, strings pass through). */
export type RadiusOption = PinfoldRadius | number | (string & {});

const PRESETS: readonly string[] = ['none', 'sm', 'md', 'lg', 'full'];

/**
 * Root props for a component's `radius`. A preset becomes `data-pinfold-radius`, which rescales every
 * corner inside the component (its frame, rows, chips, popup) exactly like the provider preset does.
 * A length sets the frame's corner (`--pinfold-control-radius-unit`); inner parts keep the theme's
 * proportions. Unset: nothing, the component follows the theme.
 */
export function radiusProps(radius: RadiusOption | undefined): PropsBag {
  if (radius === undefined || radius === null || radius === '') return {};
  if (typeof radius === 'string' && PRESETS.includes(radius)) return { 'data-pinfold-radius': radius };
  const length = typeof radius === 'number' ? `${radius}px` : radius;
  return { 'data-pinfold-radius': '', style: { '--pinfold-control-radius-unit': length, '--pinfold-radius-scale': 1 } };
}
