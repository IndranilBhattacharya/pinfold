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
```
Values are typed from `items`. Precedence: use-site props, the preset, `defaults.tags`, the
provider (size; the tone never comes from the provider: tags stay quiet unless asked), the library
default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel` | names the group | required, `false` |
| `items` | strings, or `{ value, label?, icon?, tone?, href?, removable?, disabled? }` | required |
| `selection` | `'none'` (tags to read) \| `'single'` \| `'multiple'` (tags to pick) | `'none'` |
| `value`, `defaultValue`, `onChange` | the picked values; `(values, event)` | `[]` |
| `onRemove` | `(value, event)`: remove buttons (marks plus Delete when tags can be picked) | none |
| `maxVisible`, `moreLabel` | tags before a "+3" button that shows the rest | all, `'Show all'` |
| `removeLabel`, `removeHint` | "Remove React"; read with a tag that can be picked and removed | `'Remove'`, `'Press Delete to remove'` |
| `emptyText` | when there are no tags | none |
| `variant` | `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| `radius` | `'sm' \| 'md' \| 'full'` | `'full'` |
| `size`, `tone` | | `'md'` (provider), `'neutral'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label list tag icon text remove more empty` | |

Inactive (`inactiveTagsOptions`): `value`, `defaultValue`, `onChange`, `removeHint` without
`selection`; `removeLabel`, `removeHint` without `onRemove`; `moreLabel` without `maxVisible`.

## Accessibility
- Tags to read: a list named by `label`; links are links; each remove button is a real button
  named "Remove <tag>"; after a removal focus moves to the next tag.
- Tags to pick: a horizontal `listbox` of `option`s with `aria-selected`, one tab stop; arrows
  follow the reading direction; Space or Enter picks; Delete removes. The remove mark is for
  pointers (a button inside an option is not allowed); the option has
  `aria-keyshortcuts="Delete"` and is described by `removeHint`.
- Picked tags are filled and bold, never colour alone.
