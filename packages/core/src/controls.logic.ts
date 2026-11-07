/** Toggle, toolbar, slider, number field and one-time code rules, framework-free. */

/** Where a value sits between min and max, 0 to 100. A collapsed range is 0. */
export function sliderPercent(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/**
 * The slider's values, sorted, inside the range and on a step. A range keeps its thumbs at least
 * `minGap` apart, measured in values.
 */
export function sliderValues(values: readonly number[], min: number, max: number, step: number, minGap = 0): number[] {
  const snap = (v: number) => {
    const n = Math.round((v - min) / step) * step + min;
    // Floating steps (0.1) drift: keep as many decimals as the step has.
    const decimals = (String(step).split('.')[1] ?? '').length;
    return Math.min(max, Math.max(min, Number(n.toFixed(decimals))));
  };
  const out = values.map(snap).sort((a, b) => a - b);
  if (out.length === 2 && out[1] - out[0] < minGap) out[1] = Math.min(max, out[0] + minGap);
  return out;
}

/** A number field's next value from a step, clamped. An empty field starts from min, or 0. */
export function stepValue(value: number | null, direction: 1 | -1, step: number, min?: number, max?: number): number {
  const base = value ?? (direction > 0 ? min ?? 0 : max ?? min ?? 0);
  const decimals = Math.max((String(step).split('.')[1] ?? '').length, (String(base).split('.')[1] ?? '').length);
  let next = value === null ? base : Number((base + direction * step).toFixed(decimals));
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

/** What a one-time code keeps of typed or pasted text: allowed characters only, up to its length. */
export function otpSanitize(text: string, type: 'numeric' | 'alphanumeric', length: number): string {
  const kept = type === 'numeric' ? text.replace(/\D/g, '') : text.replace(/[^0-9a-z]/gi, '').toUpperCase();
  return kept.slice(0, Math.max(0, length));
}

/** The slot index of each group start: groups [3, 3] put a separator before slot 3. */
export function otpBreaks(length: number, groups?: readonly number[]): Set<number> {
  const out = new Set<number>();
  if (!groups?.length) return out;
  let at = 0;
  for (const size of groups.slice(0, -1)) {
    at += size;
    if (at > 0 && at < length) out.add(at);
  }
  return out;
}

/** Options with no visible effect in the current config. */
export function inactiveToggleOptions(config: { items?: unknown; selection?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(config.items)) {
    const why = 'a group takes `value` and `defaultValue`; set each button in `items`.';
    out.pressed = why;
    out.defaultPressed = why;
    out.icon = 'set it per button in `items`.';
    out.iconOnly = out.icon;
    if (config.selection === 'multiple') out.allowEmpty = 'a multiple selection can always be empty.';
  } else {
    const why = 'only used with `items` (a group).';
    out.selection = why;
    out.value = why;
    out.defaultValue = why;
    out.allowEmpty = why;
    out.orientation = why;
    out.fullWidth = why;
    out.hideLabel = 'one toggle shows its label as its text (or keeps it as the name with `iconOnly`).';
  }
  return out;
}

export function inactiveSliderOptions(config: { value?: readonly number[]; defaultValue?: readonly number[]; showValue?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  const count = (config.value ?? config.defaultValue ?? [0]).length;
  if (count < 2) out.minGap = 'only used with two thumbs (a range).';
  if (config.showValue === 'never') out.formatValue = 'the value is never shown.';
  return out;
}

export function inactiveNumberOptions(config: { steppers?: string }): Record<string, string> {
  return config.steppers === 'none' ? { incrementLabel: 'there are no stepper buttons.', decrementLabel: 'there are no stepper buttons.' } : {};
}

export function inactiveOtpOptions(config: { groups?: readonly number[] }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.groups?.length) out.separator = 'only shown between `groups`.';
  return out;
}
