/**
 * Tree view rules: tri-state checking, moving a node, and where a keyboard move lands. Pure functions
 * over a minimal node shape, so any adapter shares them.
 */

/** The least a tree node needs for these rules. `children` undefined means a leaf, or one not loaded yet. */
export interface TreeNodeLike {
  id: string;
  children?: readonly TreeNodeLike[] | null;
  disabled?: boolean;
}

export type TreeCheckState = boolean | 'mixed';

/**
 * Each node's check state from the set of checked ids. A parent with children reflects them: all
 * (enabled) checked is checked, some is mixed, none is unchecked. A parent whose children are not
 * known (not loaded) keeps its own entry.
 */
export function treeCheckStates(roots: readonly TreeNodeLike[], checked: ReadonlySet<string>): Map<string, TreeCheckState> {
  const out = new Map<string, TreeCheckState>();
  const walk = (node: TreeNodeLike, depth: number): TreeCheckState => {
    const kids = depth < 32 ? node.children ?? [] : [];
    let state: TreeCheckState = checked.has(node.id);
    const states = kids.map((k) => walk(k, depth + 1));
    // A disabled leaf cannot change, so it does not hold its parent back.
    const own = kids.flatMap((k, i) => (k.disabled && !k.children?.length ? [] : [states[i]]));
    if (own.length) state = own.every((s) => s === true) ? true : own.every((s) => s === false) ? false : 'mixed';
    out.set(node.id, state);
    return state;
  };
  for (const root of roots) walk(root, 0);
  return out;
}

/**
 * Check or uncheck a node and everything under it (disabled nodes keep their state), then return
 * every fully checked id, parents included, in tree order.
 */
export function toggleTreeChecked(roots: readonly TreeNodeLike[], checked: ReadonlySet<string>, id: string, next?: boolean): string[] {
  const states = treeCheckStates(roots, checked);
  const target = next ?? states.get(id) !== true;
  const set = new Set(checked);
  const apply = (node: TreeNodeLike, depth: number) => {
    if (!node.disabled) {
      if (target) set.add(node.id);
      else set.delete(node.id);
    }
    if (depth < 32) for (const k of node.children ?? []) apply(k, depth + 1);
  };
  const find = (list: readonly TreeNodeLike[], depth: number): TreeNodeLike | null => {
    for (const node of list) {
      if (node.id === id) return node;
      const hit = depth < 32 ? find(node.children ?? [], depth + 1) : null;
      if (hit) return hit;
    }
    return null;
  };
  const node = find(roots, 0);
  if (!node) return [...checked];
  apply(node, 0);
  // Parents follow their children again.
  const after = treeCheckStates(roots, set);
  const out: string[] = [];
  const walk = (list: readonly TreeNodeLike[], depth: number) => {
    for (const n of list) {
      if (after.get(n.id) === true) out.push(n.id);
      if (depth < 32) walk(n.children ?? [], depth + 1);
    }
  };
  walk(roots, 0);
  return out;
}

/** Where a node sits: its parent's id (`null` at the top) and its index among its siblings. */
export interface TreePlace {
  parentId: string | null;
  index: number;
}

/** A node's parent and index, or null when it is not in the tree. */
export function treePlace(roots: readonly TreeNodeLike[], id: string): TreePlace | null {
  const walk = (list: readonly TreeNodeLike[], parentId: string | null, depth: number): TreePlace | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { parentId, index: i };
      const hit = depth < 32 ? walk(list[i].children ?? [], list[i].id, depth + 1) : null;
      if (hit) return hit;
    }
    return null;
  };
  return walk(roots, null, 0);
}

/** Whether `id` is `ancestor` or lies anywhere under it. */
export function isTreeDescendant(roots: readonly TreeNodeLike[], ancestor: string, id: string): boolean {
  const find = (list: readonly TreeNodeLike[], depth: number): TreeNodeLike | null => {
    for (const n of list) {
      if (n.id === ancestor) return n;
      const hit = depth < 32 ? find(n.children ?? [], depth + 1) : null;
      if (hit) return hit;
    }
    return null;
  };
  const top = find(roots, 0);
  if (!top) return false;
  if (top.id === id) return true;
  const inside = (list: readonly TreeNodeLike[], depth: number): boolean => list.some((n) => n.id === id || (depth < 32 && inside(n.children ?? [], depth + 1)));
  return inside(top.children ?? [], 0);
}

