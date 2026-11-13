# Avatar: spec

Status: **experimental**.

## Usage
```tsx
import { defineAvatar } from '@pinfold/react/avatar';

export const Person = defineAvatar();
export const Team = defineAvatar({ size: 'sm', max: 3, label: 'Project members', expandOnHover: true });
export const App = defineAvatar({ shape: 'rounded', ring: 'primary' });

<Person name="Ada Lovelace" src={user.photo} status="online" />
<Person name="Ada Lovelace" size={72} ring onClick={openProfile} />   // a button with a focus ring
<App name="Acme" status="busy" statusPlacement="top-end" />
<Person fallback={<BotIcon />} alt="Build bot" />                       // your own fallback
<Team items={members} />                                               // 3 faces, then "+5"
<Team items={members} surplus={({ count }) => `${count} more`} />
```
`useAvatar(config)` and `<Avatar {...config} />` take the same config. `items` turns it into a group.
Precedence: use-site props, the preset, `defaults.avatar`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `name` | `string`: name, initials, `auto` colour | none |
| `src` | `string`; the fallback shows while it loads or if it fails | none |
| `alt` | `string`, overrides the name read | `name` |
| `initials` | `string` | from `name` |
| `status` | `'online' \| 'away' \| 'busy' \| 'offline'` | none |
| `colorFrom` | `string`: what the `auto` colour is worked out from (a user id) | `name` |
| `href`, `onClick` | the face becomes a link or a button | none |
| `items` | `AvatarPerson[]` (the eight fields above), a group | none |
| `tooltip` | `boolean`: name and status on hover and focus | on in a group, off on its own |
| `max` | `number`, group faces before "+N" (never "+1") | `4` |
| `surplus` | `({ count, hidden }) => node`: your own "+N" content | none |
| `expandOnHover` | `boolean`: a group spreads apart under the pointer or focus | `false` |
| `label` | `string`, the group's name | none |
| `fallback` | node or `(state) => node`: replaces the initials and the icon | none |
| `icon` | node shown with no picture and no initials | a person glyph |
| `onLoadingStatusChange` | `(status: 'loading' \| 'loaded' \| 'error') => void` | none |
| `ring` | `boolean \| 'auto' \| tone`: a ring with a gap in the page colour, `true` in the face's colour | `false` |
| `statusPlacement` | `'bottom-end' \| 'top-end' \| 'bottom-start' \| 'top-start'` | `'bottom-end'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales the corners, a length sets them | the theme radius |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` or a length (`72` is px) | `'md'` (provider) |
| `shape` | `'circle' \| 'rounded' \| 'square'` | `'circle'` |
| `tone` | `'auto'` or a tone | `'auto'` (stable per name, never danger) |
| `dimensions` | `size, fontSize, overlap, statusSize, ringWidth` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root image fallback status item overflow`) | | |

The fallback chain: the picture, then `fallback`, then the initials, then `icon`. The fallback slot
says which one shows with `data-fallback="custom" | "initials" | "icon"`.

The presence dot is centred on the shape's edge, where the corner's curve crosses its diagonal: 14.6%
in on a circle, closer to the corner on `rounded` and `square`, so it hugs every shape and every
style pack's radius. Placements are logical and flip in RTL.

Inactive (`inactiveAvatarOptions`): `max`, `label`, `surplus`, `expandOnHover` without `items`; the person fields with
`items`; `statusPlacement` without a `status`; `tone` when a picture covers it; `radius` on a circle.

## Accessibility
- Each face is `role="img"` named once ("Ada Lovelace, online"); the picture (`alt=""`), fallback and
  dot inside are hidden, so it reads the same whether or not the image loaded.
- With `onClick` or `href` a face is a real `<button type="button">` or `<a>` with the same name and
  a focus ring; in a group, set them per person.
- No name: decorative (`aria-hidden`), with a development warning.
- A group is `role="group"` named by `label`; "+N" reads "N more" and its tooltip lists the hidden names.
- With `tooltip` each face takes keyboard focus, so the tooltip works without a pointer.
- An image that failed before hydration is detected on mount: no broken-image icon.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `AvatarImage` + `AvatarFallback` | `src`, `name`, `fallback` | `src`, `alt`, children | `src`, `name`, `initials` |
| | `AvatarGroup max` | `AvatarGroup max` | `items`, `max`, `label` |
| | `color` | | `tone: 'auto'` per name |
| | `isBordered`, `color` | Badge overlap | `ring`, `status`, `statusPlacement` |
| | `fallback`, `icon`, `showFallback` | children fallback | `fallback`, `icon`, `onLoadingStatusChange` |
| | `AvatarGroup renderCount`, `isGrid` | `AvatarGroup renderSurplus` | `surplus`, `expandOnHover` |

## Deliberately excluded
- A grid layout for groups: lay faces out yourself with single avatars.
