# Tabs: spec

Status: **experimental**. Pattern: [APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Usage
```tsx
import { defineTabs } from '@pinfold/react/tabs';

export const Settings = defineTabs();

// Panels: each tab's content renders while it is selected
<Settings label="Settings" items={[
  { id: 'profile', label: 'Profile', content: <Profile /> },
  { id: 'billing', label: 'Billing', endContent: <Badge count={2} label="unpaid invoices" />, content: <Billing /> },
]} />

// Strings are tabs: the selected id drives what you render
<Settings label="View" items={['Board', 'List', 'Timeline']} value={view} onChange={setView} />

// Route tabs: links, routed by the provider's navigate
<Settings label="Project" value={pathname} items={[
  { id: '/overview', label: 'Overview', href: '/overview' },
  { id: '/activity', label: 'Activity', href: '/activity' },
]} />

// Editor tabs: close (× or Delete) and add
<Settings label="Open files" variant="enclosed" items={files} value={open} onChange={setOpen}
  onClose={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
  onAdd={() => setFiles((f) => [...f, newFile()])} />
```
Tab ids are inferred from `items`, so `value`, `defaultValue`, `onChange` and `onClose` only
accept those ids. Precedence: use-site props, the preset, `defaults.tabs`, the provider (size,
tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | the tab list's accessible name | required |
| `items` | `{ id, label?, content?, icon?, endContent?, href?, disabled?, closable? }[]`, or strings | required |
| `value`, `defaultValue`, `onChange` | a tab id; `(id, event)` | none, the first enabled tab |
| `onClose` | `(id, event)`: close marks, and Delete closes the focused tab | none |
| `onAdd`, `addLabel` | `(event)`: a + button after the tabs | none, `'New tab'` |
| `closeLabel` | read with a closable tab | `'Press Delete to close'` |
| `onReorder(ids, event)`, `reorderLabel` | drag a tab, or Ctrl (⌘) + Shift + arrow; the move is announced ("App.tsx: 2 of 4"); reorder your items | none, `'Press Control, Shift and an arrow key to move'` |
| `variant` | `'segmented'` (a raised pill in a tray) \| `'underline'` \| `'pills'` (the tone fills) \| `'soft'` (a tint of the tone) \| `'enclosed'` (folder tabs on a card) | `'segmented'` |
| `placement` | `'top' \| 'bottom' \| 'start' \| 'end'`; start and end make a column | `'top'` |
| `activation` | `'auto'` (arrows select) \| `'manual'` (Enter or Space selects) | `'auto'` |
| `fullWidth` | tabs share the row | `false` |
| `keepMounted` | hidden panels stay in the DOM, keeping their state | `false` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `dimensions` | `height, gap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root header list tab indicator icon endContent close add panel`) | | |

Controller: `value`, `select(id)`, `next()`, `previous()`, `focus()`. Controller changes do not
call `onChange`.

Inactive (`inactiveTabsOptions`): `fullWidth` with a side placement; `addLabel` without `onAdd`;
`closeLabel` without `onClose`; `reorderLabel` without `onReorder`. `activation` and `keepMounted` change behaviour only.

Closing the selected tab selects its neighbour first (the next one, else the one before), and focus
moves to the tab that takes the closed one's place. A row wider than its box scrolls; its edges
fade where there is more, and the selected tab scrolls into view. After a change (never on load),
the new panel slides in from the side the selection moved to.

Tray, pill, panel card and edges read the control tokens, so every style pack reaches them.

## Accessibility
- `tablist` named by `label`; each `tab` has `aria-selected` and `aria-controls`; each `tabpanel`
  is labelled by its tab and focusable, so Tab always reaches the content.
- One tab stop. Arrow keys move along the placement and reading direction and wrap; Home and End
  jump. A disabled tab is on the arrow path (`aria-disabled`) but never selected.
- A closable tab has `aria-keyshortcuts="Delete"` and is described by `closeLabel`. The close mark
  is for pointers only: a button inside a tab is not allowed. The + button sits outside the tab
  list, which may hold only tabs.
- The indicator is measured from the selected tab (one `ResizeObserver` per list) and slides;
  before it is placed, the selected tab draws it, so the first paint is right without script.

## Deliberately excluded
- Touch reordering: dragging uses the native drag and drop, which phones do not start from a tab;
  the keys work everywhere.