/**
 * Move a node to a new parent (`null`: the top level) at an index among its new siblings, counted
 * after it has left its old place. Returns a new tree; the input is not changed. A move into the
 * node itself or under it returns the tree unchanged.
 */
export function moveTreeNode<T extends TreeNodeLike>(roots: readonly T[], id: string, parentId: string | null, index: number): T[] {
  if (parentId !== null && isTreeDescendant(roots, id, parentId)) return roots.slice();
  let moved: T | null = null;
  const take = (list: readonly T[], depth: number): T[] =>
    list.flatMap((n) => {
      if (n.id === id) {
        moved = n;
        return [];
      }
      if (depth >= 32 || !n.children) return [n];
      return [{ ...n, children: take(n.children as readonly T[], depth + 1) }];
    });
  const without = take(roots, 0);
  if (!moved) return roots.slice();
  const node = moved as T;
  const put = (list: T[]): T[] => {
    const at = Math.max(0, Math.min(index, list.length));
    return [...list.slice(0, at), node, ...list.slice(at)];
  };
  if (parentId === null) return put(without);
  let placed = false;
  const into = (list: readonly T[], depth: number): T[] =>
    list.map((n) => {
      if (n.id === parentId) {
        placed = true;
        return { ...n, children: put([...((n.children as readonly T[] | undefined) ?? [])]) };
      }
      if (depth >= 32 || !n.children) return n;
      return { ...n, children: into(n.children as readonly T[], depth + 1) };
    });
  const out = into(without, 0);
  return placed ? out : roots.slice();
}

/**
 * Where a keyboard move (Alt + an arrow) takes a node: `up` and `down` swap it with a sibling,
 * `out` puts it after its parent, `in` makes it the last child of the sibling before it (when that
 * one can hold children). `null` when there is nowhere to go.
 */
export function treeKeyboardMove(roots: readonly TreeNodeLike[], id: string, direction: 'up' | 'down' | 'in' | 'out', canHold: (node: TreeNodeLike) => boolean = (n) => Array.isArray(n.children)): TreePlace | null {
  const place = treePlace(roots, id);
  if (!place) return null;
  const siblings = (parentId: string | null): readonly TreeNodeLike[] => {
    if (parentId === null) return roots;
    const find = (list: readonly TreeNodeLike[], depth: number): TreeNodeLike | null => {
      for (const n of list) {
        if (n.id === parentId) return n;
        const hit = depth < 32 ? find(n.children ?? [], depth + 1) : null;
        if (hit) return hit;
      }
      return null;
    };
    return find(roots, 0)?.children ?? [];
  };
  const list = siblings(place.parentId);
  if (direction === 'up') return place.index > 0 ? { parentId: place.parentId, index: place.index - 1 } : null;
  if (direction === 'down') return place.index < list.length - 1 ? { parentId: place.parentId, index: place.index + 1 } : null;
  if (direction === 'out') {
    if (place.parentId === null) return null;
    const parent = treePlace(roots, place.parentId)!;
    return { parentId: parent.parentId, index: parent.index + 1 };
  }
  const before = list[place.index - 1];
  if (!before || !canHold(before)) return null;
  return { parentId: before.id, index: (before.children ?? []).length };
}

/** Options with no visible effect in the current config. */
export function inactiveTreeViewOptions(config: { selectionMode?: string; checkable?: boolean; reorderable?: boolean; searchable?: boolean; filter?: string; loadChildren?: unknown }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.checkable && config.selectionMode !== undefined) out.selectionMode = 'with `checkable` the checkboxes are the selection (several at once).';
  if (config.checkable) out.expandOnClick = 'with `checkable` pressing a row checks it; parents open from the chevron.';
  if (!config.reorderable) out.onMove = 'only called with `reorderable`.';
  if (!config.searchable && config.filter === undefined) out.filterFn = 'only used with `searchable` or a `filter`.';
  if (!config.searchable) out.onFilterChange = 'only called by the search field of `searchable`.';
  return out;
}
