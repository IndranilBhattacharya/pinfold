# Combobox: spec

Status: **experimental**. Pattern: [APG combobox with list autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/).

## Usage
```tsx
import { defineCombobox } from '@pinfold/react/combobox';
import '@pinfold/css/select.css'; // the combobox wears the select's styles

export const Search = defineCombobox();

// Suggest from your rows: accents and case ignored, matches marked
<Search label="City" items={cities} onChange={setCity} />

// Search a server: your items are the results
const [query, setQuery] = useState('');
const { data = [], isFetching } = useRepos(query);
<Search label="Repository" filter="none" items={data} loading={isFetching} onInputChange={setQuery} />

// A tag input: several values, free text allowed
<Search label="Tags" multiple allowCustom items={suggestions} value={tags} onChange={setTags} />
```

### Search a server, pick several, chips above the field
`loadItems` does the waiting, cancelling and caching; return a page with `hasMore` and the next
page loads as the list scrolls near its end (or the arrow keys reach it), under a "Loading more…"
row. Chosen people keep their names and photos when the results change.
```tsx
<Search
  label="Reviewers"
  multiple
  chipsPlacement="above"
  value={ids}
  onChange={setIds}
  loadItems={async (query, { signal, cursor }) => {
    const res = await fetch(`/api/people?q=${encodeURIComponent(query)}&after=${cursor ?? ''}`, { signal });
    const { people, next } = await res.json();
    return {
      items: people.map((p) => ({ value: p.id, label: p.name, avatar: p.photo, description: p.email, endContent: p.role })),
      hasMore: !!next,
      cursor: next,
    };
  }}
  onRemove={(id, item) => toast(`Removed ${item.text}`)}
/>
```

### Draw the chips yourself: a Tag group bound to the value
`chipsPlacement: 'none'` draws no chips (and Backspace removes nothing), so a Tag group, a table or
anything else can show the choice where you want it.
```tsx
import { Tags } from '@pinfold/react/tags';

const [ids, setIds] = useState<string[]>([]);
const names = Object.fromEntries(people.map((p) => [p.value, p.label]));
<Tags label="Reviewers" hideLabel items={ids.map((id) => ({ value: id, label: names[id] }))}
  onRemove={(id) => setIds((x) => x.filter((y) => y !== id))} onReorder={setIds} />
<Search label="Reviewers" multiple chipsPlacement="none" items={people} value={ids} onChange={setIds} />
```

