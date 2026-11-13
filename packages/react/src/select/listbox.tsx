import * as React from 'react';
import { edgeEnabled, gridWindow, matchRanges, nextEnabled, RowSizes, typeaheadIndex, type PinfoldTone, type PropsBag } from '@pinfold/core';
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
  /** Before the label, in a circle: an image URL or your own node (an Avatar). */
  avatar?: React.ReactNode;
  /** At the end of the row: a role, a count, a badge. */
  endContent?: React.ReactNode;
  /** The chip's colour once chosen (the field's tone otherwise). */
  tone?: PinfoldTone;
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
  avatar?: React.ReactNode;
  endContent?: React.ReactNode;
  tone?: PinfoldTone;
  group?: string;
  disabled: boolean;
  /** The row as you wrote it (a string, or your object with any extra fields). */
  data: ListItem | string;
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
  avatar?: React.ReactNode;
  endContent?: React.ReactNode;
  tone?: PinfoldTone;
  group?: string;
  disabled: boolean;
  /** After the label: a shortcut hint (a command). */
  end?: React.ReactNode;
  /** The row as it was written. */
  data: ListItem | string;
}

export function toRow(item: ListItem | string): Row {
  if (typeof item === 'string') return { value: item, label: item, text: item, disabled: false, data: item };
  const text = item.textValue ?? (typeof item.label === 'string' ? item.label : item.value);
  return { value: item.value, label: item.label ?? item.value, text, description: item.description, icon: item.icon, avatar: item.avatar, endContent: item.endContent, tone: item.tone, group: item.group, disabled: !!item.disabled, data: item };
}

/** A row and its live state, as `render` overrides and custom list bodies get it. */
export function rowContext(row: Row, index: number, selected: boolean, active: boolean, remove?: ListItemContext['remove']): ListItemContext {
  return { value: row.value, label: row.label, text: row.text, description: row.description, icon: row.icon, avatar: row.avatar, endContent: row.endContent, tone: row.tone, group: row.group, disabled: row.disabled, data: row.data, selected, active, index, ...(remove ? { remove } : {}) };
}

