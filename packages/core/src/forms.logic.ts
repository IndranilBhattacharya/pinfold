/** Form control rules, framework-free. */

/** Ids a field's description and error add to `aria-describedby`, or undefined with none. */
export function fieldDescribedBy(ids: ReadonlyArray<string | false | null | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

/** Options with no visible effect in the current config. */
export function inactiveInputOptions(config: { multiline?: boolean; autosize?: boolean; clearable?: boolean; readOnly?: boolean; disabled?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.multiline) out.type = 'a multiline field is always text.';
  else {
    out.autosize = 'only used with `multiline`.';
    out.rows = 'only used with `multiline`.';
  }
  if (!config.clearable) out.clearLabel = 'only used with `clearable`.';
  else if (config.readOnly || config.disabled) out.clearable = 'a read-only or disabled field cannot be cleared.';
  return out;
}

export function inactiveCheckboxOptions(config: { items?: unknown }): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(config.items)) {
    const why = 'a group takes `value` and `defaultValue`; set it per row in `items`.';
    out.checked = why;
    out.defaultChecked = why;
    out.indeterminate = why;
    out.formValue = why;
  } else {
    const why = 'only used with `items` (a group).';
    out.orientation = why;
    out.variant = why;
    out.value = why;
    out.defaultValue = why;
  }
  return out;
}