### A dropdown of your own: a table
`renderList` replaces the listbox with your body. Typing still filters (or `loadItems` still
fetches), the arrow keys still move the active row and Enter still chooses it; spread
`getRowProps(value)` on each row element so it gets its id, its role, `aria-selected`,
`data-active` / `data-selected` and the pointer handlers. Say what the body is with `popupRole`.
```tsx
<Search label="Customer" items={customers} popupRole="grid"
  renderList={({ items, getRowProps, loading }) => (
    <table role="grid" aria-label="Customers">
      <tbody>
        {items.map((it) => (
          <tr key={it.value} {...getRowProps(it.value)}>
            <td>{it.label}</td>
            <td>{it.data.plan}</td>
            <td>{it.data.seats}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )} />
```
Precedence: use-site props, the preset, `defaults.combobox`, the provider (size, tone), the library
default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | as Input | |
| validation | `validate`, `validateOn`, `messages`, `onValidate`, `onInvalid`, `status`, `error` as a function: as Input. `validate` gets the value (an array with `multiple`); with `multiple`, `required` means at least one ("Choose at least one.", or `messages.required`) | `validateOn: 'blur'` |
| `items` | as Select: strings or `{ value, label?, textValue?, description?, icon?, avatar?, endContent?, tone?, group?, disabled? }`, extra fields reach `render` and `renderList` as `item.data`; a long list (over 120 rows, no groups) draws only the rows in view, each with `aria-setsize`/`aria-posinset` | required unless `loadItems` |
| `loadItems`, `debounce` | `(query, { signal, cursor, page }) => rows \| { items, hasMore, cursor } \| Promise<…>`: rows for what is typed (`''` on open), after a pause; stale requests (and a page on its way) are aborted, results cached per query (pages included), a loading row while it runs, an error row when it fails; chosen values keep their labels. A page with `hasMore` loads the next one (with its `cursor`, default the row count) near the end of the scroll | none, `250` ms |
| `hasMore`, `onLoadMore` | your own `items` have a next page: `onLoadMore()` runs near the end of the scroll, once per row count; set `loading` while it runs for the "Loading more…" row | `false`, none |
| `onSearch` | `(query)` once typing pauses for `debounce` ms | none |
| `renderList`, `popupRole` | your own dropdown body (see above): `renderList(context)`, `context` = `{ items, query, value, loading, loadingMore, error, hasMore, loadMore, select, deselect, toggle, isSelected, activeValue, setActiveValue, getRowProps, close }`; `popupRole` `'dialog' \| 'listbox' \| 'grid' \| 'tree'` is the popup's role and the input's `aria-haspopup` | none, `'dialog'` |
| `selectedInList` | multiple: chosen rows keep a check (pick to remove), show disabled (remove with the chip), or leave the list | `'check'` |
| `chipsPlacement` | multiple: `'inside'` the field (up to `maxChips`, then "+n"); `'above'` or `'below'` it as a tag group with real remove buttons; `'none'` (you draw them) | `'inside'` |
| `chipVariant` | multiple: `'soft' \| 'solid' \| 'outline'`; a row's `tone` colours its chip | `'soft'` |
| `maxChips` | chips before a "+n" chip, which shows the rest (then "Show less") | `3` inside, all outside |
| `multiple` | chips before the text; Backspace in an empty field removes the last | `false` |
| `value`, `defaultValue`, `onChange` | a value (array with `multiple`), `null` for none | none |
| `inputValue`, `defaultInputValue`, `onInputChange` | what is typed; `(text)` on every keystroke | uncontrolled, `''` |
| `filter` | `'contains' \| 'startsWith'` (any word start) \| `'none'` (your items are the results) | `'contains'` |
| `allowCustom`, `onCreate` | typed text becomes a value: an `Add "…"` row, Enter, or leaving the field. `onCreate(text)` may return nothing (keep the text), `false` (refuse), or the value or `{ value, label }` to add instead; a promise of one waits | `false`, none |
| `onRemove` | `(value, item)`: a value left a multiple choice (a chip, Backspace, the list, `deselect`) | none |
| `onClear` | `()`: the clear button emptied the field | none |
| `loading` | a loading row while there are none; `aria-busy` | `false` |
| `highlight` | mark the typed text in rows | `true` |
| `openOnFocus` | open before anything is typed | `false` |
| `clearable`, `placeholder` | | `false`, none |
| `labels` | `{ empty, loading, loadingMore, error, clear, create(text), more(count), less, remove }` | English |
| `open`, `defaultOpen`, `onOpenChange`, `placement`, `variant`, `size`, `tone`, `dimensions` | as Select | |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label control values chips chip chipRemove input clear chevron popup group groupLabel option check avatar icon detail endContent empty loadMore description error statusIcon validating`; `render.option` and `render.chip` get `item` (`{ value, label, text, description, icon, avatar, endContent, tone, group, data, selected, active, disabled, index, remove? }`) | |

Leaving the field with text that matches no row puts the text back to the chosen value (or keeps
it with `allowCustom`); leaving it empty clears the value. Controller: `value`, `inputValue`,
`isOpen`, `open()`, `close()`, `setValue(values)`, `clear()`, `loadMore()`, `focus()`, and
validation's `validate()`, `setError(message)`, `clearError()`.

The loading row of a refresh (and of a next page) is the `loadMore` slot; it was the `empty` slot
before, so a `classNames.empty` meant for it moves to `classNames.loadMore`.

Inactive (`inactiveComboboxOptions`): `maxChips`, `selectedInList`, `chipsPlacement`,
`chipVariant`, `onRemove` without `multiple`; `maxChips`, `chipVariant` with `chipsPlacement:
'none'`; `debounce` without `loadItems` or `onSearch`; `hasMore`, `onLoadMore` with `loadItems`;
`popupRole` without `renderList`; `onCreate` without `allowCustom`.

## Accessibility
- The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded` and
  `aria-controls`; focus stays in it and `aria-activedescendant` names the active row.
- Typing opens the list with the first match active, so Enter takes it. Escape closes, then clears.
- The list is `role="listbox"`, `aria-busy` while loading; matches are `<mark>`.
- With `name`, hidden inputs submit the chosen values; one value uses the input's own `required`.
- Chips above or under the field are a `group` named "<label>: 3", each with a real remove button
  ("Remove Berlin") and a "+n" button that shows the rest. Chips inside the field have pointer
  marks; Backspace and the list are the keyboard ways.
- A `renderList` body owns its roles. The popup takes `popupRole` (default `dialog`), also set as
  the input's `aria-haspopup`; with `listbox`, `grid` or `tree`, rows that spread `getRowProps`
  get ids, the matching row role (`option`, `row`, `treeitem`) and `aria-selected`, and
  `aria-activedescendant` names the active one. With `dialog` there is no active descendant.
- Validation as Input: an error is the input's custom validity, linked with `aria-describedby`,
  with `aria-invalid`; `aria-busy` while an async `validate` runs.