export function toRows(items: ReadonlyArray<ListItem | string> | undefined): Row[] {
  const rows = (items ?? []).map(toRow);
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

/** Lists longer than this draw only the rows in view (lists without groups). */
const WINDOW_FROM = 120;

/** The rows a long list draws: the ones in view in the popup and a margin. Null for short lists. */
export interface ListWindow {
  start: number;
  end: number;
  before: number;
  after: number;
}

/**
 * Windowing for a long list: follows the popup's scroll, measures a row once, and scrolls the active
 * row into view itself (an undrawn row cannot scroll itself in).
 */
export function useListWindow(rows: Row[], open: boolean, active: number, list: React.RefObject<HTMLElement | null>): ListWindow | null {
  const on = open && rows.length > WINDOW_FROM && !rows.some((r) => r.group);
  const [view, setView] = React.useState({ top: 0, height: 320 });
  const rowH = React.useRef(36);
  React.useEffect(() => {
    const el = list.current;
    if (!on || !el) return;
    const first = el.querySelector<HTMLElement>('[role="option"]');
    if (first && first.offsetHeight) rowH.current = first.offsetHeight;
    const read = () => setView({ top: el.scrollTop, height: el.clientHeight || 320 });
    read();
    el.addEventListener('scroll', read, { passive: true });
    return () => el.removeEventListener('scroll', read);
  }, [on, list]);
  useIsomorphicLayoutEffect(() => {
    const el = list.current;
    if (!on || !el || active < 0) return;
    const h = rowH.current;
    const y = active * h;
    if (y < el.scrollTop) el.scrollTop = y;
    else if (y + h > el.scrollTop + el.clientHeight) el.scrollTop = y + h - el.clientHeight;
  }, [on, active]);
  if (!on) return null;
  const w = gridWindow(new RowSizes(rows.length, rowH.current), view.top, view.height, 10);
  return { start: w.start, end: w.end, before: w.before, after: w.after };
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
  /** A long list: only these rows are drawn. */
  window?: ListWindow | null;
  /** Shown instead of rows: "No results", "Loading…". */
  status?: React.ReactNode;
  busy?: boolean;
}

/** An avatar: a string is an image URL. */
export function avatarNode(avatar: React.ReactNode): React.ReactNode {
  return typeof avatar === 'string' && /^(https?:|data:|blob:|\/|\.)/.test(avatar) ? <img src={avatar} alt="" loading="lazy" decoding="async" /> : avatar;
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
            {row.avatar != null ? o.slot('avatar', avatarNode(row.avatar), 'span', { 'aria-hidden': true }) : null}
            {row.icon != null ? o.slot('icon', row.icon, 'span', { 'aria-hidden': true }) : null}
            <span className={o.unstyled ? undefined : 'pinfold-select__text'}>
              <span className={o.unstyled ? undefined : 'pinfold-select__label'}>{label}</span>
              {row.description != null ? o.slot('detail', row.description, 'span') : null}
            </span>
            {row.endContent != null ? o.slot('endContent', row.endContent, 'span') : null}
            {row.end != null ? o.slot('shortcut', row.end, 'kbd') : null}
          </>,
          'div',
          {
            [ITEM]: rowContext(row, i, isSelected, i === o.active),
            id: o.optionId(i),
            role: 'option',
            'aria-selected': isSelected,
            'aria-disabled': row.disabled || undefined,
            'data-active': i === o.active ? '' : undefined,
            // A windowed list tells assistive tech the full count and each row's place.
            'aria-setsize': o.window ? o.rows.length : undefined,
            'aria-posinset': o.window ? i + 1 : undefined,
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
  if (o.status == null && o.window) {
    const w = o.window;
    const spacer = (h: number, key: string) => (h > 0 ? <div key={key} aria-hidden="true" role="presentation" style={{ blockSize: h }} /> : null);
    return (
      <>
        {spacer(w.before, 'before')}
        {o.rows.slice(w.start, w.end).map((row, n) => option([row, w.start + n]))}
        {spacer(w.after, 'after')}
      </>
    );
  }
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

/* ------------------------------------------------------------ async rows */

/** One page of results: the rows, whether more follow, and what to pass to fetch the next page. */
export interface ListPage<T> {
  items: ReadonlyArray<T>;
  /** More rows follow: the list fetches the next page as it scrolls near its end. */
  hasMore?: boolean;
  /** Handed back to `loadItems` for the next page (an offset, a token). Default the row count so far. */
  cursor?: unknown;
}

/** What `loadItems` gets besides the query. */
export interface LoadItemsOptions {
  /** Aborted when the request is no longer needed (the query moved on, the list closed for good, unmount). */
  signal: AbortSignal;
  /** The next page's cursor, from the previous page (undefined for the first page). */
  cursor?: unknown;
  /** 0 for the first page. */
  page: number;
}

/** Rows for a query: the rows themselves, or a page `{ items, hasMore, cursor }`. */
export type LoadItems<T> = (query: string, options: LoadItemsOptions) => Promise<ReadonlyArray<T> | ListPage<T>> | ReadonlyArray<T> | ListPage<T>;

interface Loaded<T> {
  query: string;
  items: ReadonlyArray<T>;
  hasMore: boolean;
  cursor: unknown;
  page: number;
}

const asPage = <T,>(out: ReadonlyArray<T> | ListPage<T>): ListPage<T> => (Array.isArray(out) ? { items: out as ReadonlyArray<T> } : (out as ListPage<T>));

interface AsyncRowsOptions<T> {
  load: LoadItems<T> | undefined;
  query: string;
  /** Fetch now (the list is open, or something is typed). */
  active: boolean;
  /** Milliseconds after the last keystroke. */
  debounce: number;
}

/**
 * Rows from `loadItems`: debounced per query, a request that is no longer needed is aborted, pages
 * are cached per query (the oldest of 30 queries goes first), and `loadMore()` appends the next page.
 */
export function useAsyncRows<T>({ load, query, active, debounce }: AsyncRowsOptions<T>) {
  const [loaded, setLoaded] = React.useState<Loaded<T> | null>(null);
  const [fetching, setFetching] = React.useState(false);
  const [fetchingMore, setFetchingMore] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const cache = React.useRef(new Map<string, Loaded<T>>());
  const loader = React.useRef(load);
  loader.current = load;
  const more = React.useRef<AbortController | null>(null);
  const latest = React.useRef(loaded);
  latest.current = loaded;
  const on = !!load;

  const remember = (entry: Loaded<T>) => {
    cache.current.delete(entry.query);
    cache.current.set(entry.query, entry);
    if (cache.current.size > 30) cache.current.delete(cache.current.keys().next().value as string);
  };

  React.useEffect(() => {
    const run = loader.current;
    if (!run || !active) return;
    const hit = cache.current.get(query);
    if (hit) {
      setLoaded(hit);
      setFetching(false);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setFetching(true);
        setFailed(false);
        try {
          const page = asPage(await run(query, { signal: controller.signal, page: 0 }));
          if (controller.signal.aborted) return;
          const entry: Loaded<T> = { query, items: page.items, hasMore: !!page.hasMore, cursor: page.cursor ?? page.items.length, page: 0 };
          remember(entry);
          setLoaded(entry);
        } catch {
          if (!controller.signal.aborted) setFailed(true);
        } finally {
          if (!controller.signal.aborted) setFetching(false);
        }
      },
      query ? debounce : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
      // A page on its way for the old query is no longer needed either.
      more.current?.abort();
      more.current = null;
      setFetchingMore(false);
    };
  }, [query, active, on]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => () => more.current?.abort(), []);

  /** Fetch and append the next page, once at a time. */
  const loadMore = () => {
    const run = loader.current;
    const now = latest.current;
    if (!run || !now || !now.hasMore || more.current || now.query !== query) return;
    const controller = new AbortController();
    more.current = controller;
    setFetchingMore(true);
    setFailed(false);
    let out: ReturnType<LoadItems<T>>;
    try {
      out = run(now.query, { signal: controller.signal, cursor: now.cursor, page: now.page + 1 });
    } catch (error) {
      out = Promise.reject(error);
    }
    Promise.resolve(out)
      .then(
        (out) => {
          if (controller.signal.aborted) return;
          const page = asPage(out);
          const items = [...now.items, ...page.items];
          const entry: Loaded<T> = { query: now.query, items, hasMore: !!page.hasMore && page.items.length > 0, cursor: page.cursor ?? items.length, page: now.page + 1 };
          remember(entry);
          setLoaded(entry);
        },
        () => {
          if (!controller.signal.aborted) setFailed(true);
        },
      )
      .finally(() => {
        if (more.current === controller) {
          more.current = null;
          setFetchingMore(false);
        }
      });
  };

  return { items: loaded?.items, loading: fetching, loadingMore: fetchingMore, failed, hasMore: !!loaded?.hasMore && loaded.query === query, loadMore };
}

/**
 * Calls `onEnd` when the list is scrolled to within `margin` px of its end, and when the active
 * row reaches one of the last three (keyboard paging).
 */
export function useNearEnd(list: React.RefObject<HTMLElement | null>, on: boolean, active: number, count: number, onEnd: () => void, margin = 48) {
  const latest = React.useRef(onEnd);
  latest.current = onEnd;
  React.useEffect(() => {
    const el = list.current;
    if (!on || !el) return;
    const check = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= margin) latest.current();
    };
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [on, list, margin]);
  React.useEffect(() => {
    if (on && count > 0 && active >= count - 3) latest.current();
  }, [on, active, count]);
}
