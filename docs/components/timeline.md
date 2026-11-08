# Timeline: spec

Status: **experimental**. Pattern: an ordered list.

## Usage
```tsx
import { defineTimeline } from '@pinfold/react/timeline';

export const History = defineTimeline();

<History label="Order history" pending items={[
  { title: 'Ordered', time: '2026-11-02T10:15' },
  { title: 'Shipped', time: '2026-11-04', tone: 'success' },
  'Out for delivery',
]} />
```
Precedence: use-site props, the preset, `defaults.timeline`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the list | required |
| `items` | strings, or `{ title, description?, time?, icon?, tone?, content? }`; ISO times show in the locale | required |
| `variant` | `'dot' \| 'icon' \| 'card'` | `'dot'` |
| `orientation`, `align` | vertical (one side or `'alternate'`) or horizontal | `'vertical'`, `'start'` |
| `pending`, `reverse`, `locale` | the last event still happening; newest first | `false`, `false`, the browser's |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots as in the meta | |

## Accessibility
- An ordered list named by `label`.
- Times are `<time datetime>`, shown in the reader's locale.
- A pending event has `aria-current="step"`; markers and lines are decorative.
