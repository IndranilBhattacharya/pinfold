/** Card rules, framework-free. */

export interface CardAppearanceInput {
  href?: string;
  image?: unknown;
  title?: unknown;
}

/** Options with no visible effect in the current config. */
export function inactiveCardOptions(config: CardAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.href) {
    out.target = 'only used with `href`.';
    out.rel = 'only used with `href`.';
  } else if (config.title == null || config.title === '') out.href = 'a linked card needs a `title`: the title is the link.';
  if (!config.image) out.orientation = 'only used with an `image`.';
  return out;
}
