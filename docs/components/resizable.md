# Resizable: spec

Status: **experimental**. Pattern: [APG window splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/).

## Usage
```tsx
import { defineResizable } from '@pinfold/react/resizable';

export const Workspace = defineResizable({ handle: 'grip' });

<Workspace label="Editor" autoSaveId="editor" panels={[
  { id: 'files', label: 'Files', defaultSize: 25, min: 15, content: <Files /> },
  { id: 'code', label: 'Code', content: <Code /> },
]} />
```
Sizes are percents. A handle moves space only between its two neighbours, each held within its min
and max. With `autoSaveId`, sizes are kept in this browser (loaded after the first paint, so server
HTML always shows the defaults).

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `panels` | names it; `{ id, content, label?, defaultSize?, min?, max? }` | required |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `sizes`, `onResize`, `autoSaveId` | controlled sizes; while moving; kept per browser | defaults |
| `handle`, `step` | `'line' \| 'grip'`; percent per arrow key | `'line'`, `5` |
| `size`, `tone` | | `'md'`, `'primary'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root panel handle grip` | |

Controller: `sizes`, `setSizes(sizes)`, `reset()`.

## Accessibility
- Each handle is a focusable `separator` named "Resize <panel>" with its value, min and max and
  `aria-controls`; arrows move it (left and right follow the reading direction), Home and End go
  to the limits, a double click restores the default.
- Labelled panels are regions.
