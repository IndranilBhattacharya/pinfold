/** Separator rules, framework-free. */

export interface SeparatorAppearanceInput {
  label?: unknown;
  orientation?: string;
}

/** Options with no visible effect in the current config. */
export function inactiveSeparatorOptions(config: SeparatorAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.label == null || config.label === '') out.labelPosition = 'only used with a `label`.';
  if (config.orientation === 'vertical' && config.label != null && config.label !== '') out.label = 'a vertical separator has no room for a label.';
  else if (config.label != null && config.label !== '') out.decorative = 'a labelled separator is read as its text; its lines are always decorative.';
  return out;
}
