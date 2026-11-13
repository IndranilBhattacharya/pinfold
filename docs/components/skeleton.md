# Skeleton: spec

Status: **experimental**. Semantics: [`aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy).

## Usage
```tsx
import { defineSkeleton } from '@pinfold/react/skeleton';

export const Paragraph = defineSkeleton({ lines: 3, lastLine: '40%' });
export const Avatar = defineSkeleton({ variant: 'circle', size: 'lg' });
export const Cover = defineSkeleton({ variant: 'rect', ratio: '16/9' });

// Ready-made layouts, tuned with rows / columns / count.
export const Cards = defineSkeleton({ preset: 'card', count: 3, columns: 3 });
export const Orders = defineSkeleton({ preset: 'table', rows: 8, columns: 5 });

// Any layout as data.
export const Post = defineSkeleton({
  layout: [
    { row: [{ circle: 40 }, { stack: [{ line: '40%' }, { line: '25%' }] }] },
    { rect: true, ratio: '16/9' },
    { text: 3, last: '45%' },
    { row: [{ pill: 80 }, { space: true }, { pill: 80 }] },
  ],
});

// The placeholder swaps to the content when it arrives: no conditional in your JSX.
<Paragraph loading={!user} content={<p>{user?.bio}</p>} />
<Orders loading={!rows}><OrdersTable rows={rows} /></Orders>   // children work too
```
`useSkeleton(config)` and `<Skeleton {...config} />` take the same config. Precedence: use-site
props, the preset, `defaults.skeleton`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `variant` | `'text' \| 'rect' \| 'circle' \| 'pill' \| 'square'` | `'text'` |
| `lines` | `number`; the last of several is shorter, like real text | `1` |
| `lastLine` | length, the width of that last line | `'62%'` |
| `ratio` | `'16/9'` or `1.78`: aspect ratio of a rect, square or circle; replaces the height | none |
| `preset` | `'text' \| 'avatar-text' \| 'card' \| 'list' \| 'table' \| 'form' \| 'sidebar' \| 'tabs' \| 'article' \| 'dashboard' \| 'profile'` | none |
| `rows` | rows inside a preset (see below) | per preset |
| `columns` | columns of a preset, or of the grid of copies | per preset |
| `count` | copies of the preset or shape, laid out in `columns` | `1` |
| `layout` | any layout as data (see below) | none |
| `items`, `direction` | the earlier layout form: shapes (`variant, lines, size, dimensions`) or groups (`items, direction`) | none, `'column'` |
| `animation` | `'shimmer'`: one band of light across every shape together. `'wave'`: a sweep inside each shape. `'pulse'`: a slow breath. `'stagger'`: the breath passed from shape to shape. `'none'` | `'shimmer'` |
| `size` | `'sm' \| 'md' \| 'lg'`: text line height, circle, square and pill size | `'md'` |
| `loading` | `boolean`; false shows `content` | `true` |
| `content` | node, shown when not loading; on the tag, `children` too | none |
| `label` | `string`, announced once while loading (one visually hidden status) | `''` |
| `dimensions` | `width, height, radius, gap` | from the size; full width |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root line shape`) | | |

