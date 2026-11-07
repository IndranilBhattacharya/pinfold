/** Badge rules, framework-free. */

export interface BadgeAppearanceInput {
  label?: unknown;
  count?: unknown;
  dot?: boolean;
  icon?: unknown;
  anchor?: unknown;
}

const present = (v: unknown) => v != null && v !== false && v !== '';

/**
 * The visible text of a count, or `null` when it does not show: `120` with max 99 is "99+",
 * zero shows only with `showZero`, and anything that is not a finite number never shows.
 */
export function badgeCount(count: number, max = 99, showZero = false): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  const n = Math.max(0, Math.floor(count));
  if (n === 0 && !showZero) return null;
  const cap = Math.max(1, Math.floor(max));
  return n > cap ? `${cap}+` : String(n);
}

/** A dot with nothing beside it: the small round form. A dot beside a label is a status badge. */
export function badgeDotOnly(config: BadgeAppearanceInput): boolean {
  return !!config.dot && !present(config.label) && !present(config.icon) && config.count == null;
}

/** Options with no visible effect in the current config. */
export function inactiveBadgeOptions(config: BadgeAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.count == null) {
    out.max = 'only used with a `count`.';
    out.showZero = 'only used with a `count`.';
  }
  if (!present(config.anchor)) {
    out.placement = 'only used with an `anchor`: without one the badge sits in the text flow.';
    out.anchorShape = 'only used with an `anchor`.';
  }
  if (badgeDotOnly(config)) {
    out.radius = 'a dot on its own is always round.';
    out.variant = 'a dot on its own is one colour.';
  }
  return out;
}
