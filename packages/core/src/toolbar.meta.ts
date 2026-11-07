import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'item'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const toolbarMeta: ComponentMeta = {
  name: 'toolbar',
  displayName: 'Toolbar',
  description: 'A row of buttons from a list: joined into one button group, or spaced as a toolbar, with one tab stop and arrow keys between them.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
  importPath: '@pinfold/react/toolbar',
  requires: ['button'],
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'The accessible name of the toolbar, e.g. "Text formatting".', group: 'data' },
    items: {
      type: 'array',
      required: true,
      description: 'One `ButtonConfig` each: label, icon, iconOnly, onClick, href, disabled… Each one\'s own settings win over the toolbar\'s.',
      group: 'data',
      items: { label: { type: 'node', required: true, description: 'Text and name.', group: 'data' } },
    },
    attached: { type: 'boolean', default: true, description: 'Join the buttons into one group with shared edges, or space them apart.', group: 'appearance', control: true },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'A row or a column; arrow keys follow it.', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['outline', 'soft', 'solid', 'ghost'], default: 'soft', description: 'The variant of every button that does not set its own.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.toolbar`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'neutral',
      description: 'The tone of every button that does not set its own. Precedence: this config, `defaults.toolbar`, then neutral (a toolbar never takes the provider tone: a row of brand buttons shouts).',
      group: 'appearance',
      control: true,
    },
    disabled: { type: 'boolean', default: false, description: 'Every button.', group: 'behaviour', control: true },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { gap: len('Space between buttons when not attached.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'One stop for the toolbar: the button last used, else the first.' },
    { keys: 'Arrow keys', action: 'Move between buttons, following the orientation and reading direction; disabled buttons are skipped.' },
    { keys: 'Home / End', action: 'First / last button.' },
  ],
  aria: [
    '`role="toolbar"` named by `label`, with `aria-orientation` when vertical.',
    'Roving tab index: the toolbar is one tab stop, so a row of icon buttons does not cost a keyboard user a dozen presses.',
    'Each button is a real Pinfold button, with its own name, loading and disabled states.',
  ],
  dataAttributes: [
    { name: 'data-attached', on: 'root', values: 'present when joined' },
    { name: 'data-orientation', on: 'root', values: '"horizontal" | "vertical"' },
  ],
  cssVariables: ['--pinfold-toolbar-gap'],
  examples: [
    {
      title: 'A button group',
      code: "import { defineToolbar } from '@pinfold/react/toolbar';\n\nexport const Pager = defineToolbar();\n\n<Pager label=\"Pages\" items={[{ label: 'Previous', onClick: prev }, { label: 'Today', onClick: today }, { label: 'Next', onClick: next }]} />",
    },
    {
      title: 'An icon toolbar',
      code: "export const Editor = defineToolbar({ attached: false, variant: 'ghost', size: 'sm' });\n<Editor label=\"Text formatting\" items={[{ label: 'Undo', icon: <UndoIcon />, iconOnly: true }, { label: 'Redo', icon: <RedoIcon />, iconOnly: true }]} />",
    },
  ],
};