Shapes: `pill` is a button or chip placeholder (6rem by default, the control height of the size),
`square` an icon or thumbnail (the circle's size, rounded corners).

### Presets
| Preset | What it draws | `rows` (default) | `columns` (default) |
|---|---|---|---|
| `text` | a paragraph | lines (3) | |
| `avatar-text` | a circle beside a name and a line | | |
| `card` | a framed card: 16/9 media, a title, two lines, a button and two avatars | | |
| `list` | rows of avatar, two lines and a trailing pill | items (4) | |
| `table` | a framed table: a header and rows of varied cells | rows (5) | cells (4) |
| `form` | labelled fields and two buttons | fields (3) | |
| `sidebar` | a side nav: brand, entries with icons, a section | entries (6) | |
| `tabs` | a tab row, a rule and a paragraph | tabs (4) | |
| `article` | a headline, a byline, a 21/9 cover and paragraphs | first paragraph lines (4) | |
| `dashboard` | a side nav beside a header, stat tiles, a chart block and a table | table rows (4) | tiles (4) |
| `profile` | a centred avatar, name, subtitle, three stats and a bio | bio lines (3) | |

`count` repeats the whole preset in a grid of `columns` (for `table` and `dashboard`, whose columns
are their own, the copies stack). Line widths vary in a fixed pattern, so server and client agree.

### Layout as data
`layout` is an array of nodes. Each node is a plain object with **one** shape key and any options;
`true` takes the size preset's default, numbers are px.

| Shape | Value | Draws |
|---|---|---|
| `line` | `true` or a width (`'60%'`, `120`) | one text line |
| `text` | number of lines | a paragraph, the last line shorter (`last`) |
| `circle`, `square` | `true` or a diameter / side | an avatar, an icon |
| `rect` | `true` (6rem) or a height | a block: media, a chart, an input |
| `pill` | `true` (6rem) or a width | a button, a chip |
| `space` | `true` (takes the free room) or a length | a gap, or a push to the end of a row |
| `row`, `stack`, `grid` | an array of nodes | a horizontal, vertical or grid group |
| `preset` | a preset name, with `rows`, `columns`, `count` | a whole preset, embedded |

| Option | Applies to | Effect |
|---|---|---|
| `width`, `height` | any | the node's size; in a row, a node with a `width` keeps it |
| `ratio` | `rect`, `square`, `circle` | aspect ratio, replaces the height |
| `radius` | shapes | corner radius |
| `gap` | groups, `text` | space between children or lines |
| `align` | groups | `'start' \| 'center' \| 'end' \| 'stretch'` (a centred stack centres its rows and lines too) |
| `frame` | groups | draw the group as a card (border, radius, padding, surface) |
| `columns` | `grid` | number of columns (2) |
| `grow` | any in a row | take the free room |
| `repeat` | any | repeat the node, e.g. five list rows |
| `last` | `text` | width of the last line |

In a row, circles, squares, pills and sized nodes keep their size and the rest share the room.
In development the layout is checked (`validateSkeletonLayout` in core): an unknown key, a node
with no shape or with two, a wrong value or an unknown preset is a console warning naming the path
(`layout[2].row[0]`), and that node is skipped. The same grammar is available framework-free:
`normalizeSkeletonLayout(layout)` and `skeletonPreset(name, { rows, columns, count })` in
`@pinfold/core`, so a preset can be read, extended and passed back as `layout`.

Inactive (`inactiveSkeletonOptions`): `lines` and `lastLine` unless `variant: 'text'`; `ratio` on
text; `animation` and `lines` once loaded; `variant`, `lines`, `lastLine`, `ratio`, `items` and
`direction` with a `layout` or a `preset`; `preset`, `rows` and `columns` with a `layout`; `rows`
and `columns` without a preset; `direction` without `items`.

## Accessibility and motion
- The root is `aria-busy="true"` while loading; every painted shape is `aria-hidden`, and the shape
  wrappers carry no role, so nothing is read per shape.
- `label` is empty by default, so a page of skeletons does not repeat "Loading"; set it on the one
  region a screen reader user should hear about. It is one visually hidden `role="status"`.
- The motion is decoration: it stops under `prefers-reduced-motion` and with the provider's
  `disableAnimation`. The wave runs the other way in RTL.
- The fill is a tint of the text colour and the corners follow the radius scale, so themes and style
  packs restyle it. Framed groups use the border and surface tokens. Forced colours paint the
  shapes in `GrayText`.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| a `div` you size with classes | `isLoaded`, children | `variant`: text, rectangular, rounded, circular; `animation` | `variant` (+ pill, square), `lines`, `lastLine`, `ratio`, `animation`, `size` |
| | `isLoaded` wraps children | children infer size | `loading` + `content` (or children) |
| compose divs by hand | compose by hand | compose by hand | `preset` (11 layouts) and `layout` as JSON |
| | | | `aria-busy`, one optional spoken `label` |

## Deliberately excluded
- Inferring the size from the children (unreliable before content exists; use a preset or a layout).
