# Carousel: spec

Status: **experimental**. Pattern: [APG carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).

## Usage
```tsx
import { defineCarousel } from '@pinfold/react/carousel';

export const Gallery = defineCarousel({ slidesPerView: 2 });

<Gallery label="New arrivals" slides={products.map((p) => ({ label: p.name, content: <ProductCard {...p} /> }))} />
<Gallery label="Offers" slidesPerView={1} autoplay={5000} loop slides={banners} />
```
The row is a native scroll with snapping: swipe, trackpad, the buttons and the dots all move it,
and the index follows. Precedence: use-site props, the preset, `defaults.carousel`, the provider,
the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `slides` | names it; nodes or `{ content, label }` | required |
| `index`, `defaultIndex`, `onIndexChange` | the first slide in view | `0` |
| `variant` | `'slide'`: a row that moves by a slide. `'center'`: the current slide in the middle and larger, neighbours peeking. `'coverflow'`: the same, neighbours turned away in depth. `'stagger'`: a row that steps up and down | `'slide'` |
| `orientation` | `'horizontal'`, or `'vertical'`: a column that moves up and down like a feed of clips (set `dimensions.height`) | `'horizontal'` |
| `slidesPerView` | slides in view; a fraction peeks | `1` (`center` 1.4, `coverflow` 2, `stagger` 3) |
| `draggable`, `edgeFade` | a mouse drags the slides (a flick carries to the next; nothing is selected, the click that ends a drag presses nothing); the viewport's edges fade out | `true`, `false` |
| `loop`, `autoplay` | buttons wrap; milliseconds (at least 1500) | `false`, off |
| `controls`, `indicators` | `'always' \| 'hover' \| 'below' \| 'none'`: buttons over the edges, only while pointing or focused, under the slides; `'dots' \| 'lines' \| 'fraction' \| 'none'` (`true` and `false` still read) | `'always'`, `'dots'` |
| `labels` | `{ previous, next, slide(i, n), goTo(i), pause, play }` | English |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `dimensions` | `gap` | `'md'`, `'primary'`, `1rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root viewport track slide previous next indicators indicator play` | |

Controller: `index`, `goTo(i)`, `next()`, `previous()`.

## Moving it
A swipe or a trackpad scrolls it natively; a mouse drags it; on the slides ArrowLeft and ArrowRight (ArrowUp and ArrowDown
in a column) go to the previous and next slide, Home and End to the first and last. In the centred variants, pressing a
neighbour brings it to the middle. `useCarousel` adds `index`, `count`, `goTo(i)`, `next()`, `previous()`, `playing`, `play()`
and `pause()`. The `slide` render override gets `item`: `{ index, active, offset, label }`.

## Accessibility
- A section with `aria-roledescription="carousel"` named by `label`; slides are groups with
  `aria-roledescription="slide"` named "3 of 8" or their label.
- Autoplay has a pause button first and stops while hovered or focused and for reduced motion; the
  track is a polite live region only while it is not playing.
- Dots are buttons named "Go to slide 3"; the current one has `aria-current`.
