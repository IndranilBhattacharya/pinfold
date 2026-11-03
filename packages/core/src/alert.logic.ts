/** Alert rules, framework-free. */

export interface AlertAppearanceInput {
  dismissible?: boolean;
}

/** Options with no visible effect in the current config. */
export function inactiveAlertOptions(config: AlertAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.dismissible) {
    out.dismissLabel = 'only used with `dismissible`.';
    out.onDismiss = 'only used with `dismissible`.';
  }
  return out;
}

/** The ARIA role for a live setting: `polite` is a status, `assertive` an alert, `off` no role. */
export function alertRole(live: string | undefined): 'status' | 'alert' | undefined {
  return live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined;
}
