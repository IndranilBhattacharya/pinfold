/**
 * Button rules, framework-free. The React hook only adapts them.
 */

/** The options that decide which other button options have a visible effect. */
export interface ButtonAppearanceInput {
  variant?: string;
  loading?: boolean;
  loadingText?: string;
  iconOnly?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  type?: string;
  radius?: unknown;
  endIcon?: unknown;
  endContent?: unknown;
  shape?: string;
}

/**
 * Options the rest of the config makes pointless, with the reason. Shared by the
 * dev warnings and the playground (which disables those controls).
 */
export function inactiveButtonOptions(config: ButtonAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.loading) out.loadingText = 'only shown while `loading` is true.';
  if (config.iconOnly) {
    out.endIcon = 'an icon-only button shows only `icon`.';
    out.endContent = out.endIcon;
  }
  if (config.href) out.type = 'a link has no type; `href` renders an `<a>`.';
  else {
    out.target = 'only links (`href`) have a target.';
    out.rel = 'only links (`href`) have a rel.';
    out.onNavigate = 'only links (`href`) navigate.';
  }
  if (config.variant === 'link') out.radius = 'the `link` variant has no surface to round.';
  else if (config.shape === 'pill' || config.shape === 'circle') out.radius = `\`shape: '${config.shape}'\` is fully round.`;
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
