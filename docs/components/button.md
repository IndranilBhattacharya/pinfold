# Button and Spinner: spec

Status: **experimental**.
Patterns: [WAI-ARIA APG Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [`status` role](https://www.w3.org/TR/wai-aria-1.2/#status).

## Usage

```tsx
import { useButton } from '@pinfold/react/button';

const Save = useButton({
  label: 'Save changes',
  tone: 'success',
  loadingText: 'Saving…',
  onClick: async () => { await api.save(); },   // loading state while the promise runs
});
return <Save />;
```
```tsx
// Server Component: same import path, no hook, no functions in the config
import { defineButton } from '@pinfold/react/button';
const Docs = defineButton({ label: 'Read the docs', href: '/docs', variant: 'soft' });
return <Docs />;
```
```tsx
import { useSpinner } from '@pinfold/react/spinner';
const Loading = useSpinner({ label: 'Loading invoices' });
return <Loading />;
```

`<Save />` takes layout and element attributes only: `className`, `style`, `form`, `name`, `value`,
`aria-*`, `data-*`. Everything else is config. `<Button {...config} />` is the courtesy tag.

The same value is the controller: `Save.loading`, `Save.setLoading(true)`, `Save.focus()`,
`Save.click()`, `Save.getRootProps()`.

## Precedence
Every option: the config above, then `defaults.button` in `defineConfig()`, then the provider
(`size`, `tone`), then the library default. With `<PinfoldProvider size="sm">` a button is small;
`useButton({ label: 'Go', size: 'lg' })` is large. The conformance suite asserts this for every
component.

## Button config

Only `label` is required.

| Key | Type | Default |
|---|---|---|
| `label` | node or `(state) => node`: the text, and the accessible name when `iconOnly` | required |
| `iconOnly` | `boolean`: square, only the icon; `label` becomes `aria-label` and the tooltip | `false` |
| `variant` | `'solid' \| 'soft' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` |
| `radius` | preset (`'none' \| 'sm' \| 'md' \| 'lg' \| 'full'`) or length | the theme radius |
| `icon` / `endIcon` | node, `(state) => node`, or a string (emoji, icon-font ligature) | none |
| `loading` | `boolean`. Unset, an `onClick` that returns a promise drives it | `false` |
| `loadingText` | `string`, shown instead of the label while loading | none |
| `disabled` | `boolean`: `aria-disabled`, activation blocked, still focusable | `false` |
| `fullWidth` | `boolean` | `false` |
| `href`, `target`, `rel` | a link; `target: '_blank'` gets `rel="noopener noreferrer"` | none |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` (never submits a form by accident) |
| `onClick` | `(event) => unknown`; a returned promise shows the loading state until it settles | none |
| `dimensions` | `height, minWidth, paddingX, gap, radius, fontSize, iconSize` | from the size |
| `unstyled`, `className`, `style` | | |
| `classNames` / `styles` / `slotProps` / `render` | per slot: `root icon label endIcon spinner` | |

### Look
- `solid`: filled with the tone; hover moves toward the text colour (darker on light, lighter on dark).
- `soft`: a 12% tone tint. `outline`: a tone-tinted frame. `ghost`: no surface until hover. `link`:
  underlined text, no padding.
- Non-solid text is the tone pulled 18% toward the theme text colour, so it clears 4.5:1 on its own
  tint for every tone in light and dark mode (checked by the a11y report).
- **Loading:** the spinner takes the icon's place and the label stays visible (or `loadingText`
  replaces it). Activation is blocked; focus stays.
- An open menu trigger (`aria-expanded="true"`) looks hovered. Pressing nudges the button 1px down.
- Under `pointer: coarse` the hit area grows to 44px without changing the look.

### Inactive options
`inactiveButtonOptions(config)` (from `@pinfold/core`) names options with no visible effect; the
dev build warns (except `loadingText`, normally set up front) and the playground disables them.

| Option | No visible effect when |
|---|---|
| `loadingText` | `loading` is false |
| `endIcon` | `iconOnly` |
| `type` | `href` is set (a link has no type) |
| `target`, `rel` | no `href` |
| `radius` | `variant: 'link'` |

### Escape hatches
1. config; 2. `classNames` / `styles` / `slotProps` per slot; 3. `render` per slot (`render.root`
swaps the element, which replaces shadcn's `asChild`); 4. no parts (one element); 5. `getRootProps()`.

```tsx
const Docs = useButton({ label: 'Docs', href: '/docs', render: { root: ({ props, children }) => <Link {...props}>{children}</Link> } });
```

## Spinner config

| Key | Type | Default |
|---|---|---|
| `label` | `string`, the accessible name; `''` makes it decorative | `'Loading'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `tone` | a tone, or `'current'` for the surrounding text colour | `'primary'` |
| `dimensions` | `size, thickness` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slot `root`) | | |

A CSS ring (no icon, no SVG). Under `prefers-reduced-motion` it slows down instead of freezing,
because a still spinner says nothing.

## Compared with shadcn/ui, HeroUI and MUI

| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| JSX children | `children` | `children` | `label` in the config (required, so never unnamed) |
| `variant`: default, secondary, outline, ghost, link | `variant`: solid, flat, bordered, light, ghost, faded, shadow | `variant`: contained, outlined, text | `variant`: solid, soft, outline, ghost, link |
| `variant="destructive"` | `color` | `color` | `tone` (six roles, any variant) |
| `size`: xs, sm, default, lg, icon-* | `size`, `isIconOnly` | `size` | `size`, `iconOnly` |
| `asChild` (Base UI `render`) | `as` | `component` | `render.root` |
| `disabled` (leaves the tab order) | `isDisabled` | `disabled` | `disabled` as `aria-disabled` (stays focusable) |
| your own state | `isLoading`, `spinner` | `loading`, `loadingPosition` | `loading`, `loadingText`, or automatic from an async `onClick` |
| children icons | `startContent`, `endContent` | `startIcon`, `endIcon` | `icon`, `endIcon` |
| className | `radius`, `fullWidth` | `fullWidth` | `radius`, `fullWidth`, `dimensions` |
| | | | controller: `Save.setLoading()`, `Save.focus()`, `Save.click()` |
| Spinner: lucide icon | `Spinner` | `CircularProgress` | `useSpinner`: CSS ring, decorative mode, slows under reduced motion |

Gaps closed: shadcn's disabled button leaves the tab order and has no loading pattern; none of them
drives loading from an async handler; none adds `rel="noopener noreferrer"` for you; an unnamed
icon-only button is impossible here (`label` is required); a type-less shadcn button inside a form
submits it.

## Keyboard
| Key | Action |
|---|---|
| Enter / Space | Activate (Enter only for a link). Nothing happens while disabled or loading. |
| Tab | Disabled and loading buttons stay in the tab order. |

## ARIA
- Native `<button type="button">`, or `<a>` with `href`. A disabled link drops its `href`, gets
  `role="link"` and `tabIndex=0`.
- Disabled and loading: `aria-disabled="true"`, never `disabled`. Loading adds `aria-busy="true"`.
- Icons and the button's spinner are `aria-hidden`. `iconOnly` puts `label` in `aria-label` and `title`.
- Spinner: `role="status"` named by `label`; `label: ''` removes the role and hides it.

## Data attributes
`data-variant`, `data-size`, `data-tone` (always the resolved values), `data-disabled`,
`data-loading`, `data-icon-only`, `data-full-width`, `data-unstyled`.

## Playground controls
`variant`, `size`, `tone`, `radius`, `iconOnly`, `loading`, `disabled`, `fullWidth`, plus the label,
icons and an async-click demo. Environment: provider size and tone, to see precedence.

## Deliberately excluded
- `children` as the label (config is the API; `label` accepts any node).
- `loadingPosition` (the spinner always takes the icon's place).
- Gradient or shadow variants (style packs cover surfaces). Ripple effects.
- Button groups and toggle buttons: their own round (roving focus, `aria-pressed`).
