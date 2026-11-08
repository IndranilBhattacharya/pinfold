import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'viewport', 'track', 'slide', 'previous', 'next', 'indicators', 'indicator', 'play'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const carouselMeta: ComponentMeta = {
  name: 'carousel',
  displayName: 'Carousel',
  description: 'Slides in a row that scrolls and snaps: swipe, trackpad, arrow buttons or dots move it. One or several in view (a fraction peeks at the next), loop, and autoplay that stops on hover, focus and reduced motion, with a pause button.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/',
  importPath: '@pinfold/react/carousel',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the carousel, e.g. "New arrivals".', group: 'data' },
    slides: { type: 'array', required: true, description: 'Any nodes, or `{ content, label }` (the label is read with the slide; default "3 of 8").', group: 'data' },
    index: { type: 'number', description: 'The first slide in view, controlled.', group: 'data' },
    defaultIndex: { type: 'number', default: 0, description: 'The first slide in view at first.', group: 'data' },
    onIndexChange: { type: 'function', description: '`(index) => void`: from a button, a dot, a swipe or autoplay.', group: 'events' },
    slidesPerView: { type: 'number', default: 1, description: 'Slides in view at once; 1.2 shows the edge of the next one.', group: 'appearance' },
    loop: { type: 'boolean', default: false, description: 'Previous and next wrap around.', group: 'behaviour', control: true, silent: true },
    autoplay: { type: 'number', description: 'Turns on its own every this many milliseconds (at least 1500), with a pause button; stops on hover, focus and reduced motion.', group: 'behaviour' },
    controls: { type: 'boolean', default: true, description: 'Previous and next buttons over the slides.', group: 'appearance', control: true },
    indicators: { type: 'boolean', default: true, description: 'A dot per position.', group: 'appearance', control: true },
    labels: {
      type: 'object',
      description: 'Text read, for translation.',
      group: 'data',
      keys: {
        previous: { type: 'string', description: 'Default "Previous slide".', group: 'data' },
        next: { type: 'string', description: 'Default "Next slide".', group: 'data' },
        slide: { type: 'function', description: '`(index, count) => string`. Default "3 of 8".', group: 'data' },
        goTo: { type: 'function', description: '`(index) => string`. Default "Go to slide 3".', group: 'data' },
        pause: { type: 'string', description: 'Default "Pause".', group: 'data' },
        play: { type: 'string', description: 'Default "Play".', group: 'data' },
      },
    },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.carousel`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'Colour of the current dot. Precedence: this config, `defaults.carousel`, the provider, then primary.', group: 'appearance', control: true },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { gap: { type: 'length', description: 'Space between slides (default 1rem).', group: 'appearance' } } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'The pause button, previous, next, the slides\' own controls, then the dots.' },
    { keys: 'Enter / Space', action: 'Press a button: move, go to a slide, pause or play.' },
  ],
  aria: [
    'A `section` with `aria-roledescription="carousel"`, named by `label`; each slide is a `group` with `aria-roledescription="slide"`, named "3 of 8" (or its label).',
    'The track is a polite live region while not playing, so a moved slide is read; autoplay turns it off.',
    'Autoplay always has a pause button first, and stops while hovered or focused and for reduced motion (WCAG 2.2.2).',
    'Dots are buttons named "Go to slide 3"; the current one has `aria-current`.',
  ],
  dataAttributes: [
    { name: 'data-playing', on: 'root', values: 'present while autoplay runs' },
    { name: 'data-active', on: 'slide', values: 'present on slides in view' },
  ],
  cssVariables: ['--pinfold-carousel-gap'],
  examples: [
    { title: 'Products, two at a time', code: "import { defineCarousel } from '@pinfold/react/carousel';\n\nexport const Gallery = defineCarousel({ slidesPerView: 2 });\n\n<Gallery label=\"New arrivals\" slides={products.map((p) => ({ label: p.name, content: <ProductCard {...p} /> }))} />" },
    { title: 'A banner that turns', code: "<Gallery label=\"Offers\" slidesPerView={1} autoplay={5000} loop slides={banners} />" },
  ],
};
