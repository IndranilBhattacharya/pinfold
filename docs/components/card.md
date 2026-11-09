# Card: spec

Status: **experimental**. Pattern: [Inclusive Components: cards](https://inclusive-components.design/cards/).

## Usage
```tsx
import { defineCard } from '@pinfold/react/card';

export const Plan = defineCard({ variant: 'elevated', as: 'article' });
export const Post = defineCard({ orientation: 'horizontal', headingLevel: 2 });

<Plan title="Pro" description="For growing teams" content={<Price amount={29} />} actions={[{ label: 'Upgrade', onClick: upgrade }]} />
{posts.map((p) => <Post key={p.id} title={p.title} description={p.excerpt} href={p.url} image={{ src: p.cover, alt: '' }} />)}
```
`useCard(config)` and `<Card {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.card`, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description`, `content` | node | none |
| `image` | `{ src, alt }`; `alt` required (`''` for decoration) | none |
| `actions` | `ButtonConfig[]`: small, first solid, rest outline (each config wins) | none |
| `href`, `target`, `rel` | the whole card is a link through its title; `_blank` adds `noopener noreferrer` | none |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `3` |
| `as` | `'div' \| 'article' \| 'section' \| 'li'` | `'div'` |
| `variant` | `'outline' \| 'elevated' \| 'filled' \| 'ghost'` | `'outline'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` |
| `orientation` | `'vertical' \| 'horizontal'`; horizontal wraps when narrower than ~30rem | `'vertical'` |
| `dimensions` | `padding, gap, radius, mediaSize` | theme |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame (`dimensions.radius` wins) | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root media body title description content actions`) | | |

Inactive (`inactiveCardOptions`): `target`, `rel` without `href`; `href` without a `title`;
`orientation` without an `image`.

## Accessibility
- The title is a real heading, so cards appear in the page outline.
- A linked card is not one giant link: only the title is the `<a>` (read as the title alone) and a
  pseudo-element stretches its hit area. Action buttons sit above it and stay separately focusable.
- The focus ring is drawn inside the card's edge, so its rounded clipping never cuts it off.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `CardHeader/Title/Description/Content/Footer` | `CardHeader/Body/Footer` | `CardHeader/Media/Content/Actions` | `title`, `description`, `content`, `image`, `actions` |
| | `isPressable` (whole card a button) | `CardActionArea` | `href` (title link, stretched) |
| | `shadow`, `radius` | `variant`, `elevation` | `variant`, `padding` |

## Deliberately excluded
- A whole-card button (`isPressable`): nested buttons inside a button are invalid. Use `href`, or an action.
