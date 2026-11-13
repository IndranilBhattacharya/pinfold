import * as React from 'react';
import {
  cn,
  dataAttr,
  dimensionVars,
  flattenTree,
  inactiveTreeViewOptions,
  mergeProps,
  moveTreeNode,
  radiusProps,
  toggleTreeChecked,
  treeCheckStates,
  treeKeyboardMove,
  treeOrder,
  treePlace,
  typeaheadIndex,
  warnOnce,
  type PropsBag,
  type TreeCheckState,
} from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useControllableState, useEvent, useId, useIsomorphicLayoutEffect } from '../hooks';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import type { TreeViewApi, TreeViewComponent, TreeViewConfig, TreeViewItem, TreeViewItemContext, TreeViewItemInput, TreeViewRootProps, TreeViewSlot, TreeViewState } from './types';

/** A node with its id worked out and its children (written or loaded) in place. */
interface Node {
  id: string;
  data: TreeViewItem;
  text: string;
  parentId: string | null;
  /** Among its siblings. */
  index: number;
  /** Undefined: a leaf, or children still to load. */
  children?: Node[];
  /** Children come from `loadChildren` and are not here yet. */
  pending: boolean;
  disabled: boolean;
}
type Row = { kind: 'item'; key: string; ctx: TreeViewItemContext; size: number; pos: number } | { kind: 'status'; key: string; parentId: string; depth: number; status: 'loading' | 'error' };
type Load = { status: 'loading' } | { status: 'error'; error: unknown };

const STATUS = '\u0000status:';
const CHEVRON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="m6 4 4 4-4 4" />
  </svg>
);
const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);
const DASH = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" focusable="false" aria-hidden="true">
    <path d="M4 8h8" />
  </svg>
);
const GRIP = (
  <svg viewBox="0 0 16 16" fill="currentColor" focusable="false" aria-hidden="true">
    <circle cx="6" cy="4" r="1.1" /><circle cx="10" cy="4" r="1.1" /><circle cx="6" cy="8" r="1.1" /><circle cx="10" cy="8" r="1.1" /><circle cx="6" cy="12" r="1.1" /><circle cx="10" cy="12" r="1.1" />
  </svg>
);

const textOf = (data: TreeViewItem): string => data.textValue ?? (typeof data.label === 'string' || typeof data.label === 'number' ? String(data.label) : '');

/** Ids, parents and loaded children worked out once per change of the data. */
function normalise(list: ReadonlyArray<TreeViewItemInput>, loaded: ReadonlyMap<string, ReadonlyArray<TreeViewItemInput>>, parentId: string | null, depth: number, seen: Set<string>): Node[] {
  return list.map((input, i) => {
    const data: TreeViewItem = typeof input === 'string' ? { label: input } : input;
    const text = textOf(data);
    let id = data.id ?? (parentId === null ? '' : parentId + '/') + (text || String(i));
    if (seen.has(id)) id = `${id}#${i}`;
    seen.add(id);
    const own = data.children ?? loaded.get(id);
    return {
      id,
      data,
      text,
      parentId,
      index: i,
      children: own && depth < 32 ? normalise(own, loaded, id, depth + 1, seen) : undefined,
      pending: !own && !!data.hasChildren,
      disabled: !!data.disabled,
    };
  });
}

/** Back to items as written, ids made explicit and loaded children included: what a move hands back. */
const denormalise = (nodes: readonly Node[]): TreeViewItem[] => nodes.map((n) => ({ ...n.data, id: n.id, ...(n.children ? { children: denormalise(n.children) } : null) }));

function highlight(text: string, query: string, mark: (part: string, i: number) => React.ReactNode): React.ReactNode {
  if (!query) return text;
  const lower = text.toLocaleLowerCase();
  const q = query.toLocaleLowerCase();
  const out: React.ReactNode[] = [];
  let from = 0;
  for (let at = lower.indexOf(q); at !== -1 && q; at = lower.indexOf(q, from)) {
    if (at > from) out.push(text.slice(from, at));
    out.push(mark(text.slice(at, at + q.length), at));
    from = at + q.length;
  }
  if (!out.length) return text;
  if (from < text.length) out.push(text.slice(from));
  return out;
}

