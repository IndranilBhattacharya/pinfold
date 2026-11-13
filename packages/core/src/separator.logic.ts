/** Separator rules, framework-free. */

export interface SeparatorAppearanceInput {
  label?: unknown;
  orientation?: string;
  dimensions?: { thickness?: unknown } | null;
}

/** Options with no visible effect in the current config. */
export function inactiveSeparatorOptions(config: SeparatorAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  const labelled = config.label != null && config.label !== false && config.label !== '';
  if (!labelled) out.labelPosition = 'only used with a `label`.';
  else out.decorative = 'a labelled separator is read as its text; its lines are always decorative.';
  if (config.dimensions && config.dimensions.thickness != null) out.thickness = '`dimensions.thickness` sets an exact weight.';
  return out;
}
