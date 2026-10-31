import type { Length } from './types';

/**
 * Turn a `dimensions` config object into CSS custom properties on the root.
 *
 *   dimensionVars('accordion', { paddingX: 24, panelMaxHeight: '18rem' })
 *   // → { '--lumae-accordion-padding-x': '24px', '--lumae-accordion-panel-max-height': '18rem' }
 *
 * Numbers become px; strings pass through untouched, so `'50%'`, `'12rem'`,
 * `'clamp(...)'` and `var(...)` all work. Every component's CSS reads these
 * with a fallback, which is why one shared resolver covers all of them.
 */
export function dimensionVars<D extends object>(
  component: string,
  dimensions: D | undefined,
): Record<string, string> | undefined {
  if (!dimensions) return undefined;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(dimensions)) {
    const value = raw as Length | undefined;
    if (value === undefined || value === null || value === '') continue;
    out[`--lumae-${component}-${kebab(key)}`] = typeof value === 'number' ? `${value}px` : value;
  }
  return out;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
