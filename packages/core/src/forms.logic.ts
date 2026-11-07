/** Form control rules, framework-free. */

/** Ids a field's description and error add to `aria-describedby`, or undefined with none. */
export function fieldDescribedBy(ids: ReadonlyArray<string | false | null | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

/** Options with no visible effect in the current config. */
export function inactiveInputOptions(config: { multiline?: boolean; autosize?: boolean; resize?: string; clearable?: boolean; readOnly?: boolean; disabled?: boolean; hideLabel?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.multiline) {
    out.type = 'a multiline field is always text.';
    if (config.autosize) {
      out.resize = 'a field that grows with its content has no handle.';
      out.resizeIcon = out.resize;
    } else if (config.resize === 'none') out.resizeIcon = 'only used with `resize: "vertical"`.';
  } else {
    const why = 'only used with `multiline`.';
    out.autosize = why;
    out.rows = why;
    out.resize = why;
    out.resizeIcon = why;
  }
  if (!config.clearable) {
    out.clearLabel = 'only used with `clearable`.';
    out.clearIcon = out.clearLabel;
  } else if (config.readOnly || config.disabled) out.clearable = 'a read-only or disabled field cannot be cleared.';
  if (config.hideLabel) out.labelPlacement = 'the label is hidden.';
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
