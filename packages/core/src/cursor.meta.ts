import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'area', 'dot', 'follower', 'trail', 'label'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const cursorMeta: ComponentMeta = {
  name: 'cursor',
  displayName: 'Cursor',
  description: 'A pointer of your own design, for a whole page or one area: a dot, a ring that trails it, a blob, a spotlight, a crosshair or a named arrow, in any tone, with a trail, a label, and states for links, text, pressing and anything you mark with `data-cursor`. Decorative only: it never replaces the real pointer for touch, for reduced motion it stops trailing, and the native cursor returns the moment it unmounts.',
  pattern: 'https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html',
  importPath: '@pinfold/react/cursor',
  slots: SLOTS,
  props: {
    content: { type: 'node', description: 'The area the cursor belongs to. Without it the cursor covers the whole page. On the tag, `children` work too.', group: 'data' },
    variant: { type: 'enum', values: ['dot-ring', 'dot', 'ring', 'blob', 'spotlight', 'crosshair', 'arrow'], default: 'dot-ring', description: 'A dot with a ring that trails it; a dot; a ring; a soft blob; a glow that lights what it passes; a crosshair; an arrow that can carry a name.', group: 'appearance', control: true },
    shape: { type: 'node', description: 'Your own pointer in place of the dot: an icon, an emoji, an image.', group: 'data' },
    label: { type: 'node', description: 'Text beside the pointer: a name, a hint. An element\'s `data-cursor-label` replaces it while pointed at.', group: 'data' },
    smoothing: { type: 'number', default: 0.8, description: 'How far the follower lags, 0 (glued) to 0.95 (very loose).', group: 'behaviour' },
    trail: { type: 'number', default: 0, description: 'Dots that follow in a fading line, 0 to 12.', group: 'appearance' },
    blend: { type: 'enum', values: ['normal', 'difference'], default: 'normal', description: '`difference` inverts what is under the pointer, so it shows on any background.', group: 'appearance', control: true },
    hideNative: { type: 'boolean', description: 'Hide the system cursor inside the area (never over text fields). Default on, off for the spotlight.', auto: 'on (off for spotlight)', group: 'behaviour', control: true },
    interactive: { type: 'string', description: 'A CSS selector for what counts as pressable (the pointer state). Default links, buttons and anything focusable.', group: 'behaviour' },
    disabled: { type: 'boolean', default: false, description: 'Off: the system cursor is used.', group: 'behaviour', control: true },
    onStateChange: { type: 'function', description: '`(state, element) => void`: the pointer entered something that changes its state (`default`, `pointer`, `text`, `hidden`, or a `data-cursor` name).', group: 'events' },
    onVisibleChange: { type: 'function', description: '`(visible) => void`: the pointer entered or left the area.', group: 'events' },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.cursor`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'Its colour. Precedence: this config, `defaults.cursor`, the provider, then primary.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'Decorative: the whole cursor is `aria-hidden` and takes no pointer events, so nothing under it changes.',
    'Only for a fine pointer (a mouse, a trackpad): on touch nothing is drawn and nothing is hidden.',
    'The system cursor stays over text fields, and is hidden only after the pointer has really moved, so a failed script never leaves a page without a cursor.',
    'Reduced motion: no lag and no trail.',
  ],
  dataAttributes: [
    { name: 'data-variant / data-blend / data-size / data-tone', on: 'root', values: 'the options' },
    { name: 'data-visible', on: 'root', values: 'present while the pointer is inside the area' },
    { name: 'data-state', on: 'root', values: '"default" | "pointer" | "text" | "hidden" | a `data-cursor` name' },
    { name: 'data-pressed', on: 'root', values: 'present while a button is held' },
    { name: 'data-cursor', on: 'any element of yours', values: 'the state the pointer takes over it, e.g. "grab", "zoom", "hidden"' },
    { name: 'data-cursor-label', on: 'any element of yours', values: 'text shown beside the pointer over it' },
  ],
  cssVariables: ['--pinfold-cursor-size', '--pinfold-cursor-follower-size', '--pinfold-cursor-color'],
  examples: [
    { title: 'The whole page', code: "import { defineCursor } from '@pinfold/react/cursor';\n\nexport const Pointer = defineCursor({ variant: 'dot-ring' });\n\n<Pointer />   // once, anywhere" },
    { title: 'One area, with hints', code: "<Pointer variant=\"blob\" blend=\"difference\">\n  <Gallery />\n</Pointer>\n\n// anywhere inside\n<img data-cursor=\"zoom\" data-cursor-label=\"View\" ... />" },
    { title: 'A named arrow', code: "<Pointer variant=\"arrow\" tone=\"success\" label=\"Mara\"><Canvas /></Pointer>" },
  ],
};
