# Badge: spec

Status: **experimental**. Static text; colour is never the only signal ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).

## Usage
```tsx
import { defineBadge } from '@pinfold/react/badge';

export const Status = defineBadge({ dot: true });
export const Unread = defineBadge({ tone: 'danger', variant: 'solid', srLabel: 'unread messages' });
export const Online = defineBadge({ dot: true, tone: 'success', anchorShape: 'circle', placement: 'bottom-end', srLabel: 'Online' });

<Status label="Online" tone="success" />               // ● Online
<Unread label="Inbox" count={3} />                     // Inbox 3, read "Inbox 3 unread messages"
<Unread count={120} />                                 // 99+
<Unread count={3} anchor={<Button label="Inbox" />} /> // pinned to the button's corner
<Online anchor={<Avatar name="Ada Lovelace" />} />     // a dot on the avatar's edge
```
`useBadge(config)` and `<Badge {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.badge`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node; always shown | none |
| `count` | `number`; shown after the label, as its own chip when there is one | none |
| `max` | `number`; above it shows `max+` | `99` |
| `showZero` | `boolean`; show a `count` of 0 | `false` |
| `dot` | `boolean`; a status dot before the label, or on its own | `false` |
| `icon` | node before the label, decorative | none |
| `srLabel` | `string`; read by screen readers, never shown | none |
| `anchor` | node to pin the badge to: an avatar, a button, anything | none |
| `placement` | `'top-end' \| 'top-start' \| 'bottom-end' \| 'bottom-start'` | `'top-end'` |
| `anchorShape` | `'rect' \| 'circle'`; `circle` tucks it onto a round edge | `'rect'` |
| `variant` | `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (provider) |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` (provider) |
| `radius` | `'none' \| 'sm' \| 'md' \| 'full'` | `'full'` |
| `dimensions` | `height, paddingX, gap, fontSize, dotSize` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root dot icon label count anchor`) | | |

Inactive (`inactiveBadgeOptions`): `max` and `showZero` without a `count`; `showZero` while the count is not 0; `placement` and
`anchorShape` without an `anchor`; `radius` and `variant` on a dot on its own.

## Accessibility
- A `<span>` of text: no role, not focusable, not a live region, so a changing count never
  interrupts a screen reader. Announce important changes in your own status region.
- `srLabel` is visually hidden text read after what shows. A dot on its own without one warns in
  development: it says nothing to a screen reader.
- A badge with nothing to show (a count of zero and no label) is `hidden`: neither seen nor read.
- Contrast: solid text uses the tone's on-colour; soft and outline text is the tone pulled toward
  the theme text colour (4.5:1, checked by the accessibility report in every pack, light and dark).
- A pinned badge is centred on the anchor's corner (on a circle, where the edge crosses the
  diagonal), whatever its width; it uses logical insets (flips in RTL) and ignores the pointer, so
  it never steals a click from what it is pinned to.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `variant`: default, secondary, destructive, outline | Chip `variant`, `color` | Chip `variant`, `color` | `variant` × `tone` |
| | Badge `content`, `max` | Badge `badgeContent`, `max`, `showZero` | `count`, `max`, `showZero` |
| | `isDot`, `placement`, wraps its child | `variant="dot"`, `anchorOrigin`, wraps its child | `dot`, `placement`, `anchor` as data |
| | | | `srLabel` for counts and dots |

## Deliberately excluded
- Clickable or removable badges: that is an interactive tag (the Tag group).