/**
 * Nested data as a hook that hands back a component: the WAI-ARIA tree, drawn flat (each row carries its
 * level), with selection or tri-state checkboxes, children loaded on demand, a search that keeps the path
 * to every match, and reordering by a drag handle or Alt + arrows.
 *
 *   const Files = useTreeView({ label: 'Files', items, searchable: true });
 *   return <Files />;   // Files.expandAll(), Files.value, <Files.Search />
 *
 * Precedence: this config, then `defaults.treeview`, then the provider (size, tone), then the library default.
 */
export function useTreeView(input: TreeViewConfig = {}): TreeViewComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.treeview ? mergeConfig<TreeViewConfig>(ctx.defaults.treeview, input) : input;
  const base = useId();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ treeviewMeta, validateConfig }) => {
      for (const problem of validateConfig(treeviewMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTreeViewOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `TreeView: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const labels = config.labels ?? {};
  const checkable = !!config.checkable;
  const mode = checkable ? 'multiple' : config.selectionMode ?? 'single';
  const disabled = !!config.disabled;
  const rtl = ctx.dir === 'rtl';

  // The data: the items as given, or as moved here since they last changed.
  const items = config.items ?? [];
  const [own, setOwn] = React.useState<{ from: ReadonlyArray<TreeViewItemInput>; items: ReadonlyArray<TreeViewItemInput> }>({ from: items, items });
  const source = own.from === items ? own.items : items;
  if (own.from !== items) setOwn({ from: items, items });
  const [loaded, setLoaded] = React.useState<ReadonlyMap<string, ReadonlyArray<TreeViewItemInput>>>(() => new Map());
  const [loads, setLoads] = React.useState<ReadonlyMap<string, Load>>(() => new Map());
  const nodes = React.useMemo(() => normalise(source, loaded, null, 0, new Set()), [source, loaded]);
  const tree = React.useMemo(() => flattenTree<Node>(nodes, (n) => n.children), [nodes]);
  const byId = React.useMemo(() => new Map(tree.rows.map((n, i) => [n.id, i])), [tree]);

  const [value, setValueState] = useControllableState<readonly string[]>({ value: config.value, defaultValue: config.defaultValue ?? [] });
  const [expanded, setExpandedState] = useControllableState<readonly string[]>({ value: config.expanded, defaultValue: config.defaultExpanded ?? [] });
  const [filter, setFilterState] = useControllableState<string>({ value: config.filter, defaultValue: '' });
  const query = filter.trim();
  // While searching every path to a match is open; what you close stays closed until the text changes.
  const [closedInSearch, setClosedInSearch] = React.useState<{ query: string; ids: ReadonlySet<string> }>({ query: '', ids: new Set() });
  const searchClosed = closedInSearch.query === query ? closedInSearch.ids : null;
  const [focusedKey, setFocusedKey] = React.useState<string | null>(null);
  const [drag, setDrag] = React.useState<{ id: string; over: { id: string; at: 'before' | 'after' | 'inside' } | null } | null>(null);
  const [announcement, setAnnouncement] = React.useState('');

  const expandedSet = React.useMemo(() => new Set(expanded), [expanded]);
  const valueSet = React.useMemo(() => new Set(value), [value]);
  const checks = React.useMemo(() => (checkable ? treeCheckStates(nodes, valueSet) : null), [checkable, nodes, valueSet]);

  const root = React.useRef<HTMLDivElement | null>(null);
  const rowEls = React.useRef(new Map<string, HTMLElement>());
  const focusNext = React.useRef<string | null>(null);
  const anchor = React.useRef<string | null>(null);
  const typed = React.useRef({ text: '', timer: undefined as ReturnType<typeof setTimeout> | undefined });
  const controllers = React.useRef(new Map<string, AbortController>());

  // Which rows show, in order.
  const matches = React.useCallback(
    (n: Node) => (config.filterFn ? config.filterFn(n.data, query) : n.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    [config.filterFn, query],
  );
  const order = React.useMemo(() => {
    const all = tree.rows.map((_, i) => i);
    if (!query) return treeOrder(tree, all, (p) => expandedSet.has(tree.rows[p].id));
    // Matches and their ancestors, all in data order (an ancestor kept for a match keeps its place).
    const stay = new Uint8Array(tree.rows.length);
    for (const p of all) if (matches(tree.rows[p])) for (let a = p; a !== -1 && !stay[a]; a = tree.parent[a]) stay[a] = 1;
    return treeOrder(tree, all.filter((p) => stay[p]), (p) => !searchClosed?.has(tree.rows[p].id));
  }, [tree, query, expandedSet, matches, searchClosed]);

  const shownParents = React.useMemo(() => new Set(order.map((p) => tree.parent[p])), [order, tree]);
  const isOpen = (n: Node) => (query ? !searchClosed?.has(n.id) && shownParents.has(byId.get(n.id)!) : expandedSet.has(n.id));

  const setValue = useEvent((next: readonly string[], item: TreeViewItemContext | null) => {
    const same = next.length === value.length && next.every((id, i) => id === value[i]);
    if (same) return;
    setValueState(next);
    config.onSelectionChange?.([...next], item);
  });
  const setExpanded = useEvent((id: string, open: boolean) => {
    if (query) {
      const ids = new Set(searchClosed ?? []);
      if (open) ids.delete(id);
      else ids.add(id);
      setClosedInSearch({ query, ids });
      return;
    }
    if (expandedSet.has(id) === open) return;
    const next = open ? [...expanded, id] : expanded.filter((x) => x !== id);
    setExpandedState(next);
    config.onExpandedChange?.([...next], { id, expanded: open });
  });

  const contextOf = (n: Node, position: number, focused: string | null): TreeViewItemContext => {
    const load = loads.get(n.id);
    const open = !!(n.children || n.pending) && isOpen(n);
    const checked: TreeCheckState = checks?.get(n.id) ?? false;
    return {
      id: n.id,
      data: n.data,
      label: n.data.label,
      text: n.text,
      depth: tree.depth[position],
      parentId: n.parentId,
      index: n.index,
      expanded: open,
      selected: checkable ? checked === true : valueSet.has(n.id),
      checked,
      focused: focused === n.id,
      disabled: disabled || n.disabled,
      loading: load?.status === 'loading',
      error: load?.status === 'error' ? load.error : undefined,
      hasChildren: !!n.children || n.pending,
      match: !!query && matches(n),
      toggle: () => setExpanded(n.id, !open),
      select: () => choose(n.id, 'replace'),
    };
  };

  // Rows: the visible nodes, with a loading or an error row under an open node that is loading.
  const rows: Row[] = [];
  {
    const counts = new Map<number, number>();
    for (const p of order) counts.set(tree.parent[p], (counts.get(tree.parent[p]) ?? 0) + 1);
    const seen = new Map<number, number>();
    for (const p of order) {
      const n = tree.rows[p];
      const pos = (seen.get(tree.parent[p]) ?? 0) + 1;
      seen.set(tree.parent[p], pos);
      const item = contextOf(n, p, null);
      rows.push({ kind: 'item', key: n.id, ctx: item, size: counts.get(tree.parent[p]) ?? 1, pos });
      const load = loads.get(n.id);
      if (item.expanded && load && !query) rows.push({ kind: 'status', key: STATUS + n.id, parentId: n.id, depth: item.depth + 1, status: load.status });
    }
  }
  const keys = rows.map((r) => r.key);
  const tabKey = focusedKey !== null && keys.includes(focusedKey) ? focusedKey : (rows.find((r) => r.kind === 'item' && r.ctx.selected)?.key ?? keys[0] ?? null);
  for (const r of rows) if (r.kind === 'item') r.ctx.focused = r.key === focusedKey;
  const visible = rows.flatMap((r) => (r.kind === 'item' ? [r.ctx] : []));
  const ctxOf = (id: string): TreeViewItemContext | null => {
    const found = visible.find((c) => c.id === id);
    if (found) return found;
    const p = byId.get(id);
    return p === undefined ? null : contextOf(tree.rows[p], p, focusedKey);
  };

  // A row that was focused and went away (its parent closed) hands the focus to its nearest visible parent.
  useIsomorphicLayoutEffect(() => {
    if (focusedKey === null || keys.includes(focusedKey) || focusedKey.startsWith(STATUS)) return;
    let at = byId.get(focusedKey);
    while (at !== undefined && at !== -1 && !keys.includes(tree.rows[at].id)) at = tree.parent[at];
    if (at === undefined || at === -1) return;
    const id = tree.rows[at].id;
    const hadFocus = root.current?.contains(document.activeElement) ?? false;
    setFocusedKey(id);
    if (hadFocus) focusNext.current = id;
  });
  useIsomorphicLayoutEffect(() => {
    const key = focusNext.current;
    if (key === null) return;
    const el = rowEls.current.get(key);
    if (!el) return;
    focusNext.current = null;
    el.focus({ preventScroll: false });
  });

  const focusKey = useEvent((key: string | null) => {
    if (key === null) return;
    setFocusedKey(key);
    if (key === focusedKey) rowEls.current.get(key)?.focus();
    else focusNext.current = key;
  });

  // Children on demand: whenever a node with children to load is open and nothing is known yet.
  const load = useEvent((id: string) => {
    const p = byId.get(id);
    if (p === undefined || !config.loadChildren) return;
    const node = tree.rows[p];
    controllers.current.get(id)?.abort();
    const controller = new AbortController();
    controllers.current.set(id, controller);
    setLoads((m) => new Map(m).set(id, { status: 'loading' }));
    let pending: Promise<ReadonlyArray<TreeViewItemInput>>;
    try {
      pending = Promise.resolve(config.loadChildren(node.data, { signal: controller.signal }));
    } catch (error) {
      pending = Promise.reject(error);
    }
    pending.then(
      (children) => {
        if (controller.signal.aborted) return;
        controllers.current.delete(id);
        setLoaded((m) => new Map(m).set(id, children ?? []));
        setLoads((m) => {
          const next = new Map(m);
          next.delete(id);
          return next;
        });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        controllers.current.delete(id);
        setLoads((m) => new Map(m).set(id, { status: 'error', error }));
        config.onLoadError?.(node.data, error);
      },
    );
  });
  React.useEffect(() => {
    if (!config.loadChildren) return;
    for (const id of expanded) {
      const p = byId.get(id);
      if (p !== undefined && tree.rows[p].pending && !loads.has(id)) load(id);
    }
  }, [expanded, tree, loads, !!config.loadChildren]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const live = controllers.current;
    const t = typed.current;
    return () => {
      for (const c of live.values()) c.abort();
      live.clear();
      clearTimeout(t.timer);
    };
  }, []);
  const reload = useEvent((id: string) => {
    setLoaded((m) => {
      if (!m.has(id)) return m;
      const next = new Map(m);
      next.delete(id);
      return next;
    });
    if (expandedSet.has(id) || query) load(id);
    else
      setLoads((m) => {
        const next = new Map(m);
        next.delete(id);
        return next;
      });
  });

  /** Select (`replace`), add or remove (`toggle`), or a range from the last pressed row (`range`). */
  const choose = useEvent((id: string, how: 'replace' | 'toggle' | 'range' | 'add') => {
    const item = ctxOf(id);
    if (!item || item.disabled || mode === 'none') return;
    if (checkable) {
      setValue(toggleTreeChecked(nodes, valueSet, id, how === 'add' ? true : undefined), item);
      return;
    }
    if (mode === 'single' || how === 'replace') {
      anchor.current = id;
      setValue([id], item);
      return;
    }
    if (how === 'range' && anchor.current !== null) {
      const ids = visible.map((c) => c.id);
      const a = ids.indexOf(anchor.current);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const span = ids.slice(Math.min(a, b), Math.max(a, b) + 1).filter((x) => !ctxOf(x)?.disabled);
        setValue([...new Set([...value, ...span])], item);
        return;
      }
    }
    anchor.current = id;
    if (how === 'add') setValue(valueSet.has(id) ? value : [...value, id], item);
    else setValue(valueSet.has(id) ? value.filter((x) => x !== id) : [...value, id], item);
  });

  const press = useEvent((item: TreeViewItemContext, event?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => {
    if (item.disabled) {
      if (item.hasChildren && !checkable && config.expandOnClick !== false) setExpanded(item.id, !item.expanded);
      return;
    }
    if (checkable) choose(item.id, 'toggle');
    else if (mode === 'multiple') choose(item.id, event?.shiftKey ? 'range' : event?.metaKey || event?.ctrlKey ? 'toggle' : 'replace');
    else choose(item.id, 'replace');
    if (item.hasChildren && !checkable && config.expandOnClick !== false && !event?.shiftKey && !event?.metaKey && !event?.ctrlKey) setExpanded(item.id, !item.expanded);
    config.onAction?.(item.id, item);
  });

  const moveNode = useEvent((id: string, parentId: string | null, index: number) => {
    const p = byId.get(id);
    if (p === undefined || tree.rows[p].disabled) return;
    const moved = moveTreeNode(nodes, id, parentId, index);
    const place = treePlace(moved, id);
    const before = treePlace(nodes, id);
    if (!place || (before && before.parentId === place.parentId && before.index === place.index)) return;
    const next = denormalise(moved);
    setOwn({ from: items, items: next });
    if (parentId !== null && !query) {
      if (!expandedSet.has(parentId)) setExpanded(parentId, true);
    }
    const siblings = parentId === null ? moved : (function find(list: readonly Node[]): readonly Node[] {
      for (const n of list) {
        if (n.id === parentId) return n.children ?? [];
        const hit = n.children ? find(n.children) : null;
        if (hit && hit.length) return hit;
      }
      return [];
    })(moved);
    const parentNode = parentId === null ? null : tree.rows[byId.get(parentId)!];
    const info = { label: tree.rows[p].text, index: place.index + 1, count: siblings.length, parent: parentNode ? parentNode.text : null };
    setAnnouncement(labels.moved ? labels.moved(info) : `Moved ${info.label} to position ${info.index} of ${info.count}${info.parent ? ` in ${info.parent}` : ''}`);
    focusNext.current = id;
    setFocusedKey(id);
    config.onMove?.({ id, parentId: place.parentId, index: place.index, items: next });
  });

  const onTreeKeyDown = (event: React.KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement) return;
    if (drag && event.key === 'Escape') {
      event.preventDefault();
      setDrag(null);
      return;
    }
    const at = tabKey === null ? -1 : keys.indexOf(tabKey);
    const row = rows[at];
    if (!row) return;
    const item = row.kind === 'item' ? row.ctx : null;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const stop = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    if (event.altKey && config.reorderable && item && !item.disabled && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      stop();
      if (query) return;
      const direction = event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down' : event.key === forward ? 'in' : 'out';
      const target = treeKeyboardMove(nodes, item.id, direction, (n) => Array.isArray(n.children));
      if (target) moveNode(item.id, target.parentId, target.index);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        stop();
        const next = rows[Math.max(0, Math.min(rows.length - 1, at + (event.key === 'ArrowDown' ? 1 : -1)))];
        focusKey(next.key);
        if (event.shiftKey && mode === 'multiple' && !checkable && next.kind === 'item') choose(next.ctx.id, 'add');
        return;
      }
      case 'Home':
      case 'End':
        stop();
        focusKey(event.key === 'Home' ? keys[0] : keys[keys.length - 1]);
        return;
      case forward:
        stop();
        if (!item || !item.hasChildren) return;
        if (!item.expanded) setExpanded(item.id, true);
        else {
          const child = rows[at + 1];
          if (child && (child.kind === 'status' ? child.parentId === item.id : child.ctx.parentId === item.id)) focusKey(child.key);
        }
        return;
      case back: {
        stop();
        if (item && item.hasChildren && item.expanded) {
          setExpanded(item.id, false);
          return;
        }
        const parent = row.kind === 'status' ? row.parentId : item?.parentId;
        if (parent != null && keys.includes(parent)) focusKey(parent);
        return;
      }
      case 'Enter':
        stop();
        if (row.kind === 'status') {
          if (row.status === 'error') reload(row.parentId);
          return;
        }
        if (item) press(item);
        return;
      case ' ':
        stop();
        if (item) choose(item.id, mode === 'single' ? 'replace' : 'toggle');
        return;
      case '*': {
        stop();
        if (!item) return;
        const ids = rows.flatMap((r) => (r.kind === 'item' && r.ctx.parentId === item.parentId && r.ctx.hasChildren && !r.ctx.expanded ? [r.ctx.id] : []));
        if (query) setClosedInSearch({ query, ids: new Set([...(searchClosed ?? [])].filter((x) => !ids.includes(x))) });
        else if (ids.length) {
          const next = [...expanded, ...ids];
          setExpandedState(next);
          config.onExpandedChange?.(next, { id: item.id, expanded: true });
        }
        return;
      }
      default:
        break;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && mode === 'multiple' && !checkable) {
      stop();
      setValue(visible.filter((c) => !c.disabled).map((c) => c.id), item);
      return;
    }
    // Typeahead.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && /\S/.test(event.key)) {
      stop();
      const t = typed.current;
      t.text += event.key;
      clearTimeout(t.timer);
      t.timer = setTimeout(() => (t.text = ''), 500);
      const texts = rows.map((r) => (r.kind === 'item' ? r.ctx.text : ''));
      const hit = typeaheadIndex(texts, t.text, at);
      if (hit !== -1) focusKey(rows[hit].key);
    }
  };

  // Dragging by the handle: the pointer is captured by the handle, so nothing listens on the page.
  const dropAt = (clientY: number, dragged: string): { id: string; at: 'before' | 'after' | 'inside' } | null => {
    for (const r of rows) {
      if (r.kind !== 'item') continue;
      const el = rowEls.current.get(r.key);
      if (!el) continue;
      const box = el.getBoundingClientRect();
      if (clientY < box.top || clientY >= box.bottom) continue;
      const p = byId.get(r.ctx.id)!;
      if (r.ctx.id === dragged || (tree.rows[p].id !== dragged && isUnder(r.ctx.id, dragged))) return null;
      const f = box.height ? (clientY - box.top) / box.height : 0.5;
      const holds = Array.isArray(tree.rows[p].children);
      if (holds) return { id: r.ctx.id, at: f < 0.25 ? 'before' : f > 0.75 && !r.ctx.expanded ? 'after' : 'inside' };
      return { id: r.ctx.id, at: f < 0.5 ? 'before' : 'after' };
    }
    return null;
  };
  const isUnder = (id: string, ancestor: string) => {
    for (let at = byId.get(id) ?? -1; at !== -1; at = tree.parent[at]) if (tree.rows[at].id === ancestor) return true;
    return false;
  };
  const drop = useEvent((dragged: string, over: { id: string; at: 'before' | 'after' | 'inside' }) => {
    const target = treePlace(nodes, over.id);
    const from = treePlace(nodes, dragged);
    if (!target || !from) return;
    if (over.at === 'inside') {
      moveNode(dragged, over.id, Number.MAX_SAFE_INTEGER);
      return;
    }
    let index = target.index + (over.at === 'after' ? 1 : 0);
    if (from.parentId === target.parentId && from.index < index) index -= 1;
    moveNode(dragged, target.parentId, index);
  });
  const getHandleProps = (item: TreeViewItemContext): PropsBag => ({
    'aria-hidden': true,
    title: labels.handle ?? 'Drag to move',
    'data-part': 'handle',
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (item.disabled || query || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // A synthetic pointer: dragging still works while the pointer stays over the handle.
      }
      rowEls.current.get(item.id)?.focus({ preventScroll: true });
      setFocusedKey(item.id);
      setDrag({ id: item.id, over: null });
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (!drag || drag.id !== item.id) return;
      const over = dropAt(event.clientY, item.id);
      if (over?.id !== drag.over?.id || over?.at !== drag.over?.at) setDrag({ id: item.id, over });
    },
    onPointerUp: (event: React.PointerEvent) => {
      if (!drag || drag.id !== item.id) return;
      const over = dropAt(event.clientY, item.id) ?? drag.over;
      setDrag(null);
      if (over) drop(item.id, over);
    },
    onPointerCancel: () => setDrag(null),
    onLostPointerCapture: () => setDrag((d) => (d && d.id === item.id ? null : d)),
  });

  const variant = config.variant ?? 'soft';
  const state: TreeViewState = { variant, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, selectionMode: mode, checkable, filter, dragging: drag?.id ?? null };
  const setFilter = useEvent((text: string) => {
    if (text === filter) return;
    setFilterState(text);
    config.onFilterChange?.(text);
  });

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: root,
        'data-variant': variant,
        'data-density': config.density ?? 'comfortable',
        'data-size': state.size,
        'data-tone': state.tone,
        'data-selection-mode': mode,
        'data-guides': dataAttr(config.guides !== false),
        'data-checkable': dataAttr(checkable),
        'data-reorderable': dataAttr(config.reorderable && !query),
        'data-filtering': dataAttr(!!query),
        'data-dragging': dataAttr(drag !== null),
        'data-disabled': dataAttr(disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        ...radiusProps(config.radius),
      },
      props,
    );
  const getTreeProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        id: `${base}-tree`,
        role: 'tree',
        'aria-label': config.label,
        'aria-multiselectable': mode === 'multiple' || undefined,
        'aria-disabled': disabled || undefined,
        onKeyDown: onTreeKeyDown,
      },
      props,
    );
  const getSearchProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        id: `${base}-search`,
        type: 'search',
        value: filter,
        placeholder: labels.search ?? 'Search',
        'aria-label': labels.search ?? 'Search',
        'aria-controls': `${base}-tree`,
        autoComplete: 'off',
        spellCheck: false,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => setFilter(event.target.value),
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'ArrowDown' && keys.length) {
            event.preventDefault();
            focusKey(keys[0]);
          } else if (event.key === 'Escape' && filter) {
            event.preventDefault();
            setFilter('');
          }
        },
      },
      props,
    );
  const getItemProps = (id: string, props?: PropsBag): PropsBag => {
    const r = rows.find((x) => x.key === id);
    if (!r || r.kind !== 'item') return mergeProps({}, props);
    const item = r.ctx;
    const over = drag?.over?.id === id ? drag.over.at : undefined;
    return mergeProps(
      {
        ref: (el: HTMLElement | null) => {
          if (el) rowEls.current.set(id, el);
          else rowEls.current.delete(id);
        },
        role: 'treeitem',
        tabIndex: tabKey === id ? 0 : -1,
        'aria-level': item.depth + 1,
        'aria-setsize': r.size,
        'aria-posinset': r.pos,
        'aria-expanded': item.hasChildren ? item.expanded : undefined,
        'aria-selected': !checkable && mode !== 'none' ? item.selected : undefined,
        'aria-checked': checkable ? (item.checked === 'mixed' ? 'mixed' : item.checked) : undefined,
        'aria-disabled': item.disabled || undefined,
        'aria-busy': item.loading || undefined,
        'data-depth': item.depth,
        'data-selected': dataAttr(item.selected),
        'data-expanded': dataAttr(item.expanded),
        'data-focused': dataAttr(item.focused),
        'data-disabled': dataAttr(item.disabled),
        'data-has-children': dataAttr(item.hasChildren),
        'data-checked': checkable ? String(item.checked) : undefined,
        'data-match': dataAttr(item.match),
        'data-drag-source': dataAttr(drag?.id === id),
        'data-drop': over,
        style: { '--pinfold-treeview-i-depth': String(item.depth) } as React.CSSProperties,
        onFocus: (event: React.FocusEvent) => {
          if (event.target === event.currentTarget) setFocusedKey(id);
        },
        onClick: (event: React.MouseEvent) => {
          setFocusedKey(id);
          press(item, event);
        },
      },
      mergeProps(config.rowProps?.(item) ?? {}, props),
    );
  };

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const render = (rootProps?: TreeViewRootProps): React.ReactElement => {
    const { ...rest } = rootProps ?? {};
    const slot = (name: TreeViewSlot, content: React.ReactNode, tag: string, own: PropsBag = {}, item?: TreeViewItemContext) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-treeview__${name}`), ...own, ...(item ? { [ITEM]: item } : null) }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('treeview', config.dimensions);
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-treeview', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rest as PropsBag)),
    );
    const guides = (depth: number, item?: TreeViewItemContext) =>
      Array.from({ length: depth }, (_, i) => <React.Fragment key={`g${i}`}>{slot('guide', null, 'span', { 'aria-hidden': true, 'data-level': i }, item)}</React.Fragment>);
    const body = rows.map((r) => {
      if (r.kind === 'status') {
        const error = r.status === 'error';
        return (
          <React.Fragment key={r.key}>
            {slot(
              'status',
              <>
                {guides(r.depth)}
                <span className={cls('pinfold-treeview__spacer')} aria-hidden="true">
                  {error ? null : <span className={cls('pinfold-treeview__spinner')} />}
                </span>
                <span className={cls('pinfold-treeview__status-text')}>{error ? labels.error ?? "Couldn't load" : labels.loading ?? 'Loading…'}</span>
                {error ? <span className={cls('pinfold-treeview__retry')}>{labels.retry ?? 'Retry'}</span> : null}
              </>,
              'div',
              {
                ref: (el: HTMLElement | null) => {
                  if (el) rowEls.current.set(r.key, el);
                  else rowEls.current.delete(r.key);
                },
                role: 'treeitem',
                tabIndex: tabKey === r.key ? 0 : -1,
                'aria-level': r.depth + 1,
                'aria-setsize': 1,
                'aria-posinset': 1,
                'aria-busy': !error || undefined,
                'data-status': r.status,
                'data-focused': dataAttr(focusedKey === r.key),
                'data-depth': r.depth,
                onFocus: () => setFocusedKey(r.key),
                onClick: () => {
                  setFocusedKey(r.key);
                  if (error) reload(r.parentId);
                },
              },
            )}
          </React.Fragment>
        );
      }
      const item = r.ctx;
      const data = item.data;
      const label = typeof data.label === 'string' && query ? highlight(data.label, query, (part, i) => <React.Fragment key={i}>{slot('match', part, 'mark', {}, item)}</React.Fragment>) : data.label;
      const content = (
        <>
          {guides(item.depth, item)}
          {item.hasChildren
            ? slot('toggle', item.loading ? <span className={cls('pinfold-treeview__spinner')} /> : CHEVRON, 'span', {
                'aria-hidden': true,
                'data-expanded': dataAttr(item.expanded),
                onClick: (event: React.MouseEvent) => {
                  event.stopPropagation();
                  setFocusedKey(item.id);
                  rowEls.current.get(item.id)?.focus({ preventScroll: true });
                  item.toggle();
                },
              }, item)
            : <span className={cls('pinfold-treeview__spacer')} aria-hidden="true" />}
          {checkable ? slot('checkbox', item.checked === 'mixed' ? DASH : item.checked ? CHECK : null, 'span', { 'aria-hidden': true, 'data-checked': String(item.checked), 'data-disabled': dataAttr(item.disabled) }, item) : null}
          {data.icon != null ? slot('icon', data.icon, 'span', { 'aria-hidden': true }, item) : null}
          {slot('label', label, 'span', {}, item)}
          {data.badge != null ? slot('badge', data.badge, 'span', {}, item) : null}
          {config.reorderable && !query ? slot('handle', GRIP, 'span', getHandleProps(item), item) : null}
        </>
      );
      const props = getItemProps(item.id);
      const inner = config.renderItem ? config.renderItem({ item, props, children: content }) : content;
      return <React.Fragment key={r.key}>{slot('item', inner, 'div', { ...props, className: cn(cls('pinfold-treeview__item'), props.className as string | undefined) }, item)}</React.Fragment>;
    });
    const empty = rows.length === 0 && (query || items.length === 0) ? slot('empty', query ? labels.empty ?? 'No matches' : null, 'div', { role: query ? 'status' : undefined }) : null;
    return renderSlot(
      config,
      'root',
      rootBag,
      state,
      <>
        {config.searchable ? slot('search', null, 'input', getSearchProps()) : null}
        {slot('tree', body, 'div', getTreeProps())}
        {empty}
        <span aria-live="polite" style={VISUALLY_HIDDEN}>
          {announcement}
        </span>
      </>,
      (p, c) => <div {...p}>{c}</div>,
    ) as React.ReactElement;
  };

  const expandAll = () => {
    if (query) return setClosedInSearch({ query, ids: new Set() });
    const all = tree.rows.filter((n) => n.children || n.pending).map((n) => n.id);
    const next = [...new Set([...expanded, ...all])];
    if (next.length !== expanded.length) setExpandedState(next);
    if (next.length !== expanded.length) config.onExpandedChange?.(next, { id: '*', expanded: true });
  };
  const collapseAll = () => {
    if (query) return setClosedInSearch({ query, ids: new Set(tree.rows.map((n) => n.id)) });
    if (!expanded.length) return;
    setExpandedState([]);
    config.onExpandedChange?.([], { id: '*', expanded: false });
  };

  const api: TreeViewApi = {
    value: [...value],
    expanded: [...expanded],
    filter,
    focusedId: focusedKey !== null && !focusedKey.startsWith(STATUS) ? focusedKey : null,
    visible,
    getItem: ctxOf,
    expand: (id) => setExpanded(id, true),
    collapse: (id) => setExpanded(id, false),
    toggle: (id) => setExpanded(id, !(ctxOf(id)?.expanded ?? false)),
    expandAll,
    collapseAll,
    select: (id) => choose(id, mode === 'multiple' ? 'add' : 'replace'),
    setValue: (ids) => setValue([...ids], null),
    setFilter,
    focusItem: (id) => focusKey(id),
    move: (id, parentId, index) => moveNode(id, parentId, index),
    reload,
    getRootProps,
    getTreeProps,
    getItemProps,
    getSearchProps,
    render,
  };
  const live = React.useRef(getSearchProps);
  live.current = getSearchProps;
  return usePinfoldComponent<TreeViewApi, TreeViewRootProps, { Search: (props: React.InputHTMLAttributes<HTMLInputElement>) => React.ReactElement }>('TreeView', api, (props) => render(props), () => ({
    /** The search field, placed where you like: it filters this tree. */
    Search: (props) => <input {...(live.current({ className: 'pinfold-treeview__search', ...props } as PropsBag) as React.InputHTMLAttributes<HTMLInputElement>)} />,
  }));
}
