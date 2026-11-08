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
| `slidesPerView` | slides in view; a fraction peeks | `1` |
| `loop`, `autoplay` | buttons wrap; milliseconds (at least 1500) | `false`, off |
| `controls`, `indicators` | buttons over the edges; dots | `true`, `true` |
| `labels` | `{ previous, next, slide(i, n), goTo(i), pause, play }` | English |
| `size`, `tone`, `dimensions` | `gap` | `'md'`, `'primary'`, `1rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root viewport track slide previous next indicators indicator play` | |

Controller: `index`, `goTo(i)`, `next()`, `previous()`.

## Accessibility
- A section with `aria-roledescription="carousel"` named by `label`; slides are groups with
  `aria-roledescription="slide"` named "3 of 8" or their label.
- Autoplay has a pause button first and stops while hovered or focused and for reduced motion; the
  track is a polite live region only while it is not playing.
- Dots are buttons named "Go to slide 3"; the current one has `aria-current`.
