# Card: spec

Status: **experimental**. Pattern: [Inclusive Components: cards](https://inclusive-components.design/cards/).

## Usage
```tsx
import { defineCard } from '@pinfold/react/card';

export const Plan = defineCard({ variant: 'elevated', as: 'article' });
export const Post = defineCard({ orientation: 'horizontal', headingLevel: 2, hoverEffect: 'zoom' });

<Plan title="Pro" description="For growing teams" content={<Price amount={29} />} actions={[{ label: 'Upgrade', onClick: upgrade }]} />
{posts.map((p) => <Post key={p.id} title={p.title} description={p.excerpt} href={p.url} image={{ src: p.cover, alt: '' }} />)}
```

A header with an avatar and a menu, a footer note and buttons:
```tsx
<Card
  avatar={<Avatar name="Ada Lovelace" size="sm" />}
  title="Ada Lovelace"
  subtitle="2 hours ago"
  headerAction={<Button label="More" iconOnly icon={<Dots />} variant="ghost" size="sm" />}
  description="Shipped the new billing page."
  footer="3 comments"
  actions={[{ label: 'Reply' }, { label: 'Share' }]}
  actionsAlign="end"
  onAction={(action) => track(action.label)}
/>
```

A stat card:
```tsx
const Stat = defineCard({ padding: 'sm' });
<Stat eyebrow="Revenue" title="$48,210" subtitle="This month" headerAction={<Badge label="+12%" tone="success" />} footer="vs. $42,980 last month" />
```

Pricing as radio cards (one form field, arrow keys between them):
```tsx
const Tier = defineCard({ selectable: 'radio', name: 'plan', dividers: true, actionsAlign: 'stretch' });
<Tier value="pro" eyebrow="PRO" title="$29 / mo" description="For growing teams" ribbon="Popular"
  content={<ul>…</ul>} selected={plan === 'pro'} onSelectedChange={() => setPlan('pro')} />
```

Cover media, the whole card a button:
```tsx
<Card mediaPosition="cover" image={{ src: trip.photo, alt: '' }} eyebrow="Iceland" title="Ring Road in 10 days"
  subtitle="From $2,400" badge={<Badge label="New" variant="solid" />} onPress={() => open(trip)} />
```

`useCard(config)` and `<Card {...config} />` take the same config; on the tag, `children` is the
same as `content`. The hook's value is also the controller (`selected`, `setSelected()`).
Precedence: use-site props, the preset, `defaults.card`, the library default (a card never takes
the provider tone).

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description` | node, or `(state) => node` | none |
| `eyebrow`, `subtitle` | node: a small label above the title, a muted line under it | none |
| `avatar`, `headerAction` | node: before the title, at the end of the header (stays clickable) | none |
| `content` | node (`children` on the tag) | none |
| `footer` | node: the bottom row, before the actions | none |
| `image` | `{ src, alt }`; `alt` required (`''` for decoration) | none |
| `media` | node or `(state) => node`: a video, an illustration; wins over `image` | none |
| `mediaPosition` | `'top' \| 'bottom' \| 'start' \| 'end' \| 'cover'` | `top`, `start` when horizontal |
| `mediaRatio` | aspect ratio, `1.78` or `'16 / 9'` | the media's own |
| `scrim` | `'gradient' \| 'full' \| 'none'`, cover media only | `'gradient'` |
| `badge` | node pinned in the top-end corner | none |
| `ribbon` | node on a diagonal ribbon across the top-end corner, in the tone | none |
| `actions` | `ButtonConfig[]`: small, first solid, rest outline (each config wins) | none |
| `actionsAlign` | `'start' \| 'end' \| 'stretch' \| 'between'` | `'start'` |
| `onAction` | `(action, index, event) => void`, after the action's own `onClick` | none |
| `dividers` | `boolean`: hairlines under the header and above the footer | `false` |
| `href`, `target`, `rel` | the whole card is a link through its title; `_blank` adds `noopener noreferrer` | none |
| `pressable`, `onPress` | the whole card is a button through its title (`onPress` alone is enough) | `false` |
| `label` | accessible name of the link, button or checkbox when there is no title | none |
| `selectable` | `boolean \| 'checkbox' \| 'radio'` (`true` is a checkbox) | `false` |
| `selected`, `defaultSelected`, `onSelectedChange` | `(selected, event) => void` | uncontrolled, `false` |
| `name`, `value` | form field of a selectable card | none |
| `hoverEffect` | `'auto' \| 'none' \| 'lift' \| 'glow' \| 'border' \| 'zoom'`; `auto` lifts an interactive card | `'auto'` |
| `loading` | `boolean`: placeholder bars and `aria-busy` | `false` |
| `disabled` | `boolean`: dims it and blocks its press, link, selection and buttons | `false` |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `3` |
| `as` | `'div' \| 'article' \| 'section' \| 'li'` | `'div'` |
| `variant` | `'outline' \| 'elevated' \| 'filled' \| 'soft' \| 'ghost' \| 'glass'` | `'outline'` |
| `tone` | a tone: the `soft` tint, the ribbon, the glow and the selection | `'primary'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` |
| `orientation` | `'vertical' \| 'horizontal'`; same as `mediaPosition` top / start; horizontal wraps under ~30rem | `'vertical'` |
| `dimensions` | `padding, gap, radius, mediaSize, headerGap` | theme |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame (`dimensions.radius` wins) | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root media image body header avatar eyebrow title subtitle headerAction description content footer actions badge ribbon select indicator placeholder`) | | |

