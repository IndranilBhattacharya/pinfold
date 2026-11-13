# Tree view: spec

Status: **experimental**. Nested data you can open, select, check, search and reorder.

## Usage
```tsx
import { defineTreeView } from '@pinfold/react/treeview';

export const Files = defineTreeView({ searchable: true });

<Files label="Files" items={[{ label: 'src', children: ['index.ts', 'app.tsx'] }, 'package.json']} onAction={(id) => open(id)} />
<Files label="Permissions" checkable items={permissions} value={checked} onSelectionChange={setChecked} />
<Files label="Drive" items={[{ id: 'root', label: 'My drive', hasChildren: true }]} loadChildren={(item, { signal }) => api.list(item.id, { signal })} />
<Files label="Pages" reorderable items={pages} onMove={({ items }) => save(items)} />
```
Precedence: use-site props, the preset, `defaults.treeview`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the tree (required) | |
| `items` | nodes: `{ id, label, textValue, icon, badge, children, hasChildren, disabled, ...your fields }` or a string (a leaf). Without an `id`, a node is known by its path of labels: `src/index.ts` | |
| `value` / `defaultValue` | selected ids (with `checkable`: every fully checked id, parents included) | `[]` |
| `expanded` / `defaultExpanded` | open ids | `[]` |
| `selectionMode` | `'none'` (rows are actions), `'single'`, `'multiple'` | `'single'` |
| `checkable` | tri-state checkboxes; checking a parent checks everything in it, a parent shows checked, mixed or unchecked from its children; disabled leaves keep their state and do not hold their parent back | `false` |
| `expandOnClick` | pressing a parent row also opens or closes it (the chevron always does) | `true` |
| `loadChildren` | `(item, { signal }) => Promise<children>` for nodes with `hasChildren`, the first time they open | |
| `searchable`, `filter`, `filterFn` | a search field; the search text, controlled; `(item, query) => boolean` (default: label or `textValue` contains the text, ignoring case) | `false` |
| `reorderable` | a drag handle per row and Alt + arrows | `false` |
| `disabled` | nothing selects; rows stay focusable and openable | `false` |
| `variant` | selected row: `'soft'` (a tint), `'solid'` (filled), `'ghost'` (text and a bar) | `'soft'` |
| `density` | `'comfortable'`, `'compact'` | `'comfortable'` |
| `guides` | hairlines down each open level | `true` |
| `renderItem` | `({ item, props, children }) => node`: the content of every row; the row element and its ARIA stay | |
| `rowProps` | `(item) => props` merged onto every row element | |
| `labels` | `{ search, empty, loading, error, retry, handle, moved({ label, index, count, parent }) }` | English |
| `dimensions` | `{ indent, rowHeight, height }` (a `height` makes the tree scroll) | |
| `radius`, `size`, `tone` | | theme, `'md'`, `'primary'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root search tree item guide toggle checkbox icon label match badge handle status empty` | |

`item` (in `renderItem`, `rowProps`, `onAction` and row slot `render` overrides) is
`{ id, data, label, text, depth, parentId, index, expanded, selected, checked, focused, disabled, loading, error, hasChildren, match, toggle(), select() }`.

## Events
| Event | Called with |
|---|---|
| `onSelectionChange` | `(ids, item)`: the new selection (or checked set) and the row that changed it (`null` from the controller) |
| `onExpandedChange` | `(ids, { id, expanded })`; `id` is `'*'` from `expandAll()` / `collapseAll()` |
| `onAction` | `(id, item)`: a row was pressed, or Enter on it |
| `onMove` | `({ id, parentId, index, items })`: `parentId` is `null` at the top; `items` is the whole tree after the move, ids made explicit |
| `onFilterChange` | `(text)` from the search field |
| `onLoadError` | `(item, error)` when `loadChildren` rejects |

## Behaviour
- Drawn flat: each row is one element carrying `aria-level`, `aria-setsize` and `aria-posinset`. Guides are one
  span per level, so the hairlines join from row to row.
- Selection: single selects the pressed row. Multiple: a press selects one row, Ctrl/Cmd + press toggles, Shift +
  press selects the range from the last pressed row, Space toggles, Shift + arrows extend, Ctrl/Cmd + A takes every
  visible row. With `checkable` a press or Space checks the row, and parents open from the chevron.
- Search keeps every match and the path to it, in data order, opened; the matched text is marked. Closing a row
  during a search lasts until the text changes. Reordering is off while searching.
- Lazy children: a node with `hasChildren` loads when it first opens (also when it starts open). Meanwhile its
  chevron spins and a loading row shows under it; on failure an error row offers Retry (press it or Enter). Loads
  are aborted through `signal` when the tree unmounts or the node is reloaded. `reload(id)` loads again.
- Reorder: drag a row by its handle (the pointer is captured by the handle; Escape cancels). Over a row that can
  hold children (has a `children` array) the middle drops inside, the edges before and after; over a leaf, the
  upper or lower half. A node never drops into itself. Alt + Up / Down swap with a sibling, Alt + Left moves out
  of the parent, Alt + Right into the sibling before it (when it has a `children` array). Moves change the tree
  the component shows at once and hand it back in `onMove`; new `items` replace it. Every move is announced.
- With a drag-and-drop library (e.g. dnd-kit) instead of the built-in drag: leave `reorderable` off, wrap each row
  through `render.item`, spread its listeners with `rowProps`, and on drop call the controller's `move(id, parentId, index)`:
  ```tsx
  render={{ item: ({ props, children, item }) => <SortableRow id={item.id} {...props}>{children}</SortableRow> }}
  ```
- Long trees are not virtualised: every visible row is in the DOM. That stays smooth to a few thousand visible
  rows; beyond that, keep branches closed or load them on demand.
- `useTreeView` adds `value`, `expanded`, `filter`, `focusedId`, `visible`, `getItem`, `expand`, `collapse`,
  `toggle`, `expandAll`, `collapseAll`, `select`, `setValue`, `setFilter`, `focusItem`, `move`, `reload`, the prop
  getters and a `<Tree.Search />` part to place the search field anywhere.

## Keyboard
| Keys | Action |
|---|---|
| ArrowDown / ArrowUp | next / previous visible row |
| ArrowRight | open a closed parent; on an open one, go to its first child (mirrored in RTL) |
| ArrowLeft | close an open parent; otherwise go to its parent (mirrored in RTL) |
| Home / End | first / last row |
| `*` | open every sibling of the focused row |
| a letter | typeahead |
| Enter | press the row (select, open with `expandOnClick`, `onAction`); on an error row, retry |
| Space | select (multiple: toggle; `checkable`: check) |
| Alt + arrows | move the row (`reorderable`) |
| ArrowDown in the search field | to the first row; Escape clears the field |

## Accessibility
- `role="tree"` named by `label`, `aria-multiselectable` for multiple selection and checkboxes; rows are `treeitem`
  with `aria-expanded` on parents and `aria-selected`, or `aria-checked` (true, false, mixed) with `checkable`.
- Roving tabindex: one row is in the tab order; when its parent closes, the focus moves to the parent.
- Disabled rows keep focus with `aria-disabled`. A loading node is `aria-busy`; loading and error rows are rows.
- The drag handle is pointer only (`aria-hidden`); Alt + arrows do the same from the keyboard, announced politely.
- Forced colours: the system highlight for selected rows and checked boxes.
