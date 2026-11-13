/** Card rules, framework-free. */

export interface CardAppearanceInput {
  href?: string;
  image?: unknown;
  media?: unknown;
  title?: unknown;
  label?: string;
  orientation?: string;
  mediaPosition?: string;
  pressable?: boolean;
  onPress?: unknown;
  selectable?: boolean | string;
  actions?: readonly unknown[];
  hoverEffect?: string;
}

export type CardMediaPosition = 'top' | 'bottom' | 'start' | 'end' | 'cover';
export type CardInteraction = 'link' | 'button' | 'checkbox' | 'radio' | 'none';

const present = (v: unknown) => v != null && v !== false && v !== '';

/** Where the media goes: `mediaPosition`, else `start` for a horizontal card, else `top`. */
export function cardMediaPosition(config: CardAppearanceInput): CardMediaPosition {
  const p = config.mediaPosition;
  if (p === 'top' || p === 'bottom' || p === 'start' || p === 'end' || p === 'cover') return p;
  return config.orientation === 'horizontal' ? 'start' : 'top';
}

/**
 * What the whole card does. One control per card: selection wins over a link, a link over a press.
 * A link or a press needs a name: the title, or `label`.
 */
export function cardInteraction(config: CardAppearanceInput): CardInteraction {
  if (config.selectable) return config.selectable === 'radio' ? 'radio' : 'checkbox';
  const named = present(config.title) || !!config.label;
  if (config.href && named) return 'link';
  if ((config.pressable || typeof config.onPress === 'function') && named) return 'button';
  return 'none';
}

/** `auto` lifts an interactive card and leaves a static one alone. */
export function cardHoverEffect(config: CardAppearanceInput): string {
  const effect = config.hoverEffect ?? 'auto';
  if (effect !== 'auto') return effect;
  return cardInteraction(config) === 'none' ? 'none' : 'lift';
}

/** Options with no visible effect in the current config. */
export function inactiveCardOptions(config: CardAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  const interaction = cardInteraction(config);
  const hasMedia = !!config.image || present(config.media);
  if (!config.href) {
    out.target = 'only used with `href`.';
    out.rel = 'only used with `href`.';
  } else if (interaction === 'none') out.href = 'a linked card needs a `title` (or a `label`): the title is the link.';
  else if (interaction !== 'link') out.href = 'a selectable card is a checkbox or radio, not a link.';
  if ((config.pressable || config.onPress) && interaction !== 'button') out.pressable = out.onPress = interaction === 'none' ? 'a pressable card needs a `title` (or a `label`).' : 'the card is already a link or a selection.';
  if (!config.selectable) {
    for (const key of ['selected', 'defaultSelected', 'onSelectedChange', 'name', 'value']) out[key] = 'only used with `selectable`.';
  }
  if (!hasMedia) {
    out.orientation = 'only used with media (`image` or `media`).';
    out.mediaPosition = 'only used with media (`image` or `media`).';
    out.mediaRatio = 'only used with media (`image` or `media`).';
  }
  if (cardMediaPosition(config) !== 'cover' || !hasMedia) out.scrim = 'only used with `mediaPosition: "cover"`.';
  if (!config.actions || !config.actions.length) {
    out.actionsAlign = 'only used with `actions`.';
    out.onAction = 'only used with `actions`.';
  }
  if (config.hoverEffect === 'zoom' && !hasMedia) out.hoverEffect = '`zoom` scales the media, and there is none.';
  return out;
}
