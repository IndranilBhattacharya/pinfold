/** Avatar rules, framework-free. */

export interface AvatarAppearanceInput {
  items?: unknown;
  /** Every face shows a picture, so nothing shows the colour behind it. */
  src?: unknown;
  shape?: string;
  status?: unknown;
}

/** Up to two initials: the first letters of the first and last words ("Ada Lovelace" is "AL"). */
export function avatarInitials(name: string | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = (w: string) => Array.from(w)[0] ?? '';
  return (first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : '')).toLocaleUpperCase();
}

const AUTO_TONES = ['primary', 'info', 'success', 'warning', 'neutral'] as const;
/** A stable tone per name, so a person keeps one colour everywhere (never danger: a person is not an error). */
export function avatarTone(name: string | undefined): (typeof AUTO_TONES)[number] {
  let h = 5381;
  for (const ch of name ?? '') h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return AUTO_TONES[Math.abs(h) % AUTO_TONES.length];
}

/** How many avatars a group shows, and how many fold into "+N". */
export function avatarOverflow(count: number, max = 4): { shown: number; rest: number } {
  const cap = Math.max(1, Math.floor(max));
  // "+1" would take the same space as the avatar it hides: show it instead.
  if (count <= cap + 1) return { shown: count, rest: 0 };
  return { shown: cap, rest: count - cap };
}

/** Options with no visible effect in the current config. */
export function inactiveAvatarOptions(config: AvatarAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  const group = Array.isArray(config.items);
  if (config.shape !== 'square' && config.shape !== 'rounded') out.radius = 'a circle has no corners: set `shape: \'rounded\'` or `\'square\'`.';
  if (config.src) out.tone = 'the colour is behind the initials, and the picture covers it.';
  const why = group ? 'set it per person in `items`.' : '';
  if (group) for (const k of ['name', 'src', 'alt', 'initials', 'status', 'colorFrom', 'href', 'onClick']) out[k] = why;
  else {
    out.max = 'only used with `items` (a group).';
    out.label = 'only used with `items` (a group).';
    out.surplus = 'only used with `items` (a group).';
    out.expandOnHover = 'only used with `items` (a group).';
    if (!config.status) out.statusPlacement = 'only used with a `status`.';
  }
  return out;
}

/** A link or a click handler makes a face a control. */
export function avatarClickable(person: { href?: unknown; onClick?: unknown }): boolean {
  return typeof person.onClick === 'function' || (typeof person.href === 'string' && person.href !== '');
}
