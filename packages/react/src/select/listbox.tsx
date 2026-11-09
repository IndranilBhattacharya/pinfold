import * as React from 'react';
import { edgeEnabled, matchRanges, nextEnabled, typeaheadIndex, type PropsBag } from '@pinfold/core';
import { useIsomorphicLayoutEffect } from '../hooks';
import { CHECK_ICON } from '../nav-icons';
import { ITEM } from '../slots';

/**
 * The listbox under a select or a combobox: rows from config (strings or objects, grouped by a
 * `group` key), the active row moved by keys with focus left on the trigger
 * (`aria-activedescendant`), and the popup's rows. Its own module: only these two import it.
 */

/** One row. A string is a row whose value and label are that string. */
export interface ListItem<V extends string = string> {
  value: V;
  /** Shown and matched. Default the value. */
  label?: React.ReactNode;
  /** The text to match and type ahead on, when `label` is not a string. */
  textValue?: string;
  /** A second line. */
  description?: React.ReactNode;
  /** Before the label. */
  icon?: React.ReactNode;
  /** Rows with the same group sit together under its name. */
  group?: string;
  /** Shown, never chosen. */
  disabled?: boolean;
}

/**
 * What a `render` override of a repeating list part gets as `item`: an option (with its live state) or
 * a chosen chip (with `remove`).
 */
export interface ListItemContext {
  value: string;
  label: React.ReactNode;
  /** The text matched and typed ahead on. */
  text: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  group?: string;
  disabled: boolean;
  /** Chosen. Always true for a chip. */
  selected: boolean;
  /** The keyboard is on it (options). */
  active: boolean;
  /** Position among the rows (options) or the chips. */
  index: number;
  /** Chips: unchoose this value. */
  remove?: (event?: React.SyntheticEvent) => void;
}

export interface Row {
  value: string;
  label: React.ReactNode;
  text: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  group?: string;
  disabled: boolean;
  /** After the label: a shortcut hint (a command). */
  end?: React.ReactNode;
}

export function toRows(items: ReadonlyArray<ListItem | string> | undefined): Row[] {
  const rows = (items ?? []).map((item): Row => {
    if (typeof item === 'string') return { value: item, label: item, text: item, disabled: false };
    const text = item.textValue ?? (typeof item.label === 'string' ? item.label : item.value);
    return { value: item.value, label: item.label ?? item.value, text, description: item.description, icon: item.icon, group: item.group, disabled: !!item.disabled };
  });
  // Rows of one group sit together, in the order the groups first appear.
  const order = [...new Set(rows.map((r) => r.group ?? ''))];
  return order.length > 1 ? order.flatMap((g) => rows.filter((r) => (r.group ?? '') === g)) : rows;
}

