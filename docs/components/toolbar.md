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
| `items` | `ButtonConfig` plus `value` (with `selection`) each | required |
| `selection` | buttons that stay pressed: `'single'` (one, like alignment) or `'multiple'` (like bold); `'none'` = actions | `'none'` |
| `value`, `defaultValue`, `onChange` | with `selection`: pressed values (item `value`, or position); `(values, event)` | none, `[]` |
| `attached` | joined buttons with shared edges | `true` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `variant` | `'outline' \| 'soft' \| 'solid' \| 'ghost'` | `'ghost'` (attached: one raised panel) |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `disabled` | for every button | `'md'` (provider), `'neutral'`, `false` |
| `dimensions` | `gap` (not attached) | `space-1` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root item`) | | |

## Accessibility
- `role="toolbar"`, named by `label`, `aria-orientation` when vertical.
- One tab stop (the last used button); arrow keys move, Home and End jump, and stop at the ends.
  Disabled buttons stay focusable (`aria-disabled`).
- Each button is a full Pinfold button: name, icon-only tooltip, loading.
- With `selection`, buttons are toggle buttons with `aria-pressed`; a pressed one is filled, so
  the state is not colour alone. Each item's own `onClick` still runs.

Inactive (`inactiveToolbarOptions`): `value`, `defaultValue` and `onChange` without `selection`.

## Deliberately excluded
- Separators and nested menus inside the toolbar: compose a Menu as an item's neighbour (**Planned**).
