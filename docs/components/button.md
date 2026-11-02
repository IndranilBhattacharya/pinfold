# Button and Spinner: spec

Status: **experimental**.
Kind: **atom**: a tag, no hooks, server-safe.
Patterns: [WAI-ARIA APG Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [`status` role](https://www.w3.org/TR/wai-aria-1.2/#status).

## Usage

```tsx
import { Button } from '@pinfold/react/button';
import { Spinner } from '@pinfold/react/spinner';

<Button onClick={save}>Save</Button>
<Button tone="danger" variant="soft" loading={busy} loadingText="Deleting">Delete</Button>
<Button icon={<TrashIcon />} aria-label="Delete" variant="ghost" />
<Button href="/docs" endIcon={<ArrowIcon />}>Docs</Button>
<Spinner />
```

Both work in Server Components as they are (no `'use client'`, no hooks). Styles:
`@pinfold/css/core.css` once, then `@pinfold/css/button.css` / `@pinfold/css/spinner.css`.

## Button config

Every option is optional. Any other attribute of `<button>` (`onClick`, `form`, `name`, `aria-*`…)
passes through, plus `target`, `rel`, `download`, `hrefLang`, `referrerPolicy`, `ping` for links.

| Key | Type | Default |
|---|---|---|
| `children` | node, the label | none |
| `variant` | `'solid' \| 'soft' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` |
| `size` | `'sm' \| 'md' \| 'lg'` | the nearest provider size (md) |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | the nearest provider tone (primary) |
| `radius` | preset (`'none' \| 'sm' \| 'md' \| 'lg' \| 'full'`) or length | the theme radius |
| `icon` / `endIcon` | node (or a string: emoji, icon-font ligature) | none |
| `loading` | `boolean`: spinner over the content, same width, `aria-busy`, activation blocked, still focusable | `false` |
| `loadingText` | `string`, the accessible name while loading | none |
| `disabled` | `boolean`: `aria-disabled`, activation blocked, still focusable | `false` |
| `fullWidth` | `boolean` | `false` |
| `href` | `string`: renders `<a>`; `target="_blank"` gets `rel="noopener noreferrer"` | none |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` (never submits a form by accident) |
| `dimensions` | `height, minWidth, paddingX, gap, radius, fontSize, iconSize` | from the size |
| `unstyled`, `className`, `style` | | |
| `classNames` / `styles` / `slotProps` / `render` | per slot: `root icon label endIcon spinner` | |

### Look
- `solid`: filled with the tone; hover moves toward the text colour (darker on light, lighter on dark).
- `soft`: a 12% tone tint. `outline`: a tone-tinted frame. `ghost`: no surface until hover. `link`:
  underlined text, no padding.
- Non-solid text is the tone pulled 18% toward the theme text colour, so it clears 4.5:1 on its own
  tint for every tone in light and dark mode (checked by the a11y report).
- An open menu trigger (`aria-expanded="true"`) looks hovered. Pressing nudges the button 1px down.
- Icon-only (an icon, no label) is square. Under `pointer: coarse` the hit area grows to 44px without
  changing the look.

### Inactive options
`inactiveButtonOptions(config)` (from `@pinfold/core`) names options with no visible effect; the
playground disables them. Dev builds warn on the static ones (`type`, `radius`).

| Option | No visible effect when |
|---|---|
| `loadingText` | `loading` is false |
| `type` | `href` is set (a link has no type) |
| `radius` | `variant: 'link'` |

### Escape hatches
Rungs 1–3 of the ladder (atoms have no parts or prop getters). `render.root` swaps the element and
keeps the behaviour props, which replaces shadcn's `asChild`:

```tsx
<Button render={{ root: ({ props, children }) => <Link {...props} href="/docs">{children}</Link> }}>Docs</Button>
```

## Spinner config

| Key | Type | Default |
|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | the nearest control size |
| `tone` | tone | the surrounding text colour |
| `label` | `string`, the accessible name; `''` makes it decorative | `'Loading'` |
| `dimensions` | `size, thickness` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slot `root`) | | |

A CSS ring (no icon, no SVG). Under `prefers-reduced-motion` it slows down instead of freezing, because
a still spinner says nothing (`data-motion="essential"` opts it out of the reset's motion kill).

## Inheritance
Unset `size` and `tone` follow the nearest `PinfoldProvider` through CSS (`data-pinfold-size` /
`data-pinfold-tone` set the shared `--pinfold-control-*` and `--pinfold-tone-*` tokens), so this works
in Server Components too. `defaults.button` in `pinfold.config` is not read; to change the default
variant app-wide, re-export a wrapped tag from `components/ui/button.tsx`.

## Compared with shadcn/ui, HeroUI and MUI

| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `variant`: default, secondary, outline, ghost, link | `variant`: solid, flat, bordered, light, ghost, faded, shadow | `variant`: contained, outlined, text | `variant`: solid, soft, outline, ghost, link |
| `variant="destructive"` | `color` | `color` | `tone` (six roles, any variant) |
| `size`: xs, sm, default, lg, icon-* | `size`, `isIconOnly` | `size` | `size`; icon-only is automatic (icon and no label) |
| `asChild` (Base UI `render`) | `as` | `component` | `render.root` |
| `disabled` (leaves the tab order) | `isDisabled` | `disabled` | `disabled` as `aria-disabled` (stays focusable) |
| | `isLoading`, `spinner` | `loading`, `loadingPosition` | `loading`, `loadingText` |
| children icons | `startContent`, `endContent` | `startIcon`, `endIcon` | `icon`, `endIcon` |
| className | `radius`, `fullWidth` | `fullWidth` | `radius`, `fullWidth`, `dimensions` |
| Spinner: lucide icon, `role="status"` | `Spinner` with variants | `CircularProgress` | `Spinner`: CSS ring, decorative mode, slows under reduced motion |

Gaps closed: shadcn's disabled button leaves the tab order and needs a separate loading pattern; no
library adds `rel="noopener noreferrer"` for you; none warns about an unlabelled icon-only button;
a type-less shadcn button inside a form submits it.

## Keyboard
| Key | Action |
|---|---|
| Enter / Space | Activate (Enter only for a link). Nothing happens while disabled or loading. |
| Tab | Disabled and loading buttons stay in the tab order. |

## ARIA
- Native `<button type="button">`, or `<a>` with `href`. A disabled link drops its `href`, gets
  `role="link"` and `tabIndex=0`.
- Disabled and loading: `aria-disabled="true"`, never `disabled`. Loading adds `aria-busy="true"`.
- Icons and the button spinner are `aria-hidden`. Icon-only needs `aria-label` (dev warning).
- Spinner: `role="status"` named by `label`; `label=""` removes the role and hides it.

## Data attributes
`data-variant`; `data-size` and `data-tone` (only when set); `data-disabled`, `data-loading`,
`data-icon-only`, `data-full-width`, `data-unstyled`.

## Playground controls
`variant`, `size`, `tone`, `radius`, `loading`, `disabled`, `fullWidth`, plus label and icon toggles.

## Deliberately excluded
- `loadingPosition` (the spinner always centres over the content, so the width never jumps).
- A `color` prop separate from `tone`, and gradient or shadow variants (style packs cover surfaces).
- Ripple effects.
- Button groups and toggle buttons: their own round (roving focus, `aria-pressed`).
