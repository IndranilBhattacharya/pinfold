/**
 * Button rules, framework-free. The React tag only adapts them.
 */

/** The options that decide which other button options have a visible effect. */
export interface ButtonAppearanceInput {
  variant?: string;
  loading?: boolean;
  loadingText?: string;
  href?: string;
  type?: string;
  radius?: unknown;
}

/**
 * Options the rest of the config makes pointless, with the reason. Shared by the
 * dev warnings and the playground (which disables those controls).
 */
export function inactiveButtonOptions(config: ButtonAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.loading) out.loadingText = 'only read while `loading` is true.';
  if (config.href) out.type = 'a link has no type; `href` renders an `<a>`.';
  if (config.variant === 'link') out.radius = 'the `link` variant has no surface to round.';
  return out;
}

/**
 * `rel` for a link button. A new tab opened with `target="_blank"` could reach
 * back through `window.opener` (reverse tabnabbing), so `noopener noreferrer`
 * is always added there, keeping whatever the caller already set.
 */
export function buttonRel(target: string | undefined, rel: string | undefined): string | undefined {
  if (target !== '_blank') return rel;
  const parts = new Set((rel ?? '').split(/\s+/).filter(Boolean));
  parts.add('noopener');
  parts.add('noreferrer');
  return [...parts].join(' ');
}