/** The text with the parts that match the query wrapped in <mark>. */
export function highlight(text: string, query: string, className: string | undefined): React.ReactNode {
  const ranges = matchRanges(text, query);
  if (!ranges.length) return text;
  const out: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([from, to], i) => {
    if (from > at) out.push(text.slice(at, from));
    out.push(
      <mark key={i} className={className}>
        {text.slice(from, to)}
      </mark>,
    );
    at = to;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}

interface ListNavOptions {
  rows: Row[];
  open: boolean;
  /** Where the active row starts when the list opens: the first selected one. */
  selected: readonly string[];
  listId: string;
}

/** The active row: keys move it past disabled rows; it follows the pointer; it stays in view. */
export function useListNav({ rows, open, selected, listId }: ListNavOptions) {
  const [active, setActive] = React.useState(-1);
  const typed = React.useRef({ text: '', at: 0 });
  const disabled = rows.map((r) => r.disabled);
  const id = (i: number) => `${listId}-option-${i}`;

  // Opening puts the active row on the selected one, else the first that can be chosen.
  const start = (edge?: 'first' | 'last') => {
    const at = rows.findIndex((r) => selected.includes(r.value) && !r.disabled);
    setActive(edge === 'last' ? edgeEnabled(disabled, true) : edge === 'first' || at < 0 ? edgeEnabled(disabled) : at);
  };
  // The list changed under the active row (filtering): keep it in range and on a row that can be chosen.
  React.useEffect(() => {
    if (!open) return;
    if (active >= rows.length || (active >= 0 && disabled[active])) setActive(edgeEnabled(disabled));
  });
  useIsomorphicLayoutEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(id(active))?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  /** Arrow, Home, End, PageUp/PageDown; true when the key was used. */
  const move = (key: string): boolean => {
    const step = (n: number, dir: 1 | -1) => {
      let at = active;
      for (let i = 0; i < n; i++) at = nextEnabled(disabled, at, dir, n === 1);
      setActive(at);
    };
    if (key === 'ArrowDown') step(1, 1);
    else if (key === 'ArrowUp') step(1, -1);
    else if (key === 'PageDown') step(10, 1);
    else if (key === 'PageUp') step(10, -1);
    else if (key === 'Home') setActive(edgeEnabled(disabled));
    else if (key === 'End') setActive(edgeEnabled(disabled, true));
    else return false;
    return true;
  };
  /** Type to jump to a row (a select; a combobox types into its input instead). */
  const typeahead = (char: string): boolean => {
    if (char.length !== 1 || char === ' ' && !typed.current.text) return false;
    const now = Date.now();
    const text = now - typed.current.at > 700 ? char : typed.current.text + char;
    typed.current = { text, at: now };
    const at = typeaheadIndex(rows.map((r) => (r.disabled ? '' : r.text)), text, active);
    if (at >= 0) setActive(at);
    return true;
  };
  return { active, setActive, start, move, typeahead, activeId: open && active >= 0 && rows[active] ? id(active) : undefined, optionId: id };
}

type Slot = (name: string, content: React.ReactNode, tag: string, own?: PropsBag) => React.ReactNode;

interface RenderOptions {
  rows: Row[];
  slot: Slot;
  listId: string;
  labelId: string;
  multiple: boolean;
  selected: readonly string[];
  active: number;
  setActive: (i: number) => void;
  optionId: (i: number) => string;
  onPick: (row: Row, event: React.MouseEvent) => void;
  /** A combobox marks what matched what was typed. */
  query?: string;
  unstyled?: boolean;
  /** Rows carry a check column (select, combobox); a command has none. @default true */
  checks?: boolean;
  /** Shown instead of rows: "No results", "Loading…". */
  status?: React.ReactNode;
  busy?: boolean;
}

/** The rows, in groups when they have them. Pointer down keeps focus on the trigger. */
export function renderRows(o: RenderOptions): React.ReactNode {
  const groups: Array<{ name?: string; rows: Array<[Row, number]> }> = [];
  o.rows.forEach((row, i) => {
    const last = groups[groups.length - 1];
    if (last && last.name === row.group) last.rows.push([row, i]);
    else groups.push({ name: row.group, rows: [[row, i]] });
  });
  const option = ([row, i]: [Row, number]) => {
    const isSelected = o.selected.includes(row.value);
    const label = o.query && typeof row.label === 'string' ? highlight(row.label, o.query, o.unstyled ? undefined : 'pinfold-select__match') : row.label;
    return (
      <React.Fragment key={row.value}>
        {o.slot(
          'option',
          <>
            {o.checks === false ? null : o.slot('check', isSelected ? CHECK_ICON : null, 'span', { 'aria-hidden': true })}
            {row.icon != null ? o.slot('icon', row.icon, 'span', { 'aria-hidden': true }) : null}
            <span className={o.unstyled ? undefined : 'pinfold-select__text'}>
              <span className={o.unstyled ? undefined : 'pinfold-select__label'}>{label}</span>
              {row.description != null ? o.slot('detail', row.description, 'span') : null}
            </span>
            {row.end != null ? o.slot('shortcut', row.end, 'kbd') : null}
          </>,
          'div',
          {
            [ITEM]: { value: row.value, label: row.label, text: row.text, description: row.description, icon: row.icon, group: row.group, disabled: row.disabled, selected: isSelected, active: i === o.active, index: i } satisfies ListItemContext,
            id: o.optionId(i),
            role: 'option',
            'aria-selected': isSelected,
            'aria-disabled': row.disabled || undefined,
            'data-active': i === o.active ? '' : undefined,
            'data-selected': isSelected ? '' : undefined,
            onPointerMove: () => {
              if (!row.disabled && i !== o.active) o.setActive(i);
            },
            onPointerDown: (event: React.PointerEvent) => event.preventDefault(),
            onClick: (event: React.MouseEvent) => {
              if (!row.disabled) o.onPick(row, event);
            },
          },
        )}
      </React.Fragment>
    );
  };
  const body =
    o.status != null
      ? o.slot('empty', o.status, 'div', { role: 'presentation' })
      : groups.map((g, n) =>
          g.name ? (
            <React.Fragment key={g.name + n}>
              {o.slot(
                'group',
                <>
                  {o.slot('groupLabel', g.name, 'div', { id: `${o.listId}-group-${n}`, role: 'presentation' })}
                  {g.rows.map(option)}
                </>,
                'div',
                { role: 'group', 'aria-labelledby': `${o.listId}-group-${n}` },
              )}
            </React.Fragment>
          ) : (
            <React.Fragment key={'rows' + n}>{g.rows.map(option)}</React.Fragment>
          ),
        );
  return body;
}
