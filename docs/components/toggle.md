# Toggle: spec

Status: **experimental**. Patterns: [APG button (toggle)](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), [APG toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

One toggle, or a group from `items`, as Checkbox is one box or a group.

## Usage
```tsx
import { defineToggle } from '@pinfold/react/toggle';

export const View = defineToggle({ fullWidth: true });
export const Format = defineToggle({ selection: 'multiple', variant: 'ghost' });
export const Pin = defineToggle({ variant: 'outline' });

<View label="View" defaultValue={['list']} items={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} onChange={setView} />
<Format label="Text style" items={[{ value: 'bold', label: 'Bold', icon: <BoldIcon />, iconOnly: true }]} />
<Pin label="Pin" icon={<PinIcon />} onChange={setPinned} />

// As a controller
const Tabs = useToggle({ label: 'View', items });
Tabs.value; Tabs.setValue(['board']);
```
Precedence: use-site props, the preset, `defaults.toggle`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node: one toggle's text and name; a group's name | required |
| `hideLabel` | group: name for screen readers only | `true` |
| `pressed`, `defaultPressed`, `icon`, `iconOnly` | one toggle | none, `false`, none, `false` |
| `items` | `{ value, label, icon?, iconOnly?, disabled? }[]`: a group | none |
| `selection` | `'single' \| 'multiple'` | `'single'` |
| `value`, `defaultValue` | `string[]` | none, `[]` |
| `allowEmpty` | single: pressing the selected button clears it | `false` |
| `onChange` | `(pressed, event)` / `(values, event)` | none |
| `name` | hidden form fields, one per selected value | none |
| `disabled`, `orientation`, `fullWidth` | | `false`, `'horizontal'`, `false` |
| `variant` | `'segmented' \| 'solid' \| 'soft' \| 'outline' \| 'ghost'` | `'segmented'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `dimensions` | `height, paddingX` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label items item indicator icon text`) | | |

Inactive (`inactiveToggleOptions`): group options without `items`; `pressed`, `defaultPressed`,
`icon`, `iconOnly`, `hideLabel` with them; `allowEmpty` in a multiple selection.

### Looks
Every variant has a clear resting surface, a hover tint, a full focus ring, and a pressed state in
the tone that is filled, framed or raised, never a colour change alone. Check them in light and
dark: the pressed text is the tone pulled toward the theme text, so it clears 4.5:1 on its tint.

| Variant | Resting | Pressed |
|---|---|---|
| `segmented` | a tinted tray | a raised pill in the tone's solid colour; `tone: 'neutral'` gives a raised surface, like an OS segmented control |
| `solid` | one framed bar on the control surface, hairlines between buttons | filled with the tone, on-tone text |
| `soft` | each button on a light tint | the tone's tint with a hairline ring and tone text |
| `outline` | one framed bar, hairlines between buttons | the tone's tint with a ring in the tone |
| `ghost` | no surface until hover | the tone's tint and tone text |

**Sliding selection.** In a single selection, one indicator carries the pressed look and slides to
the chosen button when the root has `data-animate` (the default; the provider's `disableAnimation`
turns it off, `prefers-reduced-motion` makes it instant). It is measured from the selected button,
so it fits buttons of any width, in a row or a column (one ResizeObserver per group). Before it is
measured, the selected button draws the pressed look itself, so the first paint is right without
script. A multiple selection has no indicator: each pressed button is drawn on its own.

### Examples
```tsx
// A segmented control that fills its container
<Toggle label="Billing" fullWidth items={[{ value: 'm', label: 'Monthly' }, { value: 'y', label: 'Yearly' }]} defaultValue={['y']} onChange={([period]) => setPeriod(period)} />

// Icon-only formatting buttons: each label is the name and the tooltip (it must be text)
<Toggle label="Text style" variant="solid" tone="neutral" selection="multiple"
  items={[{ value: 'bold', label: 'Bold', icon: <BoldIcon />, iconOnly: true }, { value: 'italic', label: 'Italic', icon: <ItalicIcon />, iconOnly: true }]} />

// A disabled option stays focusable and readable, but is never chosen
<Toggle label="View" variant="soft" items={[{ value: 'list', label: 'List' }, { value: 'map', label: 'Map', disabled: true }]} />

// One toggle
<Toggle label="Pin" icon={<PinIcon />} variant="outline" onChange={(pressed) => setPinned(pressed)} />
```

### Custom content
`render.item` receives the button's props and `item` (the entry, its `index` and `selected`), so a
button can carry anything: a count, an avatar, a dot.

```tsx
<Toggle label="Filter" items={filters} render={{ item: ({ props, item }) => <button {...props}>{item.label} <Badge label={counts[item.value]} /></button> }} />
```

## Accessibility
- One toggle: `<button aria-pressed>`. Single selection: `radiogroup` of `radio` buttons, as a
  segmented control is read; arrow keys select. Multiple: `group` of `aria-pressed` buttons; arrow
  keys move focus only.
- Roving focus: one tab stop. Disabled buttons are `aria-disabled`: focusable and on the arrow
  path, so they can be found, but never selected.
- Icon-only buttons keep the label as name and tooltip, so their `label` must be text: a node
  label on an `iconOnly` toggle or item is a dev warning. Pressed is never colour alone.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Toggle`, `ToggleGroup type` | `ButtonGroup`, `Tabs` | `ToggleButton(Group) exclusive` | `items`, `selection` |
| | `Tabs variant="solid"` (segmented) | | `variant: 'segmented' \| 'solid' \| 'soft' \| 'outline' \| 'ghost'`, a sliding selection in each |
