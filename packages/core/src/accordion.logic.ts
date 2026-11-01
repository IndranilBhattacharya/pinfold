import { nextIndexFromKey } from './navigation';
import type { PinfoldDir, PinfoldOrientation } from './types';

/**
 * Accordion rules as pure functions. No DOM, no framework: every adapter
 * (React today) calls these and only wires the results to its own state and
 * events, so behaviour can never drift between adapters.
 */

export type AccordionMode = 'single' | 'multiple';

/** Why the open set changed. Passed to `onBeforeChange` and `onValueChange`. */
export type AccordionChangeReason = 'click' | 'keyboard' | 'api' | 'find-in-page' | 'hash';

export interface AccordionChangeDetails<E = unknown> {
  /** The row that triggered the change. Absent for `openAll` / `closeAll`. */
  id?: string;
  open: boolean;
  reason: AccordionChangeReason;
  event?: E;
}

/** The minimum a row needs for the rules: its id and whether it is disabled. */
export interface AccordionRowLike {
  id: string;
  disabled?: boolean;
}

export interface AccordionRules {
  mode: AccordionMode;
  collapsible: boolean;
  /** Disables every row. */
  disabled?: boolean;
}

/** Row id: the configured `id`, else the index as a string. */
export function accordionRowId(item: { id?: string }, index: number): string {
  return item.id ?? String(index);
}

/** Trigger and panel ids for a row, derived from the instance's base id. */
export function accordionPartIds(baseId: string, rowId: string): { triggerId: string; panelId: string } {
  return { triggerId: `${baseId}-trigger-${rowId}`, panelId: `${baseId}-panel-${rowId}` };
}

/** Single mode keeps at most one open id. */
export function normalizeAccordionValue(value: readonly string[], mode: AccordionMode): string[] {
  return mode === 'single' ? value.slice(0, 1) : value.slice();
}

/** The first open set: `defaultValue` when given, else every row with `defaultOpen`. */
export function initialAccordionValue(
  items: ReadonlyArray<{ id?: string; defaultOpen?: boolean }>,
  defaultValue: readonly string[] | undefined,
  mode: AccordionMode,
): string[] {
  if (defaultValue) return normalizeAccordionValue(defaultValue, mode);
  const open: string[] = [];
  items.forEach((item, i) => {
    if (item.defaultOpen) open.push(accordionRowId(item, i));
  });
  return normalizeAccordionValue(open, mode);
}

/**
 * The open set after asking row `id` to become `open`, or `null` when the
 * rules refuse (unknown or disabled row, no change, or closing the only open
 * row of a non-collapsible single accordion).
 */
export function setAccordionItem(
  value: readonly string[],
  rows: readonly AccordionRowLike[],
  id: string,
  open: boolean,
  rules: AccordionRules,
): string[] | null {
  const row = rows.find((r) => r.id === id);
  if (!row || row.disabled || rules.disabled) return null;
  const isOpen = value.indexOf(id) !== -1;
  if (isOpen === open) return null;
  if (!open && rules.mode === 'single' && !rules.collapsible) return null;
  if (open) return rules.mode === 'single' ? [id] : value.concat(id);
  return value.filter((v) => v !== id);
}

/** `openAll`: every enabled row, multiple mode only. */
export function openAllAccordion(
  value: readonly string[],
  rows: readonly AccordionRowLike[],
  rules: AccordionRules,
): string[] | null {
  if (rules.mode === 'single' || rules.disabled) return null;
  const next = rows.filter((r) => !r.disabled || value.indexOf(r.id) !== -1).map((r) => r.id);
  return sameSet(value, next) ? null : next;
}

/** `closeAll`: refused for a non-collapsible single accordion. Disabled rows keep their state. */
export function closeAllAccordion(
  value: readonly string[],
  rows: readonly AccordionRowLike[],
  rules: AccordionRules,
): string[] | null {
  if (rules.disabled || (rules.mode === 'single' && !rules.collapsible)) return null;
  const locked = new Set(rows.filter((r) => r.disabled).map((r) => r.id));
  const next = value.filter((id) => locked.has(id));
  return sameSet(value, next) ? null : next;
}

export interface AccordionKeyOptions {
  orientation?: PinfoldOrientation;
  dir?: PinfoldDir;
  loop?: boolean;
}

/**
 * The header index to focus for a key, or `null` when the key is not ours.
 * Disabled headers stay focusable (APG), so they are not skipped.
 */
export function accordionFocusTarget(
  key: string,
  index: number,
  count: number,
  options: AccordionKeyOptions = {},
): number | null {
  return nextIndexFromKey(key, index, count, options);
}

/**
 * Field mapping: lets raw records (a CMS row, a DB result) feed the accordion
 * without a `.map()`. `{ id: 'slug', title: 'question', content: 'answer' }`.
 */
export type AccordionFieldMap = Partial<
  Record<'id' | 'title' | 'content' | 'description' | 'icon' | 'badge' | 'disabled' | 'defaultOpen', string>
>;

export function mapAccordionFields<T>(records: readonly any[], fields: AccordionFieldMap | undefined): T[] {
  if (!fields) return records as T[];
  return records.map((record) => {
    const out: Record<string, unknown> = { ...record };
    for (const key in fields) {
      const source = fields[key as keyof AccordionFieldMap];
      if (source && record != null && source in record) {
        const v = record[source];
        out[key] = key === 'id' && v != null ? String(v) : v;
      }
    }
    return out as T;
  });
}

/** When panel content is mounted. */
export type AccordionMountPanels = 'always' | 'open' | 'first-open';

/** Whether a panel's content should be in the DOM right now. */
export function shouldMountPanel(
  policy: AccordionMountPanels,
  open: boolean,
  everOpened: boolean,
): boolean {
  if (policy === 'always' || open) return true;
  return policy === 'first-open' && everOpened;
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v) => b.indexOf(v) !== -1);
}
