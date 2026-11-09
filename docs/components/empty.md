# Empty: spec

Status: **experimental**. Pattern: a section with a real heading.

## Usage
```tsx
import { defineEmpty } from '@pinfold/react/empty';

export const NoResults = defineEmpty({ variant: 'dashed' });

<NoResults title="No results" description="Try fewer filters." actions={[{ label: 'Clear filters', onClick: clear }]} />
```
Precedence: use-site props, the preset, `defaults.empty`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description` | what is missing; what to do | required |
| `media` | an icon or picture (decorative); `null` for none | a tray icon |
| `actions` | Button configs; the first is the main one | none |
| `headingLevel` | 2 to 6, to fit the page outline | `3` |
| `variant`, `size`, `tone` | `'plain' \| 'dashed' \| 'card'` | `'plain'`, `'md'`, `'primary'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots as in the meta | |

## Accessibility
- The title is a real heading, so the state is found in the outline; the media is decorative.
- Actions are Pinfold buttons.
