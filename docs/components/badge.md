# Badge: spec

Status: **experimental**. Static text; colour is never the only signal ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).

## Usage
```tsx
import { defineBadge } from '@pinfold/react/badge';

export const Status = defineBadge({ variant: 'dot' });
export const Unread = defineBadge({ tone: 'danger', variant: 'solid', srLabel: 'unread messages' });
export const Online = defineBadge({ dot: true, tone: 'success', placement: 'bottom-end', srLabel: 'Online' });
export const Filter = defineBadge({ variant: 'outline', dismissible: true });

<Status label="Online" tone="success" />                 // ● Online on a neutral chip
<Unread label="Inbox" count={3} />                       // Inbox 3, read "Inbox 3 unread messages"
<Unread count={120} />                                   // 99+
<Unread count={n} invisible={n === 0} anchor={<Button label="Inbox" iconOnly icon={<Bell />} />} />
<Online pulse anchor={<Avatar name="Ada Lovelace" />} />  // a pinging dot on the circle's edge
<Filter label="Design" onDismiss={() => remove('Design')} />
<Badge label="Ada Lovelace" avatar={<Avatar name="Ada Lovelace" />} onClick={openProfile} />
<Badge count={1234} formatCount={(n) => `${(n / 1000).toFixed(1)}k`} />   // 1.2k
```
`useBadge(config)` and `<Badge {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.badge`, the provider (size, tone), the library default. The hook's value is
also the controller: `dismissed`, `dismiss()`, `show()`.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node, or `(state) => node`; always shown | none |
| `count` | `number`; shown after the label, as its own chip when there is one | none |
| `max` | `number`; above it shows `max+` | `99` |
| `showZero` | `boolean`; show a `count` of 0 | `false` |
| `formatCount` | `(count) => node`; your own count text, replaces `max+` | none |
| `dot` | `boolean`; a status dot before the label, or on its own | `false` |
| `icon`, `endIcon` | node or `(state) => node`, before the label / after the count, decorative | none |
| `avatar` | node at the start, fitted to the badge height (`<Avatar />`, `<img>`) | none |
| `srLabel` | `string`; read by screen readers, never shown | none |
| `anchor` | node to pin the badge to: an avatar, a button, a card, anything | none |
| `placement` | `'top-end' \| 'top-start' \| 'bottom-end' \| 'bottom-start'` | `'top-end'` |
| `anchorShape` | `'auto' \| 'rect' \| 'circle'` (see "Pinned badges") | `'auto'` |
| `variant` | `'soft' \| 'solid' \| 'outline' \| 'dot'` | `'soft'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (provider) |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` (provider) |
| `radius` | `'none' \| 'sm' \| 'md' \| 'full'` | `'full'` |
| `invisible` | `boolean`; scales away (animated) and keeps its place | `false` |
| `pulse` | `boolean`; the dot pings, or a halo breathes around the badge | `false` |
| `onClick` | `(event) => void`; the content becomes a `<button>` | none |
| `href`, `target`, `rel` | the content becomes a link; `_blank` adds `noopener noreferrer` | none |
| `dismissible`, `dismissLabel`, `onDismiss` | a × button: hides the badge (animated), then calls `onDismiss(event)` | `false`, `'Remove'` |
| `dimensions` | `height, paddingX, gap, fontSize, dotSize, offset` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root action dot avatar icon label count endIcon dismiss anchor corner`) | | |

The cut-out ring around a pinned badge is the page colour; set `--pinfold-badge-cutout` when the
anchor sits on another surface.

Inactive (`inactiveBadgeOptions`): `max`, `showZero`, `formatCount` without a `count`; `showZero` while the count is not 0;
`placement` and `anchorShape` without an `anchor`; `radius` and `variant` on a dot on its own; `dismissLabel` and
`onDismiss` without `dismissible`; `target` and `rel` without `href`.

## Pinned badges
The badge is centred on a point of the anchor's edge, so a dot, a "3" and a "New" all sit on the
same spot whatever their width. The point is where the corner's curve crosses its diagonal:

- `auto` (default) reads the anchor's computed corner radius once mounted and again when it resizes,
  so the badge sits on the arc of a circular avatar, a pill button, a rounded square or a card. Radii
  larger than the box are scaled down the way CSS draws them.
- `rect` uses the bounding corner and `circle` the point 14.6% in on each axis; both are pure CSS,
  exact in server HTML before hydration.

Placements are logical and flip in RTL. `dimensions.offset` nudges the point toward the anchor's
centre (negative moves it out). The anchor wrapper is inline; give a full-width anchor
`styles: { anchor: { display: 'flex' } }`.

## Accessibility
- A `<span>` of text: no role, not focusable, not a live region, so a changing count never
  interrupts a screen reader. Announce important changes in your own status region.
- With `onClick` or `href` the content sits in a real `<button type="button">` or `<a>`, named by
  what it shows plus `srLabel` ("Inbox 3 unread"); its hit area and focus ring cover the whole pill.
- The × button is a real button named by `dismissLabel` and the label: "Remove Design". Move focus
  somewhere sensible in `onDismiss` if the badge held it.
- `srLabel` is visually hidden text read after what shows. A dot on its own without one warns in
  development: it says nothing to a screen reader.
- A badge with nothing to show is `hidden` in the text flow; pinned, it fades away. An `invisible`
  badge is `aria-hidden` and its buttons leave the tab order.
- Contrast: solid text uses the tone's on-colour; soft and outline text is the tone pulled toward
  the theme text colour; the `dot` variant keeps the theme text colour.
- A pinned badge ignores the pointer unless it is clickable or dismissible, so it never steals a
  click from what it is pinned to. `pulse` stops under reduced motion.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `variant`: default, secondary, destructive, outline | Chip `variant`, `color` | Chip `variant`, `color` | `variant` × `tone` |
| | Badge `content`, `max` | Badge `badgeContent`, `max`, `showZero` | `count`, `max`, `showZero` |
| | `isDot`, `placement`, `shape`, wraps its child | `variant="dot"`, `anchorOrigin`, `overlap`, wraps its child | `dot`, `placement`, `anchor` as data, `anchorShape: 'auto'` reads the real radius |
| | Chip `onClose`, `avatar`, `startContent` | Chip `onDelete`, `avatar`, `clickable` | `dismissible`, `avatar`, `icon`, `endIcon`, `onClick`, `href` |
| | `isInvisible` | `invisible` | `invisible`, animated; `pulse` |
| | | | `srLabel` for counts and dots |

## Deliberately excluded
- Selection and keyboard navigation across many chips: that is an interactive tag group (`tags`).
