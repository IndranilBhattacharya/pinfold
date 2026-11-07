# Toast: spec

Status: **experimental**. Meets [WCAG 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) and [4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## Usage
```tsx
'use client';
import { defineToast } from '@pinfold/react/toast';

export const Toasts = defineToast({ placement: 'bottom-end' });

<Toasts />                                            // once, near the root

Toasts.show({ title: 'Saved', tone: 'success' });     // anywhere, also outside React
Toasts.show({ title: 'Upload failed', tone: 'danger', action: { label: 'Retry', onClick: retry } });

// Update in place
Toasts.show({ id: 'save', title: 'Saving…', duration: 0 });
Toasts.show({ id: 'save', title: 'Saved', tone: 'success' });
```
`useToast(config)` gives a region and controller local to one component; `<Toast store={store} />`
takes a store from `createToastStore()`. Precedence: use-site props, the preset, `defaults.toast`,
the library default.

## Config (the region)
| Key | Type | Default |
|---|---|---|
| `placement` | `'top-start' \| 'top' \| 'top-end' \| 'bottom-start' \| 'bottom' \| 'bottom-end'` | `'bottom-end'` |
| `duration` | `number`, ms | `5000` |
| `max` | `number` on screen at once; the rest wait | `5` |
| `stack` | `boolean`: piled behind the newest; hover or focus fans them out | `true` |
| `visible` | `number` shown at full size when fanned out; more scroll, with no scrollbar | `3` |
| `label` | `string`, the region's name | `'Notifications'` |
| `dismissLabel` | `string` | `'Dismiss'` |
| `store` | from `createToastStore()` | its own |
| `dimensions` | `width, gap, inset` | `22rem`, theme |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list item icon content title description action dismiss`) | | |

## A message (`show()`)
| Key | Type | Default |
|---|---|---|
| `id` | `string`; the same id updates in place | generated |
| `title`, `description` | node | none |
| `tone` | a tone | `'neutral'` |
| `icon` | node; `false` removes it | the tone icon |
| `duration` | `number`, ms; 0 stays | the region's; stays for an error or a toast with an action |
| `action` | `ButtonConfig`; closes the toast unless `onClick` returns `false` | none |
| `dismissible` | `boolean` | `true` |
| `onDismiss` | function | none |

Controller: `show()`, `dismiss(id)`, `clear()`.

Piled, the cards behind the newest move onto it, a little smaller, peeking out at the far edge, their
text faded; hover or focus inside fans them out, and the list scrolls past `visible`. A toast that
leaves fades toward the edge while its space closes, so the others glide into place.

## Accessibility
- A leaving toast is `aria-hidden` and has no role for its exit animation.
- Focus inside fans the pile out, so the keyboard reaches every toast's buttons.
- The region is a named landmark and a polite live region, there from the first render so
  announcements are reliable; an error is `role="alert"`.
- Timers stop while the pointer or focus is inside, and while the tab is hidden. A toast waiting in
  the queue has not started counting.
- Errors and toasts with an action stay until dismissed: an action must not vanish first.
- Escape with focus inside a toast dismisses it.
- While a modal dialog is open everything outside it is inert, toasts included: they are shown and
  announced, and their buttons work once it closes.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui (Sonner) | HeroUI | MUI | Pinfold |
|---|---|---|---|
| a separate package | `addToast` | `Snackbar`, one at a time | built in, no dependency |
| `toast.success()` | `color` | `severity` | `tone` |
| `toast.promise()` | `promise` | | `id`: update in place |

## Deliberately excluded
- Swipe to dismiss: a pointer-only gesture on top of a button that already does it.
