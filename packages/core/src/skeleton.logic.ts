/** Skeleton rules, framework-free. */

export interface SkeletonAppearanceInput {
  variant?: string;
  loading?: boolean;
  items?: unknown;
}

/** Options with no visible effect in the current config. */
export function inactiveSkeletonOptions(config: SkeletonAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(config.items)) {
    out.variant = 'a layout sets it per item.';
    out.lines = 'a layout sets it per item.';
  } else {
    out.direction = 'only used with `items`.';
    if (config.variant && config.variant !== 'text') out.lines = 'only text skeletons have lines.';
  }
  if (config.loading === false) {
    out.animation = 'the content is shown, not the placeholder.';
    out.lines = 'the content is shown, not the placeholder.';
  }
  return out;
}

/** Width of each placeholder line: full lines, a shorter last one, like real text. */
export function skeletonLineWidths(lines: number): string[] {
  const n = Math.max(1, Math.floor(lines));
  return Array.from({ length: n }, (_, i) => (n > 1 && i === n - 1 ? '62%' : '100%'));
}
