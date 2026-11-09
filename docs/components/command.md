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
```
Commands with `href` go through the provider's `navigate` (or the browser). Precedence: use-site
props, the preset, `defaults.command`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the palette | required |
| `items` | strings, or `{ value?, label, textValue?, keywords?, description?, icon?, shortcut?, group?, href?, disabled?, onSelect? }` | required |
| `onSelect` | `(value, event)` for any command | none |
| `placeholder`, `emptyText` | | `'Type a command or search…'`, `'No results'` |
| `filter` | `'contains' \| 'startsWith' \| 'none'` | `'contains'` |
| `inputValue`, `defaultInputValue`, `onInputChange` | what is typed | uncontrolled, `''` |
| `loading` | a loading row while there are none, `aria-busy` | `false` |
| `mode` | `'inline' \| 'dialog'` | `'inline'` |
| `open`, `defaultOpen`, `onOpenChange` | dialog | uncontrolled, `false` |
| `hotkey` | dialog: opens it from anywhere; `mod` is ⌘ on Apple, Ctrl elsewhere; `''` for none | `'mod+k'` |
| `closeOnSelect` | dialog: close after a command runs | `true` |
| `footer` | key hints under the list | `true` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `dimensions` | `width`, `maxHeight` | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root panel search searchIcon input list group groupLabel option icon detail shortcut empty footer` | |

Controller: `isOpen`, `open()`, `close()`, `inputValue`, `focus()`.

Inactive (`inactiveCommandOptions`): `open`, `defaultOpen`, `onOpenChange`, `hotkey`,
`closeOnSelect` unless `mode: 'dialog'`.

## Accessibility
- The search field is a `combobox` named by `label`, controlling a `listbox` of `option`s; focus
  stays in it and `aria-activedescendant` names the active command. The first match is active as
  you type, so Enter runs it; arrows skip disabled commands.
- As a dialog it is the browser's modal: the page is inert, Escape closes, focus returns to where
  it was. A press on the backdrop closes it.
- Shortcuts are `<kbd>` text and do not bind keys; the key-hint footer is decorative.
