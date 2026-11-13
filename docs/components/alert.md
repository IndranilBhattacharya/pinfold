# Alert: spec

Status: **experimental**. Pattern: [APG alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/).

## Usage
```tsx
import { defineAlert } from '@pinfold/react/alert';

export const Problem = defineAlert({ tone: 'danger', live: 'assertive' });
export const Notice = defineAlert({ tone: 'info', dismissible: true });
export const Banner = defineAlert({ variant: 'banner', iconAlign: 'center', actionsPlacement: 'end', dismissible: true });
export const Callout = defineAlert({ variant: 'accent', iconPlacement: 'top', iconVariant: 'plain' });
export const Inline = defineAlert({ density: 'compact', variant: 'outline' });

<Problem title="Payment failed" description="Your card was declined." actions={[{ label: 'Retry', onClick: retry }]} />
<Notice title="New: dark mode" />
<Banner tone="warning" title="Maintenance tonight" description="From 22:00 UTC." actions={[{ label: 'Details' }]} />
<Alert variant="solid" tone="success" title="Deployed" icon={(s) => <Rocket />} />
<Inline tone="success" title="Saved." description="All changes are stored." />

// As a controller
const Saved = useAlert({ tone: 'success', title: 'Saved', dismissible: true });
Saved.dismissed; Saved.dismiss(); Saved.show();
```
`useAlert(config)` and `<Alert {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.alert`, the library default. An alert never takes the provider tone: its colour is
its meaning. Set your own icon per tone once with `defaults: { alert: { icons: { danger: <Siren /> } } }`.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description` | node, or `(state) => node` | none |
| `icon` | node or `(state) => node`; `false` removes it | the tone icon |
| `icons` | `{ [tone]: node }`: your icon per tone (`icon` wins) | none |
| `iconPlacement` | `'start' \| 'top' \| 'end'` | `'start'` |
| `iconAlign` | `'title' \| 'center'`: level with the title, or centred on the message | `'title'` |
| `iconVariant` | `'tile' \| 'plain' \| 'solid'` | `'tile'` |
| `tone` | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral' \| 'primary'` | `'info'` |
| `variant` | `'soft' \| 'solid' \| 'outline' \| 'accent' \| 'banner'` | `'soft'` |
| `density` | `'comfortable' \| 'compact'` (compact: title and description on one line, a bare icon) | `'comfortable'` |
| `live` | `'off' \| 'polite' \| 'assertive'` | `'off'` |
| `actions` | `ButtonConfig[]`: small, the first tinted in the alert tone, the rest quiet; on `solid`, solid neutral (each config wins) | none |
| `actionsPlacement` | `'below' \| 'end'` | `'below'` |
| `dismissible`, `dismissLabel`, `onDismiss` | a × button; the alert fades out, then is `hidden` | `false`, `'Dismiss'` |
| `dimensions` | `padding, gap, iconSize, radius` | theme |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root icon content title description actions dismiss`) | | |

Variants: `soft` a tinted box; `solid` filled in the tone with every word in the tone's on-colour;
`outline` a frame; `accent` a plain box with a coloured leading edge (a border, so nothing is
clipped); `banner` a full-width strip with no corners and a hairline below, for the top of a page.

The root carries `data-state="open" | "closing" | "closed"`: after a dismiss the exit plays for
200ms (none under `disableAnimation`), then the alert is `hidden`.

Inactive (`inactiveAlertOptions`): `dismissLabel` and `onDismiss` without `dismissible`; `icons`, `iconPlacement`,
`iconAlign`, `iconVariant` with `icon: false`; `iconAlign` with `iconPlacement: 'top'`; `actionsPlacement` without `actions`.

## Accessibility
- `live: 'off'` (default) adds no role: a message on the page from the start must not interrupt.
  `polite` gives `role="status"`, `assertive` `role="alert"`, whatever the variant or density;
  render the alert when the event happens.
- The tone icon is decorative; the title says what happened.
- The dismiss button is a real `<button>` named by `dismissLabel` (also its tooltip); a dismissed
  alert is `hidden`. Move focus somewhere sensible in `onDismiss` if the alert held it.
- Contrast is checked in every pack, light and dark, by the accessibility report; `solid` uses the
  tone's on-colour for every word.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `variant`: default, destructive | `color`, `variant` | `severity`, `variant` | `tone` × `variant` |
| children (title, description) | `title`, `description` | `AlertTitle`, children | `title`, `description` |
| | `endContent` | `action` | `actions: ButtonConfig[]`, `actionsPlacement` |
| | `icon`, `hideIcon` | `icon`, `iconMapping` | `icon`, `icons`, `iconPlacement`, `iconAlign`, `iconVariant` |
| | `isClosable`, `onClose` | `onClose` | `dismissible`, `onDismiss`, controller |
| role="alert" always | role="alert" | role="alert" | `live`: no role by default |

## Deliberately excluded
- Auto-hide timers: that is a toast.
