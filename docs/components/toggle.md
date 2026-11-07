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
| `variant` | `'segmented' \| 'outline' \| 'ghost'` | `'segmented'` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `dimensions` | `height, paddingX` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label items item indicator icon text`) | | |

Inactive (`inactiveToggleOptions`): group options without `items`; `pressed`, `defaultPressed`,
`icon`, `iconOnly`, `hideLabel` with them; `allowEmpty` in a multiple selection.

`segmented`: a tray with a raised pill, measured from the selected button, that slides between
buttons of any width (one ResizeObserver per group). Before it is measured, the selected button
draws the pill itself, so the first paint is right without script.

## Accessibility
- One toggle: `<button aria-pressed>`. Single selection: `radiogroup` of `radio` buttons, as a
  segmented control is read; arrow keys select. Multiple: `group` of `aria-pressed` buttons; arrow
  keys move focus only.
- Roving focus: one tab stop. Disabled buttons are `aria-disabled`: focusable and on the arrow
  path, so they can be found, but never selected.
- Icon-only buttons keep the label as name and tooltip. Pressed is never colour alone.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Toggle`, `ToggleGroup type` | `ButtonGroup`, `Tabs` | `ToggleButton(Group) exclusive` | `items`, `selection` |
| | `Tabs variant="solid"` (segmented) | | `variant: 'segmented'` |
