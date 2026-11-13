/** Alert rules, framework-free. */

export interface AlertAppearanceInput {
  dismissible?: boolean;
  icon?: unknown;
  iconPlacement?: string;
  actions?: readonly unknown[];
}

/** Options with no visible effect in the current config. */
export function inactiveAlertOptions(config: AlertAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.dismissible) {
    out.dismissLabel = 'only used with `dismissible`.';
    out.onDismiss = 'only used with `dismissible` (or the controller\'s `dismiss()`).';
  }
  if (config.icon === false || config.icon === null) {
    for (const key of ['icons', 'iconPlacement', 'iconAlign', 'iconVariant']) out[key] = '`icon: false` removes the icon.';
  } else if (config.iconPlacement === 'top') out.iconAlign = 'only used when the icon sits at the start or the end.';
  if (!config.actions || !config.actions.length) out.actionsPlacement = 'only used with `actions`.';
  return out;
}

/** The ARIA role for a live setting: `polite` is a status, `assertive` an alert, `off` no role. */
export function alertRole(live: string | undefined): 'status' | 'alert' | undefined {
  return live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined;
}
