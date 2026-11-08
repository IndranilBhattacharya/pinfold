# Tabs: spec

Status: **experimental**. Pattern: [APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Usage
```tsx
import { defineTabs } from '@pinfold/react/tabs';

export const Settings = defineTabs();
export const Views = defineTabs({ variant: 'segmented', fullWidth: true });

<Settings label="Settings" items={[
  { id: 'profile', label: 'Profile', content: <Profile /> },
  { id: 'billing', label: 'Billing', endContent: <Badge count={2} label="unpaid invoices" />, content: <Billing /> },
]} />
```
Tab ids are inferred from `items`, so `value`, `defaultValue` and `onChange` only accept those
ids. Precedence: use-site props, the preset, `defaults.tabs`, the provider (size, tone), the
library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | the tab list's accessible name | required |
| `items` | `{ id, label, content?, icon?, endContent?, disabled? }[]` | required |
| `value`, `defaultValue`, `onChange` | a tab id; `(id, event)` | none, the first enabled tab |
| `variant` | `'underline'` (a bar slides under the tab) \| `'segmented'` (a pill slides in a tray) \| `'pills'` (the tone fills the tab) | `'underline'` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `activation` | `'auto'` (arrows select) \| `'manual'` (Enter or Space selects) | `'auto'` |
| `fullWidth` | tabs share the row | `false` |
| `keepMounted` | hidden panels stay in the DOM, keeping their state | `false` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `dimensions` | `height, gap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list tab indicator icon endContent panel`) | | |

Inactive (`inactiveTabsOptions`): `fullWidth` when vertical. `activation` and `keepMounted` change
behaviour only.

## Accessibility
- `tablist` named by `label`; each `tab` has `aria-selected` and `aria-controls`; each `tabpanel`
  is labelled by its tab and focusable, so Tab always reaches the content.
- One tab stop. Arrow keys move along the orientation and reading direction and wrap; Home and End
  jump. A disabled tab is on the arrow path (`aria-disabled`) but never selected.
- The indicator is measured from the selected tab (one `ResizeObserver` per list) and slides;
  before it is placed, the selected tab draws it, so the first paint is right without script.

## Deliberately excluded
- Closable or reorderable tabs, and overflow menus for many tabs (**Planned**): the list scrolls.
