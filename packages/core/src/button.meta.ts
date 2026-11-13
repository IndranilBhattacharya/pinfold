import type { ComponentMeta, PropMeta } from './meta';

const SIZE = ['sm', 'md', 'lg'] as const;
const TONE = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const RADIUS = ['none', 'sm', 'md', 'lg', 'full'] as const;
const SLOTS = ['root', 'icon', 'startContent', 'label', 'endContent', 'endIcon', 'spinner'] as const;

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
  description: 'An action or a link that looks like one, from one config object. Tones, async loading, icons, focusable when disabled.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
  importPath: '@pinfold/react/button',
  slots: SLOTS,
  props: {
    label: { ...node('The text. Required: also the accessible name and tooltip when `iconOnly`.'), required: true },
    iconOnly: { type: 'boolean', default: false, description: 'Show only the icon, square; `label` becomes the accessible name and the tooltip.', group: 'appearance', control: true },
    variant: {
      type: 'enum',
      values: ['solid', 'soft', 'outline', 'ghost', 'link', 'elevated'],
      default: 'solid',
      description: 'Surface: a filled button, a tinted one, a frame, no surface, underlined text, or a raised neutral card with tone text (`elevated`).',
      group: 'appearance',
      control: true,
    },
    size: { type: 'enum', values: SIZE, default: 'md', description: 'Size preset. Precedence: this config, `defaults.button`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: TONE, default: 'primary', description: 'Colour role. Precedence: this config, `defaults.button`, the provider, then primary.', group: 'appearance', control: true },
    radius: {
      type: 'enum',
      values: RADIUS,
      orLength: true,
      auto: 'theme',
      description: 'Corner radius: a preset (scales the size radius like the theme presets) or a length (`20` is px).',
      group: 'appearance',
      control: true,
    },
    shape: {
      type: 'enum',
      values: ['default', 'pill', 'square', 'circle'],
      default: 'default',
      description: '`pill`: fully rounded ends. `square` and `circle`: as wide as tall (for icon-only buttons), with the size radius or fully round. `pill` and `circle` win over `radius`.',
      group: 'appearance',
      control: true,
    },
    icon: node('A visual before the label: a node, `(state) => node`, or a string (an emoji or an icon-font ligature).'),
    endIcon: node('A visual after the label.'),
    startContent: node('Any content before the label, read by screen readers (an avatar, a status dot): a node or `(state) => node`. Unlike `icon` it is not hidden and the spinner does not replace it.'),
    endContent: node('Any content after the label, read by screen readers (a count, a shortcut): a node or `(state) => node`. Hidden when `iconOnly`.'),
    loading: {
      type: 'boolean',
      default: false,
      description: 'Shows a spinner in place of the icon, sets `aria-busy` and blocks activation; the label stays visible and the button stays focusable. Unset, an `onClick` that returns a promise drives it.',
      group: 'behaviour',
      control: true,
    },
    loadingText: { type: 'string', description: 'Shown instead of the label while loading, e.g. "Saving…".', group: 'behaviour' },
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Blocks activation with `aria-disabled`. The button stays focusable and discoverable.',
      group: 'behaviour',
      control: true,
    },
    fullWidth: { type: 'boolean', default: false, description: 'Fill the width of the parent.', group: 'appearance', control: true },
    href: { type: 'string', description: 'Renders a link (`<a>`).', group: 'behaviour' },
    target: { type: 'string', description: 'Link target. `_blank` gets `rel="noopener noreferrer"` added.', group: 'behaviour' },
    rel: { type: 'string', description: 'Link relationship; kept and extended for new tabs.', group: 'behaviour' },
    type: {
      type: 'enum',
      values: ['button', 'submit', 'reset'],
      default: 'button',
      description: 'The native button type. Defaults to `button`, so a button inside a form never submits it by accident.',
      group: 'behaviour',
    },
    onClick: { type: 'function', description: 'Activation. Return a promise and the button shows its loading state until it settles.', group: 'events' },
    onNavigate: {
      type: 'function',
      description: 'With `href`: `(href, event) => void` takes plain clicks (client-side routing) after `onClick`. Without it, the provider\'s `navigate`, then the browser. A modifier-key or new-tab click stays the browser\'s.',
      group: 'events',
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
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
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
    'Loading sets `aria-busy="true"`; the label (or `loadingText`) stays visible and is the accessible name. The spinner is decorative.',
    '`label` is required, so every button has a name: with `iconOnly` it becomes `aria-label` and the tooltip.',
    'Icons are `aria-hidden`.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"solid" | "soft" | "outline" | "ghost" | "link" | "elevated"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-disabled', on: 'root', values: 'present when disabled' },
    { name: 'data-loading', on: 'root', values: 'present while loading' },
    { name: 'data-icon-only', on: 'root', values: 'present when `iconOnly`' },
    { name: 'data-shape', on: 'root', values: '"default" | "pill" | "square" | "circle"' },
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
    {
      title: 'Presets: define once, use in one line',
      code: "// ui/buttons.ts\nimport { defineButton } from '@pinfold/react/button';\nexport const Primary = defineButton({ tone: 'primary' });\nexport const Danger = defineButton({ variant: 'soft', tone: 'danger' });\n\n// any component, loops included\n<Primary label=\"Save\" onClick={save} />\n{rows.map((r) => <Danger key={r.id} label=\"Delete\" onClick={() => remove(r.id)} />)}",
    },
    {
      title: 'Client hook (when you need the controller)',
      code: "import { useButton } from '@pinfold/react/button';\n\nexport function SaveButton() {\n  const Save = useButton({ label: 'Save', tone: 'success', onClick: save });\n  return <Save />;\n}",
    },
    { title: 'Async: loading comes for free', code: "const Save = useButton({ label: 'Save', loadingText: 'Saving…', onClick: async () => { await api.save(); } });" },
    { title: 'Icon-only (the label becomes the name)', code: "const Remove = useButton({ label: 'Delete', icon: <TrashIcon />, iconOnly: true, variant: 'ghost', tone: 'danger' });" },
    { title: 'Start and end content, shapes', code: "<Button label=\"Inbox\" variant=\"elevated\" endContent={<Badge label=\"12\" />} />\n<Button label=\"New\" shape=\"pill\" icon={<PlusIcon />} />\n<Button label=\"Add\" shape=\"circle\" iconOnly icon={<PlusIcon />} />" },
    { title: 'A link through your router', code: "<Button label=\"Settings\" href=\"/settings\" variant=\"ghost\" onNavigate={(href) => router.push(href)} />" },
    { title: 'Server Component link', code: "import { defineButton } from '@pinfold/react/button';\n\nconst Docs = defineButton({ label: 'Read the docs', href: '/docs', variant: 'soft' });\nreturn <Docs />;" },
    { title: 'App-wide defaults', code: "defineConfig({ size: 'sm', defaults: { button: { variant: 'soft', radius: 'full' } } });\n// A button's own config still wins: useButton({ label: 'Go', size: 'lg' }) is large." },
  ],
};
