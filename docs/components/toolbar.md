# Toolbar: spec

Status: **experimental**. Pattern: [APG toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

A button group and a toolbar are one component: buttons from a list, joined (`attached`, the
default) or spaced, with one tab stop and arrow keys between them.

## Usage
```tsx
import { defineToolbar } from '@pinfold/react/toolbar';

export const Pager = defineToolbar();
export const Editor = defineToolbar({ attached: false, variant: 'ghost', size: 'sm' });
export const Format = defineToolbar({ selection: 'multiple' });

<Pager label="Pages" items={[{ label: 'Previous', onClick: prev }, { label: 'Today', onClick: today }, { label: 'Next', onClick: next }]} />
<Editor label="Text formatting" items={[{ label: 'Undo', icon: <UndoIcon />, iconOnly: true, onClick: undo }]} />
<Format label="Text style" defaultValue={['bold']} onChange={setStyles} items={[{ label: 'Bold', value: 'bold' }, { label: 'Italic', value: 'italic' }]} />
```
Precedence: each item's own settings, the use site, the preset, `defaults.toolbar`, the provider
(size), the library default. The tone defaults to neutral and never comes from the provider.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | `string`, the toolbar's name | required |
| `items` | a `ButtonConfig` plus `value` (with `selection`), `{ type: 'separator' }`, or `{ content }` (custom) each | required |
| `selection` | buttons that stay pressed: `'single'` (one, like alignment) or `'multiple'` (like bold); `'none'` = actions | `'none'` |
| `value`, `defaultValue`, `onChange` | with `selection`: pressed values (item `value`, or position); `(values, event)` | none, `[]` |
| `attached` | joined buttons with shared edges | `true` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `overflow` | `'wrap'`: more lines (an attached group stays on one line and its labels shrink) \| `'scroll'`: one line that scrolls, with fading edges where buttons are hidden | `'wrap'` |
| `selectedTone` | with `selection`: the tone of a pressed button that does not set its own | `'primary'` |
| `variant` | `'outline' \| 'soft' \| 'solid' \| 'ghost'` | `'ghost'` (attached: one raised panel) |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `disabled` | for every button | `'md'` (provider), `'neutral'`, `false` |
| `dimensions` | `gap` (not attached) | `space-1` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root item separator custom`) | | |

### Look
- `ghost` attached (the default): quiet buttons on one raised panel (the control surface, a
  hairline edge, a soft shadow) with a little inset, so each button's hover and pressed fill have
  their own rounded corners.
- `outline`, `soft`, `solid` attached: joined buttons with shared edges; only the outer corners of
  each group are rounded. Not attached: separate buttons with `gap` between them.
- **Pressed** (with `selection`): the button takes `selectedTone` (primary by default, so a neutral
  toolbar still shows its state at a glance): a tint of the tone with a ring and tone text, or a
  full tone fill for `solid`. It rises over its neighbours, so its whole edge shows.
- Hover follows the Button (a tint for ghost, outline and soft; a darker fill for solid); the focus
  ring is drawn after the joins and the pressed look, so it is never cut.

### Groups and separators
`{ type: 'separator' }` between items splits them into groups: a hairline across the row (along it
when vertical), `role="separator"`, never a tab stop. In an attached toolbar each group rounds its
own outer corners (`data-group-start` / `data-group-end` on its first and last entry).

### Custom items
`{ content }` puts anything in the row. A node renders as is and is not a toolbar stop (a status
text, an avatar). A function gets the roving-focus props for your control: spread them and the
control joins the one tab stop and the arrow keys. Inside a text field, select or editable region
the arrow keys stay with the control.

```tsx
<Toolbar label="Editor" overflow="scroll" selection="multiple" onChange={setMarks} items={[
  { label: 'Undo', icon: <UndoIcon />, iconOnly: true, onClick: undo },
  { label: 'Redo', icon: <RedoIcon />, iconOnly: true, onClick: redo },
  { type: 'separator' },
  { content: ({ props }) => <select {...props} aria-label="Text style"><option>Body</option><option>Heading</option></select> },
  { type: 'separator' },
  { label: 'Bold', value: 'bold', icon: <BoldIcon />, iconOnly: true },
  { label: 'Italic', value: 'italic', icon: <ItalicIcon />, iconOnly: true },
  { content: <span className="muted">Saved</span> },
]} />
```

### Overflow
`overflow: 'scroll'` keeps one line and scrolls it (no scrollbar). The root carries
`data-overflow-start` / `-end` (`-top` / `-bottom` when vertical) while buttons are hidden past an
edge, and that edge fades out (a mask, mirrored in right-to-left text). Focusing a hidden button
scrolls it into view. The listener and observers are removed on unmount.

## Accessibility
- `role="toolbar"`, named by `label`, `aria-orientation` when vertical.
- One tab stop (the last used button); arrow keys move, Home and End jump, and stop at the ends.
  Disabled buttons stay focusable (`aria-disabled`).
- Each button is a full Pinfold button: name, icon-only tooltip, loading.
- With `selection`, buttons are toggle buttons with `aria-pressed`; a pressed one is tinted and
  ringed (filled for solid), so the state is not colour alone. Each item's own `onClick` still runs.
- Separators are `role="separator"` with the opposite orientation. Custom controls that take the
  roving props are toolbar stops; static custom content is not.

Inactive (`inactiveToolbarOptions`): `value`, `defaultValue`, `onChange` and `selectedTone` without
`selection`.

## Deliberately excluded
- A built-in "more" menu that collects the buttons that do not fit: use `overflow: 'scroll'`, or
  put a Menu in a custom item.
