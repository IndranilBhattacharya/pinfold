# Tag group: spec

Status: **experimental**. Pattern: a list of tags to read; a [listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) of tags to pick.

## Usage
```tsx
import { defineTags } from '@pinfold/react/tags';

export const Chips = defineTags();

// Filters to remove
<Chips label="Filters" items={filters} onRemove={(v) => setFilters((f) => f.filter((x) => x !== v))} />

// Choices: one or several
<Chips label="Topics" selection="multiple" items={['Design', 'Code', 'Writing']} value={topics} onChange={setTopics} />

// Status labels, each in its own tone
<Chips label="Status" hideLabel items={[{ value: 'live', tone: 'success' }, { value: 'beta', tone: 'warning' }]} />

// A tag input: add (Enter or a comma), rename, reorder, remove
<Chips label="Keywords" items={words} delimiters={[',']}
  onAdd={(t) => setWords((w) => [...w, t])}
  onEdit={(v, t) => setWords((w) => w.map((x) => (x === v ? t : x)))}
  onReorder={setWords}
  onRemove={(v) => setWords((w) => w.filter((x) => x !== v))} />
```
Values are typed from `items`. Precedence: use-site props, the preset, `defaults.tags`, the
provider (size; the tone never comes from the provider: tags stay quiet unless asked), the library
default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel` | names the group | required, `false` |
| `items` | strings, or `{ value, label?, icon?, tone?, href?, removable?, editable?, disabled? }` | required |
| `selection` | `'none'` (tags to read) \| `'single'` \| `'multiple'` (tags to pick) | `'none'` |
| `value`, `defaultValue`, `onChange` | the picked values; `(values, event)` | `[]` |
| `onRemove` | `(value, event)`: remove buttons (marks plus Delete when tags can be picked) | none |
| `onAdd`, `addLabel`, `delimiters` | `(text, event)`: a text field after the tags; Enter (or a delimiter key, or a paste with one) hands you the trimmed text; Backspace in the empty field goes back to the last tag | none, `'Add tag'`, none |
| `onEdit`, `editLabel` | `(value, text, event)`: rename in place. Tags to read: the text is a "Rename React" button. Tags to pick: F2 or a double-click. Enter or leaving keeps, Escape cancels; focus returns to the tag | none, `'Rename'` |
| `onReorder` | `(values, event)`: drag a tag, or Alt + Left / Right on it (or on any of its buttons); you get the new order, and the move is read politely ("React: 2 of 5") | none |
| `maxVisible`, `moreLabel` | tags before a "+3" button that shows the rest | all, `'Show all'` |
| `removeLabel`, `removeHint` | "Remove React"; read with a tag that can be picked and removed (with `onEdit` / `onReorder` the default adds "F2 to rename", "Alt and an arrow key to move") | `'Remove'`, `'Press Delete to remove'` |
| `emptyText` | when there are no tags | none |
| `variant` | `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| `radius` | `'sm' \| 'md' \| 'full'` | `'full'` |
| `size`, `tone` | | `'md'` (provider), `'neutral'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label body list tag icon text editInput remove more add empty`; `render.tag` gets `item` (`{ value, label, text, icon, tone, href, disabled, index, selected, editing, remove?, edit? }`) | |

Controller: `value`, `setValue(values)`, `expand()`, `edit(value)`, `focusAdd()`.

The tag group is not a form field: it holds no form value and has no validation. Bind it to a
field's value instead (a combobox with `chipsPlacement: 'none'`, see the combobox spec).

Inactive (`inactiveTagsOptions`): `value`, `defaultValue`, `onChange`, `removeHint` without
`selection`; `removeLabel` without `onRemove` (and `removeHint` without `onRemove`, `onEdit` or
`onReorder`); `editLabel` without `onEdit`; `addLabel`, `delimiters` without `onAdd`; `moreLabel`
without `maxVisible`.

## Accessibility
- Tags to read: a list named by `label`; links are links; each remove button is a real button
  named "Remove <tag>"; after a removal focus moves to the next tag.
- Tags to pick: a horizontal `listbox` of `option`s with `aria-selected`, one tab stop; arrows
  follow the reading direction; Space or Enter picks; Delete removes. The remove mark is for
  pointers (a button inside an option is not allowed); the option has
  `aria-keyshortcuts="Delete"` and is described by `removeHint`.
- Picked tags are filled and bold, never colour alone.
- The add field is a text input named by `addLabel`; in tags to pick it sits after the listbox,
  never inside it. A rename field is named "Rename <tag>".
- Reordering has a keyboard way (Alt + arrows, `aria-keyshortcuts` on options) and each move is
  read from a polite live region.
