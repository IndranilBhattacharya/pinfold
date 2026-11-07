# Skeleton: spec

Status: **experimental**. Semantics: [`aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy).

## Usage
```tsx
import { defineSkeleton } from '@pinfold/react/skeleton';

export const Paragraph = defineSkeleton({ lines: 3 });
export const Avatar = defineSkeleton({ variant: 'circle', size: 'lg' });
export const Cover = defineSkeleton({ variant: 'rect', dimensions: { height: 160 } });

// A layout is one config, not several components. Items nest.
export const Profile = defineSkeleton({
  direction: 'row',
  items: [{ variant: 'circle' }, { lines: 2 }],
});

// The placeholder swaps to the content when it arrives: no conditional in your JSX.
<Paragraph loading={!user} content={<p>{user?.bio}</p>} />
```
`useSkeleton(config)` and `<Skeleton {...config} />` take the same config. Precedence: use-site
props, the preset, `defaults.skeleton`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `variant` | `'text' \| 'rect' \| 'circle'` | `'text'` |
| `lines` | `number`; the last of several is shorter, like real text | `1` |
| `items` | shapes (`variant, lines, size, dimensions`) or nested groups (`items, direction`) | none |
| `direction` | `'column' \| 'row'`, how `items` flow; in a row, circles keep their size | `'column'` |
| `animation` | `'shimmer'`: one band of light across every shape together. `'wave'`: a sweep inside each shape. `'pulse'`: a slow breath. `'stagger'`: the breath passed from shape to shape. `'none'` | `'shimmer'` |
| `size` | `'sm' \| 'md' \| 'lg'`: text line height, circle size | `'md'` |
| `loading` | `boolean`; false shows `content` | `true` |
| `content` | node, shown when not loading | none |
| `label` | `string`, announced while loading (visually hidden) | `''` |
| `dimensions` | `width, height, radius, gap` | from the size; full width |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root line`) | | |

Inactive: `lines` unless `variant: 'text'`; `animation` and `lines` once loaded; `variant` and `lines` with `items`; `direction` without them.

## Accessibility and motion
- The root is `aria-busy="true"` while loading; placeholder shapes are `aria-hidden`.
- `label` is empty by default, so a page of skeletons does not repeat "Loading"; set it on the one
  region a screen reader user should hear about.
- The shimmer is decoration: it stops under `prefers-reduced-motion` and with the provider's
  `disableAnimation`.
- The fill is a tint of the text colour and the corners follow the radius scale, so themes and style
  packs restyle it.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| a `div` you size with classes | `isLoaded`, children | `variant`: text, rectangular, rounded, circular; `animation` | `variant`, `lines`, `animation`, `size` |
| | `isLoaded` wraps children | children infer size | `loading` + `content` |
| | | | `aria-busy`, optional spoken `label` |

## Deliberately excluded
- Inferring the size from the children (unreliable before content exists; use a preset per shape).
