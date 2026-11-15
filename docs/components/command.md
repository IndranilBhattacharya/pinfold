# Command: spec

Status: **experimental**. Pattern: a [combobox with a listbox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/), in a native modal `<dialog>` when `mode: 'dialog'`.

## Usage
```tsx
import { defineCommand } from '@pinfold/react/command';
import '@pinfold/css/select.css'; // the rows and marks
import '@pinfold/css/command.css';

export const Palette = defineCommand({ mode: 'dialog' }); // ⌘K / Ctrl+K opens it

<Palette label="Commands" items={[
  { label: 'New file', shortcut: '⌘N', group: 'File', onSelect: newFile },
  { label: 'Settings', keywords: ['preferences'], href: '/settings', group: 'Go to' },
]} />

// On the page
<Palette mode="inline" label="Jump to" items={pages.map((p) => ({ label: p.title, href: p.url }))} />

// Search a server: the same `loadItems` contract as the combobox (debounced, aborted, cached, paged)
<Palette label="Go to" emptyText={(q) => `Nothing for "${q}"`}
  loadItems={async (q, { signal }) => (await fetch(`/api/search?q=${q}`, { signal }).then((r) => r.json()))
    .map((hit) => ({ value: hit.url, label: hit.title, description: hit.path, avatar: hit.image, href: hit.url, group: hit.kind }))}
  hints={[{ keys: ['↵'], label: 'to open' }, { keys: ['esc'], label: 'to close' }]}
  footerContent={<a href="/search">All results</a>} />
```
Commands with `href` go through the provider's `navigate` (or the browser). Precedence: use-site
props, the preset, `defaults.command`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the palette | required |
| `items` | strings, or `{ value?, label, textValue?, keywords?, description?, icon?, avatar?, endContent?, shortcut?, group?, href?, disabled?, onSelect? }`; groups sit together under a heading in the order they first appear | required unless `loadItems` |
| `loadItems`, `debounce` | `(query, { signal, cursor, page }) => rows \| { items, hasMore, cursor } \| Promise<…>`: commands for what is typed, fetched while open; debounced, aborted when no longer needed, cached per query, not filtered again; a page with `hasMore` loads the next near the end of the scroll | none, `250` ms |
| `onSelect` | `(value, event)` for any command | none |
| `onHighlight` | `(value)`: the keyboard or the pointer moved to a command (`null`: none), e.g. to preview it | none |
| `placeholder`, `emptyText` | `emptyText` is a node or `(query) => node` | `'Type a command or search…'`, `'No results'` |
| `labels` | `{ loading, loadingMore, error }` | English |
| `scrollArrows` | chevron bars at an edge of a long list that hides rows: rest the pointer to scroll (eight rows a second), press for a page; hidden from assistive tech, never focusable, focus stays put (the keys already scroll) | `true` |
| `filter` | `'contains' \| 'startsWith' \| 'none'` | `'contains'` |
| `inputValue`, `defaultInputValue`, `onInputChange` | what is typed | uncontrolled, `''` |
| `loading` | a loading row while there are none, `aria-busy` | `false` |
| `mode` | `'inline' \| 'dialog'` | `'inline'` |
| `open`, `defaultOpen`, `onOpenChange` | dialog | uncontrolled, `false` |
| `hotkey` | dialog: opens it from anywhere; `mod` is ⌘ on Apple, Ctrl elsewhere; `''` for none | `'mod+k'` |
| `closeOnSelect` | dialog: close after a command runs | `true` |
| `footer` | key hints under the list | `true` |
| `hints` | your key hints in place of move / run / close: `[{ keys: ['⇥'], label: 'to complete' }]` | the three |
| `footerContent` | at the end of the footer: a link, a brand, a count (not hidden from assistive tech) | none |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `dimensions` | `width`, `maxHeight` | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root panel search searchIcon input list group groupLabel option avatar icon detail endContent shortcut empty loadMore footer hint footerContent`; `render.option` gets `item` | |

Controller: `isOpen`, `open()`, `close()`, `inputValue`, `setInputValue(text)`, `focus()`.

States: while `loading` (or `loadItems` runs) with no rows, a loading row; with rows, they stay with
a loading row under them. A failed `loadItems` says so (`labels.error`). The loading row of a
refresh is the `loadMore` slot; it was the `empty` slot before.

Inactive (`inactiveCommandOptions`): `open`, `defaultOpen`, `onOpenChange`, `hotkey`,
`closeOnSelect` unless `mode: 'dialog'`; `debounce` without `loadItems`; `hints`, `footerContent`
with `footer: false`.

## Nested pages
A row that opens a second list ("Change carrier…" then the carriers) needs no special option: keep a stack of
pages in your state, give the palette the current page's `items`, and step back on Backspace in an empty field.
```tsx
const [stack, setStack] = useState<string[]>([]);
const [query, setQuery] = useState('');
const page = stack[stack.length - 1];
const open = (name: string) => { setStack((s) => [...s, name]); setQuery(''); };
const items = page === 'carrier'
  ? carriers.map((c) => ({ label: c.name, onSelect: () => setCarrier(c.id) }))
  : [{ label: 'Change carrier…', onSelect: () => open('carrier') }, { label: 'Print label', onSelect: print }];

<Palette label={page === 'carrier' ? 'Choose a carrier' : 'Commands'} items={items}
  inputValue={query} onInputChange={setQuery} closeOnSelect={false}
  slotProps={{ input: { onKeyDown: (e) => { if (e.key === 'Backspace' && !query && stack.length) setStack((s) => s.slice(0, -1)); } } }} />
```
Your `onKeyDown` runs alongside the palette's own keys. In a dialog, `closeOnSelect={false}` keeps it open while
moving between pages; close it yourself after the final command.

## Accessibility
- The search field is a `combobox` named by `label`, controlling a `listbox` of `option`s; focus
  stays in it and `aria-activedescendant` names the active command. The first match is active as
  you type, so Enter runs it; arrows skip disabled commands.
- As a dialog it is the browser's modal: the page is inert, Escape closes, focus returns to where
  it was. A press on the backdrop closes it.
- Shortcuts are `<kbd>` text and do not bind keys; the key hints are decorative, `footerContent`
  is not.
- While commands load the list is `aria-busy`.
