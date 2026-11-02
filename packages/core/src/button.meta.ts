import type { ComponentMeta, PropMeta } from './meta';

const SIZE = ['sm', 'md', 'lg'] as const;
const TONE = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const RADIUS = ['none', 'sm', 'md', 'lg', 'full'] as const;
const SLOTS = ['root', 'icon', 'label', 'endIcon', 'spinner'] as const;

const node = (description: string): PropMeta => ({ type: 'node', description, group: 'data' });
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const buttonMeta: ComponentMeta = {
  name: 'button',
  displayName: 'Button',
  kind: 'atom',
  description: 'An action or a link that looks like one. Tones, loading state, icons, focusable when disabled.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
  importPath: '@pinfold/react/button',
  slots: SLOTS,
  props: {
    children: node('The label.'),
    variant: {
      type: 'enum',
      values: ['solid', 'soft', 'outline', 'ghost', 'link'],
      default: 'solid',
      description: 'Surface: a filled button, a tinted one, a frame, no surface, or underlined text.',
      group: 'appearance',
      control: true,
    },
    size: { type: 'enum', values: SIZE, auto: 'provider, md', description: 'Size preset. Unset inherits the nearest provider size.', group: 'appearance', control: true },
    tone: { type: 'enum', values: TONE, auto: 'provider, primary', description: 'Colour role. Unset inherits the nearest provider tone.', group: 'appearance', control: true },
    radius: {
      type: 'enum',
      values: RADIUS,
      orLength: true,
      auto: 'theme',
      description: 'Corner radius: a preset (scales the size radius like the theme presets) or a length (`20` is px).',
      group: 'appearance',
      control: true,
    },
    icon: node('A visual before the label: a node, or a string (an emoji or an icon-font ligature). With no label the button is icon-only and square, and needs `aria-label`.'),
    endIcon: node('A visual after the label.'),
    loading: {
      type: 'boolean',
      default: false,
      description: 'Shows a spinner over the content, keeps the width, sets `aria-busy` and blocks activation. Stays focusable.',
      group: 'behaviour',
      control: true,
    },
    loadingText: { type: 'string', description: 'Announced instead of the label while loading, e.g. "Saving".', group: 'behaviour' },
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Blocks activation with `aria-disabled`. The button stays focusable and discoverable.',
      group: 'behaviour',
      control: true,
    },
    fullWidth: { type: 'boolean', default: false, description: 'Fill the width of the parent.', group: 'appearance', control: true },
    href: { type: 'string', description: 'Renders a link (`<a>`). `target="_blank"` gets `rel="noopener noreferrer"` added.', group: 'behaviour' },
    type: {
      type: 'enum',
      values: ['button', 'submit', 'reset'],
      default: 'button',
      description: 'The native button type. Defaults to `button`, so a button inside a form never submits it by accident.',
      group: 'behaviour',
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements, each winning over the size preset. Numbers are px.',
      group: 'appearance',
      keys: {
        height: len('Height (and width when icon-only).'),
        minWidth: len('Minimum width.'),
        paddingX: len('Inline padding.'),
        gap: len('Space between icon, label and end icon.'),
        radius: len('Corner radius. Overrides `radius`.'),
        fontSize: len('Label font size.'),
        iconSize: len('Icon and spinner size.'),
      },
    },
    unstyled: {
      type: 'boolean',
      default: false,
      description: 'Drop Pinfold classes; keep behaviour, ARIA and data attributes.',
      group: 'appearance',
    },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. Handlers chain.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`. `render.root` swaps the element, e.g. a router link.', 'function'),
  },
  keyboard: [
    { keys: 'Enter / Space', action: 'Activates the button (Enter only for a link). Nothing happens while disabled or loading.' },
    { keys: 'Tab', action: 'Moves focus to and from the button. Disabled and loading buttons stay in the tab order.' },
  ],
  aria: [
    'A native `<button>` (`type="button"` by default), or an `<a>` when `href` is set.',
    'Disabled and loading use `aria-disabled`, never `disabled`, so the button stays focusable and its label is still read.',
    'Loading sets `aria-busy="true"`; `loadingText` replaces the accessible name while it lasts. The spinner is decorative.',
    'An icon-only button needs `aria-label` or `aria-labelledby`; development builds warn when it is missing.',
    'Icons are `aria-hidden`.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"solid" | "soft" | "outline" | "ghost" | "link"' },
    { name: 'data-size', on: 'root', values: 'present only when `size` is set; otherwise the provider size applies' },
    { name: 'data-tone', on: 'root', values: 'present only when `tone` is set; otherwise the provider tone applies' },
    { name: 'data-disabled', on: 'root', values: 'present when disabled' },
    { name: 'data-loading', on: 'root', values: 'present while loading' },
    { name: 'data-icon-only', on: 'root', values: 'present when there is an icon and no label' },
  ],
  cssVariables: [
    '--pinfold-button-height',
    '--pinfold-button-min-width',
    '--pinfold-button-padding-x',
    '--pinfold-button-gap',
    '--pinfold-button-radius',
    '--pinfold-button-font-size',
    '--pinfold-button-icon-size',
  ],
  examples: [
    { title: 'Basic', code: "import { Button } from '@pinfold/react/button';\n\n<Button onClick={save}>Save</Button>" },
    { title: 'Tones and variants', code: '<Button tone="danger" variant="soft">Delete</Button>\n<Button variant="outline">Cancel</Button>' },
    { title: 'Loading', code: '<Button loading={saving} loadingText="Saving">Save</Button>' },
    { title: 'Icon-only', code: '<Button icon={<TrashIcon />} aria-label="Delete" variant="ghost" />' },
    { title: 'As a router link', code: "<Button render={{ root: ({ props, children }) => <Link {...props} href=\"/docs\">{children}</Link> }}>Docs</Button>" },
  ],
};