Every part is a slot, so `render` replaces any section (`render.footer`, `render.header`) and
`classNames` / `styles` reach each one. One control per card: a selection wins over a link, a link
over a press. A selection mark moves to the bottom when there is a `badge`, and before the header
when there is a `ribbon`.

Inactive (`inactiveCardOptions`): `target`, `rel` without `href`; `href`, `pressable` or `onPress` without a title or
`label` (or when the card is already another control); the selection options without `selectable`;
`orientation`, `mediaPosition`, `mediaRatio` without media; `scrim` unless the media is a cover; `actionsAlign`,
`onAction` without `actions`; `hoverEffect: 'zoom'` without media.

## Accessibility
- The title is a real heading, so cards appear in the page outline.
- A linked or pressable card is not one giant control: only the title is the `<a>` or
  `<button type="button">` (read as the title alone) and a pseudo-element stretches its hit area.
  Action buttons, the header action and links or buttons inside `content` sit above it and stay
  separately focusable. Tab: the card is one stop, then each button.
- A selectable card is a native checkbox or radio covering the card, labelled by the title and
  described by the description, so it submits with a form and radio cards that share a `name` move
  with the arrow keys. An uncontrolled radio card also notices when another card in its group is
  chosen, so `selected` and `data-selected` always match what is checked.
- Disabled: the link or button gets `aria-disabled` and stays focusable; a selection input is
  `disabled` (a native form field), and the action buttons are `aria-disabled`.
- A loading card has `aria-busy="true"`; its placeholder bars are hidden from assistive tech.
- The focus ring is drawn around the whole card: the card never clips itself (the media clips
  its own corners), so nothing cuts the ring off.
- Cover media keeps text readable with a scrim; with `scrim: 'none'` the image must do that itself.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `CardHeader/Title/Description/Content/Footer` | `CardHeader/Body/Footer` | `CardHeader/Media/Content/Actions` | `title`, `description`, `content`, `image`, `actions` |
| | `isPressable` (whole card a button) | `CardActionArea` | `href` or `onPress` (title link or button, stretched; inner buttons still work) |
| | | | `selectable` checkbox and radio cards, `loading`, `disabled`, `hoverEffect` |
| | `CardHeader` | `CardHeader avatar, action, subheader` | `avatar`, `eyebrow`, `subtitle`, `headerAction` |
| | `shadow`, `radius`, `isBlurred` | `variant`, `elevation` | `variant` (incl. `soft`, `glass`), `tone`, `padding` |

## Deliberately excluded
- A whole-card `<button>` wrapping the content: nested buttons inside a button are invalid. The title is the button instead, stretched over the card.
