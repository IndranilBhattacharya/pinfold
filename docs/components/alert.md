# Alert: spec

Status: **experimental**. Pattern: [APG alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/).

## Usage
```tsx
import { defineAlert } from '@pinfold/react/alert';

export const Problem = defineAlert({ tone: 'danger', live: 'assertive' });
export const Notice = defineAlert({ tone: 'info', dismissible: true });

<Problem title="Payment failed" description="Your card was declined." actions={[{ label: 'Retry', onClick: retry }]} />
<Notice title="New: dark mode" />

// As a controller
const Saved = useAlert({ tone: 'success', title: 'Saved', dismissible: true });
Saved.dismissed; Saved.dismiss(); Saved.show();
```
`useAlert(config)` and `<Alert {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.alert`, the library default. An alert never takes the provider tone: its colour is
its meaning.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description` | node | none |
| `icon` | node; `false` removes it | the tone icon |
| `tone` | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral' \| 'primary'` | `'info'` |
| `variant` | `'soft' \| 'outline' \| 'accent'` | `'soft'` |
| `live` | `'off' \| 'polite' \| 'assertive'` | `'off'` |
| `actions` | `ButtonConfig[]`: small, alert tone, first solid, rest ghost (each config wins) | none |
| `dismissible`, `dismissLabel`, `onDismiss` | dismiss button | `false`, `'Dismiss'` |
| `dimensions` | `padding, gap, iconSize, radius` | theme |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root icon content title description actions dismiss`) | | |

Inactive (`inactiveAlertOptions`): `dismissLabel` and `onDismiss` without `dismissible`.

## Accessibility
- `live: 'off'` (default) adds no role: a message on the page from the start must not interrupt.
  `polite` gives `role="status"`, `assertive` `role="alert"`; render the alert when the event happens.
- The tone icon is decorative; the title says what happened.
- The dismiss button is a real button named by `dismissLabel`; a dismissed alert is `hidden`. Move
  focus somewhere sensible in `onDismiss` if the alert held it.
- Contrast is checked in every pack, light and dark, by the accessibility report.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `variant`: default, destructive | `color`, `variant` | `severity`, `variant` | `tone` × `variant` |
| children (title, description) | `title`, `description` | `AlertTitle`, children | `title`, `description` |
| | `endContent` | `action` | `actions: ButtonConfig[]` |
| | `isClosable`, `onClose` | `onClose` | `dismissible`, `onDismiss`, controller |
| role="alert" always | role="alert" | role="alert" | `live`: no role by default |

## Deliberately excluded
- A solid variant: the body text on a saturated fill fails contrast for some tones.
- Auto-hide timers: that is a toast (planned).
