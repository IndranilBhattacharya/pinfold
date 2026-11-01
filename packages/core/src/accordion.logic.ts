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
 * rules refuse (unknown or disabled row, no change, or closing the last open
 * row of a non-collapsible accordion, in either mode).
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
  if (!open && !rules.collapsible && value.length === 1) return null;
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

/** `closeAll`: refused for a non-collapsible accordion. Disabled rows keep their state. */
export function closeAllAccordion(
  value: readonly string[],
  rows: readonly AccordionRowLike[],
  rules: AccordionRules,
): string[] | null {
  if (rules.disabled || !rules.collapsible) return null;
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
export type AccordionFieldMap<Row = any> = Partial<
  Record<
    'id' | 'title' | 'content' | 'description' | 'icon' | 'endIcon' | 'badge' | 'disabled' | 'defaultOpen',
    Extract<keyof Row, string>
  >
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

/* ------------------------------------------------------------- appearance */

/**
 * The appearance cascade, as rules every adapter and the docs share:
 * 1. The variant decides what is a surface: the container (solid, outline), each row
 *    (separated, filled) or nothing (ghost).
 * 2. `radius` shapes the container; `itemRadius` defaults to it.
 * 3. A zero gap joins the rows. Joined separated or filled rows become one group whose outer
 *    corners follow the container `radius`; `dividers` draws the lines inside it.
 */
export type AccordionVariantName = 'solid' | 'outline' | 'separated' | 'filled' | 'ghost';

export interface AccordionAppearanceInput {
  variant?: AccordionVariantName;
  /** Resolved gap: `dimensions.gap` if set, else `gap`. */
  gap?: unknown;
  radius?: unknown;
  itemRadius?: unknown;
  dividers?: boolean;
  indicator?: unknown;
  disabled?: boolean;
}

const ZERO = /^0*\.?0*(px|rem|em|%|vh|vw)?$/;

/** Whether the rows touch. The card and ghost variants default to no gap; separated and filled to a small one. */
export function accordionRowsJoined(variant: AccordionVariantName = 'solid', gap?: unknown): boolean {
  if (gap === undefined || gap === null || gap === '') return variant !== 'separated' && variant !== 'filled';
  if (gap === 'none' || gap === 0) return true;
  return typeof gap === 'string' && ZERO.test(gap.trim());
}

/**
 * Options that have no visible effect with the rest of the config, each with the reason and
 * what to do instead. Playgrounds disable them; the dev build warns when one is set explicitly.
 */
export function inactiveAccordionOptions(input: AccordionAppearanceInput): Record<string, string> {
  const variant = input.variant ?? 'solid';
  const joined = accordionRowsJoined(variant, input.gap);
  const card = variant === 'solid' || variant === 'outline';
  const rows = variant === 'separated' || variant === 'filled';
  const out: Record<string, string> = {};

  if (variant === 'ghost') {
    out.radius = 'Ghost has no surface to round. Pick solid or outline for a rounded container.';
    out.itemRadius = 'Ghost rows have no surface to round. Pick separated or filled for rounded rows.';
  }
  if (card) out.itemRadius = 'In a solid or outline card the rows are not surfaces; the card takes `radius`.';
  if (rows && joined) out.itemRadius = 'With no gap the rows join into one group, rounded by `radius`.';
  if (rows && !joined && input.itemRadius !== undefined) {
    out.radius = 'Separated and filled rows are the surfaces and `itemRadius` already rounds them. Unset `itemRadius` so `radius` reaches the rows, or set `gap: "none"` to join them.';
  }
  if (rows && !joined) out.dividers = 'The rows are already apart. Dividers appear when `gap` is "none".';
  if (input.indicator === 'none') {
    out.indicatorPosition = 'There is no indicator (`indicator: "none"`).';
    out.animateIndicator = 'There is no indicator (`indicator: "none"`).';
  }
  if (input.disabled) out.disabledIds = 'Every row is already disabled (`disabled: true`).';
  return out;
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
