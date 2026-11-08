/** Select and combobox rules, framework-free: matching, highlighting, moving past disabled rows. */

/** Lower case without accents, so "Zurich" finds "Zürich" and "cafe" finds "Café". */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();
}

export type ListFilter = 'contains' | 'startsWith' | 'none';

/** Whether a row's text matches what was typed. An empty query matches everything. */
export function matchesQuery(text: string, query: string, mode: ListFilter = 'contains'): boolean {
  const q = foldText(query.trim());
  if (!q || mode === 'none') return true;
  const t = foldText(text);
  return mode === 'startsWith' ? t.startsWith(q) || t.split(/\s+/).some((word) => word.startsWith(q)) : t.includes(q);
}

/**
 * The parts of `text` to mark as matching `query`: `[start, end)` pairs, found on folded text but
 * returned for the original (folding keeps one character per character for the scripts it changes).
 */
export function matchRanges(text: string, query: string): Array<[number, number]> {
  const q = foldText(query.trim());
  if (!q) return [];
  const t = foldText(text);
  if (t.length !== text.length) return [];
  const out: Array<[number, number]> = [];
  for (let at = t.indexOf(q); at !== -1; at = t.indexOf(q, at + q.length)) out.push([at, at + q.length]);
  return out;
}

/**
 * The next row that can be active from `from`, moving `step` rows (1, -1), skipping disabled ones.
 * `from` of -1 starts before the first. Returns `from` when there is none.
 */
export function nextEnabled(disabled: readonly boolean[], from: number, step: 1 | -1, loop = true): number {
  const n = disabled.length;
  for (let i = 1; i <= n; i++) {
    let at = from + step * i;
    if (at < 0 || at >= n) {
      if (!loop) return from;
      at = ((at % n) + n) % n;
    }
    if (!disabled[at]) return at;
  }
  return from;
}

/** The first (or last) row that can be active, or -1. */
export function edgeEnabled(disabled: readonly boolean[], last = false): number {
  const order = disabled.map((_, i) => i);
  if (last) order.reverse();
  return order.find((i) => !disabled[i]) ?? -1;
}

/** Toggle a value in a multiple selection; `single` replaces it (a second press keeps it, as a select does). */
export function toggleValue(values: readonly string[], value: string, multiple: boolean): string[] {
  if (!multiple) return [value];
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** Options with no visible effect in the current config. */
export function inactiveSelectOptions(config: { multiple?: boolean; clearable?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.multiple) {
    out.display = 'only used with `multiple`.';
    out.maxChips = out.display;
  }
  return out;
}

export function inactiveComboboxOptions(config: { multiple?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.multiple) out.maxChips = 'only used with `multiple`.';
  return out;
}

export function inactiveTagsOptions(config: { selection?: string; onRemove?: unknown; maxVisible?: number }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.selection || config.selection === 'none') {
    const why = 'only used with `selection`: tags are labels to read.';
    Object.assign(out, { value: why, defaultValue: why, onChange: why, removeHint: why });
  }
  if (!config.onRemove) {
    const why = 'only used with `onRemove`.';
    out.removeLabel = why;
    out.removeHint = why;
  }
  if (config.maxVisible === undefined) out.moreLabel = 'only used with `maxVisible`.';
  return out;
}

/**
 * Whether a key event is a hotkey such as `mod+k` or `shift+/`: `mod` is ⌘ on Apple systems and
 * Ctrl elsewhere; the other modifiers must match exactly, so ⌘⇧K is not ⌘K.
 */
export function matchHotkey(event: { key: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }, hotkey: string, apple: boolean): boolean {
  const parts = hotkey.toLowerCase().split('+').map((p) => p.trim());
  const key = parts.pop();
  const want = { meta: parts.includes('meta') || (apple && parts.includes('mod')), ctrl: parts.includes('ctrl') || (!apple && parts.includes('mod')), shift: parts.includes('shift'), alt: parts.includes('alt') };
  return event.key.toLowerCase() === key && event.metaKey === want.meta && event.ctrlKey === want.ctrl && event.shiftKey === want.shift && event.altKey === want.alt;
}

export function inactiveCommandOptions(config: { mode?: string }): Record<string, string> {
  if (config.mode === 'dialog') return {};
  const why = 'only used with `mode: "dialog"`.';
  return { open: why, defaultOpen: why, onOpenChange: why, hotkey: why, closeOnSelect: why };
}
