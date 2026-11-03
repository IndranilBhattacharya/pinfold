# Badge: spec

Status: **experimental**. Static text; colour is never the only signal ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).

## Usage
```tsx
import { defineBadge } from '@pinfold/react/badge';

export const Status = defineBadge({ variant: 'soft' });
export const Unread = defineBadge({ tone: 'danger', label: 'unread messages' });
export const Online = defineBadge({ dot: true, tone: 'success', placement: 'bottom-end', label: 'Online' });

<Status label="Beta" tone="info" />
<Unread count={inbox.length} />   // "3", read as "3 unread messages"; 120 shows "99+"; 0 hides it

// On a corner of anything positioned: an icon button, an avatar.
<span style={{ position: 'relative', display: 'inline-flex' }}>
  <Avatar />
  <Online />
</span>
```
`useBadge(config)` and `<Badge {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.badge`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node. Shown; with `count` or `dot` it is read, not shown | none |
| `count` | `number`, shown instead of the label | none |
| `max` | `number`; above it shows `max+` | `99` |
| `showZero` | `boolean`; keep `count: 0` visible | `false` |
| `dot` | `boolean`; a small dot only | `false` |
| `icon` | node before the text, decorative | none |
| `variant` | `'solid' \| 'soft' \| 'outline'` | `'solid'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (provider) |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` (provider) |
| `radius` | `'none' \| 'sm' \| 'md' \| 'full'` | `'full'` |
| `placement` | `'inline' \| 'top-end' \| 'top-start' \| 'bottom-end' \| 'bottom-start'` | `'inline'` |
| `dimensions` | `height, paddingX, gap, fontSize, dotSize` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root icon label`) | | |

Inactive (`inactiveBadgeOptions`): `max` and `showZero` without a `count` or with `dot`;
`icon` and `radius` with `dot`.

## Accessibility
- A `<span>` of text: no role, not focusable, not a live region, so a changing count never
  interrupts a screen reader. Announce important changes in your own status region.
- With `count` or `dot`, `label` is visually hidden text after the number ("3 unread messages",
  "Online"). A dot without a label warns in development: it says nothing to a screen reader.
- `count: 0` sets `hidden`: neither seen nor read.
- Contrast: solid text uses the tone's on-colour; soft and outline text is the tone pulled toward
  the theme text colour (4.5:1, checked by the accessibility report in every pack, light and dark).
- Forced colours: a system-colour border; a dot is drawn in `CanvasText`.
- A placed badge is centred on the corner with a ring in the page colour, uses logical insets (flips
  in RTL) and ignores the pointer, so it never steals a click from the button under it.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `variant`: default, secondary, destructive, outline, ghost, link | Chip `variant`, `color` | Chip `variant`, `color` | `variant` × `tone` |
| | Badge `content`, `max` | Badge `badgeContent`, `max`, `showZero`, `invisible` | `count`, `max`, `showZero` |
| | `isDot`, `placement` | `variant="dot"`, `anchorOrigin`, wraps its child | `dot`, `placement` on the nearest positioned parent |
| | | | spoken `label` for counts and dots |

## Deliberately excluded
- Clickable or removable badges: that is an interactive tag (planned as Tag group).
- Wrapping the anchor element (MUI): the badge stays one element you place in any positioned
  parent, so it works with any component and in Server Components.
- `ghost` / `link` variants: a badge with no surface is just text.
