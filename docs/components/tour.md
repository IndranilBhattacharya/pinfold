# Tour: spec

Status: **experimental**. A guided walk over the real interface.

## Usage
```tsx
import { defineTour } from '@pinfold/react/tour';

export const Onboarding = defineTour({ mask: 'dim' });

<Onboarding
  defaultOpen
  steps={[
    { target: '#search', title: 'Search anything', content: 'Press / from anywhere.' },
    { target: () => document.querySelector('[data-tour=new]'), title: 'Create', content: 'Start a project here.', placement: 'end' },
    { title: 'You are set', content: 'Find this tour again under Help.' },
  ]}
  onComplete={markSeen}
/>

// started from a button
const Tour = useTour({ steps });
<button onClick={() => Tour.start()}>Take the tour</button>
<Tour />
```
Precedence: use-site props, the preset, `defaults.tour`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `steps` | `{ id, target, title, content, placement, spotlightPadding, spotlightRadius, interactive, actions }[]`; `target` is a CSS selector, a ref or `() => Element`; `actions` are extra button configs | |
| `open` / `defaultOpen` | running | `false` |
| `step` / `defaultStep` | the current step, from 0 | `0` |
| `beforeStep` | `(from, to) => boolean \| Promise<boolean>`: false stays; Next shows its loading state while a promise runs | |
| `placement` | the card's side of the target (`top`, `bottom`, `start`, `end`, each with `-start` / `-end`); flips when there is no room | `'bottom'` |
| `mask` | `'dim'`, `'blur'`, or `'none'` (nothing covers the page; it stays usable and the card is not modal) | `'dim'` |
| `spotlightPadding`, `spotlightRadius` | px around the target; corner radius of the hole | `8`, `12` |
| `interactive` | the spotlighted target can be clicked and typed into | `false` |
| `arrow` | an arrow on the card pointing at the target | `true` |
| `progress` | `'both'`, `'dots'` (footer), `'counter'` ("2 of 5" above the title), `'none'` | `'both'` |
| `showSkip` | a Skip button (not on the last step) | `true` |
| `closeOnEscape` | Escape skips | `true` |
| `scroll` | scroll each target into view | `true` |
| `missingTarget` | a step whose target is not on the page: `'center'` (the card in the middle) or `'skip'` | `'center'` |
| `labels` | `{ next, back, skip, done, counter(step, total), tour }` | English |
| `dimensions` | `{ width }` of the card | |
| `radius`, `size`, `tone` | | theme, `'md'`, `'primary'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root overlay spotlight card arrow header counter title content footer progress dot actions`; a `dot` gets `item` (`{ index, step, current, done }`) | |

## Events
| Event | Called with |
|---|---|
| `onOpenChange` | `(open)` |
| `onStepChange` | `(index, step)` |
| `onComplete` | `()`: Done on the last step |
| `onSkip` | `(index, step)`: Skip or Escape |

## Behaviour
- The cover is one fixed element whose `clip-path` (an even-odd path the hook writes) leaves a rounded hole around
  the target, so the hole glides from one step to the next; a ring element outlines it and, unless the step is
  `interactive`, keeps clicks off the target. With `mask: 'blur'` the cover also blurs the page behind it.
- The card is anchored to the target (the shared floating logic: flips, stays in the viewport, follows scrolling and
  resizing) with an arrow; a step without a target, or whose target is missing, is centred with no hole.
- Each step brings its target into view (smoothly unless reduced motion) and follows it through scrolling, resizing
  and the target's own resizing. While the target is out of view, the card hides with it.
- Cover and card join the top layer where the browser supports popovers, so no transformed or clipped ancestor can
  trap them; nothing is portalled. Nothing renders on the server or while closed.
- A missing target warns once in development. `beforeStep` runs before Next, Back, arrows and `goTo`, not before
  Done or Skip; while it runs other moves are ignored, and Skip cancels it.
- `useTour` adds `open`, `step`, `total`, `centered`, `pending`, `start(step?)`, `next()`, `back()`, `goTo(step)`,
  `skip()`, `close()` (no event) and the prop getters.

## Keyboard
| Keys | Action |
|---|---|
| ArrowRight, or Enter on the card | next (Done on the last step); mirrored in RTL |
| ArrowLeft | back |
| Escape | skip (`closeOnEscape`) |
| Tab | moves through the card's buttons; stays in the card while the page is covered |

## Accessibility
- The card is a `dialog` named by the step title (or `labels.tour`) and described by its content; `aria-modal`
  unless `mask: 'none'`.
- Opening moves the focus into the card, every step keeps it there, and closing returns it to where it was.
- The cover, ring and progress dots are `aria-hidden`; the counter is read with the heading.
- Reduced motion: no gliding, no pulse. Forced colours: the ring is a system highlight outline.
