import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'key', 'separator'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const kbdMeta: ComponentMeta = {
  name: 'kbd',
  displayName: 'Kbd',
  description: 'A keyboard shortcut that adapts to the platform: ⌘ on Apple devices, Ctrl elsewhere, with spoken key names.',
  pattern: 'https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-kbd-element',
  importPath: '@pinfold/react/kbd',
  slots: SLOTS,
  props: {
    keys: {
      type: 'string[]',
      required: true,
      description: "The keys, e.g. `['mod', 'k']`. `mod` is Command on Apple platforms and Ctrl elsewhere; named keys (shift, alt, enter, esc, tab, arrows…) get symbols and spoken names.",
      group: 'data',
    },
    variant: { type: 'enum', values: ['outline', 'solid', 'ghost'], default: 'outline', description: 'A keycap with an edge, a filled cap, or plain text.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Size preset. Precedence: this config, `defaults.kbd`, the provider, then md.', group: 'appearance', control: true },
    display: {
      type: 'enum',
      values: ['auto', 'symbols', 'text'],
      default: 'auto',
      description: '`auto`: symbols on Apple platforms (⌘K), words elsewhere (Ctrl + K).',
      group: 'appearance',
      control: true,
    },
    separator: { type: 'string', default: '+', description: 'Shown between keys in text display.', group: 'appearance' },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { height: len('Keycap height.'), paddingX: len('Inline padding.'), gap: len('Space between keys.'), fontSize: len('Font size.') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the semantics and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'Native `<kbd>`: a combination is a `<kbd>` holding one `<kbd>` per key, as the HTML spec describes.',
    'Each symbol has its spoken name in visually hidden text ("Command", "Shift"), so a screen reader never reads "⌘" as nothing.',
    'Platform detection runs after hydration: the server and the first client render agree (Ctrl), then Apple devices switch to ⌘.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"outline" | "solid" | "ghost"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-os', on: 'root', values: '"apple" | "other"' },
  ],
  cssVariables: ['--pinfold-kbd-height', '--pinfold-kbd-padding-x', '--pinfold-kbd-gap', '--pinfold-kbd-font-size'],
  examples: [
    { title: 'Preset', code: "import { defineKbd } from '@pinfold/react/kbd';\n\nexport const Shortcut = defineKbd({ size: 'sm' });\n\n<Shortcut keys={['mod', 'k']} />   // ⌘K on a Mac, Ctrl + K elsewhere" },
    { title: 'Inside a button', code: "const Search = defineButton({ variant: 'outline', endIcon: <Shortcut keys={['mod', 'k']} /> });" },
  ],
};
