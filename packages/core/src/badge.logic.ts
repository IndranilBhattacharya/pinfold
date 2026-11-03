/** Badge rules, framework-free. */

export interface BadgeAppearanceInput {
  count?: unknown;
  dot?: boolean;
  placement?: string;
}

/**
 * The visible text of a count, or `null` when the badge hides: `120` with max 99 is "99+",
 * zero hides unless `showZero`, and anything that is not a finite number hides.
 */
export function badgeCount(count: number, max = 99, showZero = false): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  const n = Math.max(0, Math.floor(count));
  if (n === 0 && !showZero) return null;
  const cap = Math.max(1, Math.floor(max));
  return n > cap ? `${cap}+` : String(n);
}

/** Options with no visible effect in the current config. */
export function inactiveBadgeOptions(config: BadgeAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.count == null || config.dot) {
    const why = config.dot ? 'a dot shows no number.' : 'only used with a `count`.';
    out.max = why;
    out.showZero = why;
  }
  if (config.dot) {
    out.icon = 'a dot shows no icon.';
    out.radius = 'a dot is always round.';
  }
  return out;
}
