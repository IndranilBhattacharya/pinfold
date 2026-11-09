# Avatar: spec

Status: **experimental**.

## Usage
```tsx
import { defineAvatar } from '@pinfold/react/avatar';

export const Person = defineAvatar();
export const Team = defineAvatar({ size: 'sm', max: 3, label: 'Project members' });

<Person name="Ada Lovelace" src={user.photo} status="online" />
<Team items={members} />          // 3 faces, then "+5"
```
`useAvatar(config)` and `<Avatar {...config} />` take the same config. `items` turns it into a group.
Precedence: use-site props, the preset, `defaults.avatar`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `name` | `string`: name, initials, `auto` colour | none |
| `src` | `string`; initials show while it loads or if it fails | none |
| `alt` | `string`, overrides the name read | `name` |
| `initials` | `string` | from `name` |
| `status` | `'online' \| 'away' \| 'busy' \| 'offline'` | none |
| `items` | `AvatarPerson[]` (the five fields above), a group | none |
| `tooltip` | `boolean`: name and status on hover and focus | on in a group, off on its own |
| `max` | `number`, group faces before "+N" (never "+1") | `4` |
| `label` | `string`, the group's name | none |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (provider) |
| `shape` | `'circle' \| 'square'` | `'circle'` |
| `tone` | `'auto'` or a tone | `'auto'` (stable per name, never danger) |
| `dimensions` | `size, fontSize, overlap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root image fallback status item overflow`) | | |

Inactive (`inactiveAvatarOptions`): `max`, `label` without `items`; the person fields with `items`; `tone` when a picture covers it; `radius` unless `shape: 'square'` (a circle has no corners).

## Accessibility
- Each face is `role="img"` named once ("Ada Lovelace, online"); the picture (`alt=""`), initials and
  dot inside are hidden, so it reads the same whether or not the image loaded.
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
| | | Badge overlap | `status` |

## Deliberately excluded
- Clickable avatars: wrap it in a button or link (or use a button with an avatar as its icon).
