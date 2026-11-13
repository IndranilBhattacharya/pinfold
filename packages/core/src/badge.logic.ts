/** Badge rules, framework-free. */

export interface BadgeAppearanceInput {
  label?: unknown;
  count?: unknown;
  dot?: boolean;
  icon?: unknown;
  endIcon?: unknown;
  avatar?: unknown;
  anchor?: unknown;
  variant?: string;
  dismissible?: boolean;
  onClick?: unknown;
  href?: string;
  pulse?: boolean;
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
  return !!config.dot && !present(config.label) && !present(config.icon) && !present(config.endIcon) && !present(config.avatar) && config.count == null && !config.dismissible;
}

/** Whether the badge is a control: it has a click handler or a link. */
export function badgeClickable(config: BadgeAppearanceInput): boolean {
  return typeof config.onClick === 'function' || (typeof config.href === 'string' && config.href !== '');
}

/** Options with no visible effect in the current config. */
export function inactiveBadgeOptions(config: BadgeAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.count == null) {
    out.max = 'only used with a `count`.';
    out.showZero = 'only used with a `count`.';
    out.formatCount = 'only used with a `count`.';
  } else if (config.count !== 0) out.showZero = 'only matters while the count is 0.';
  if (!present(config.anchor)) {
    out.placement = 'only used with an `anchor`: without one the badge sits in the text flow.';
    out.anchorShape = 'only used with an `anchor`.';
  }
  if (badgeDotOnly(config)) {
    out.radius = 'a dot on its own is always round.';
    out.variant = 'a dot on its own is one colour.';
  }
  if (!config.dismissible) {
    out.dismissLabel = 'only used with `dismissible`.';
    out.onDismiss = 'only used with `dismissible`.';
  }
  if (!config.href) {
    out.target = 'only used with `href`.';
    out.rel = 'only used with `href`.';
  }
  return out;
}

/** A physical corner of a box. */
export type BadgeCorner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

/** The physical corner a logical placement lands on: `top-end` is the top right, or the top left in RTL. */
export function badgeCorner(placement: string | undefined, rtl = false): BadgeCorner {
  const [block, inline] = (placement ?? 'top-end').split('-');
  const right = (inline === 'end') !== rtl;
  return `${block === 'bottom' ? 'bottom' : 'top'}-${right ? 'right' : 'left'}` as BadgeCorner;
}

/** One computed `border-*-radius` value ("12px", "50%", "10px 20px") as `[horizontal, vertical]` px. */
export function parseCornerRadius(value: string | undefined, width: number, height: number): [number, number] {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
  const read = (part: string | undefined, size: number) => {
    if (!part) return 0;
    const n = parseFloat(part);
    if (!Number.isFinite(n)) return 0;
    return part.endsWith('%') ? (n / 100) * size : n;
  };
  const x = read(parts[0], width);
  const y = parts.length > 1 ? read(parts[1], height) : parts[0]?.endsWith('%') ? read(parts[0], height) : x;
  return [Math.max(0, x), Math.max(0, y)];
}

/**
 * Where a pinned badge's centre goes, measured in from the anchor's bounding corner: the point where
 * the corner's curve crosses its diagonal, so the badge sits on the anchor's edge whatever its radius
 * (0 on a sharp corner, 14.6% on a circle). Radii are scaled down the way CSS does when adjacent
 * corners overlap (a pill's `9999px` becomes half its height).
 */
export function badgeArcOffset(radii: Record<BadgeCorner, string | undefined>, width: number, height: number, corner: BadgeCorner): { x: number; y: number } {
  const r = {
    'top-left': parseCornerRadius(radii['top-left'], width, height),
    'top-right': parseCornerRadius(radii['top-right'], width, height),
    'bottom-right': parseCornerRadius(radii['bottom-right'], width, height),
    'bottom-left': parseCornerRadius(radii['bottom-left'], width, height),
  };
  const ratio = (length: number, sum: number) => (sum > 0 ? length / sum : Infinity);
  const f = Math.min(
    1,
    ratio(width, r['top-left'][0] + r['top-right'][0]),
    ratio(width, r['bottom-left'][0] + r['bottom-right'][0]),
    ratio(height, r['top-left'][1] + r['bottom-left'][1]),
    ratio(height, r['top-right'][1] + r['bottom-right'][1]),
  );
  const k = 1 - Math.SQRT1_2;
  const [rx, ry] = r[corner];
  return { x: rx * f * k, y: ry * f * k };
}
