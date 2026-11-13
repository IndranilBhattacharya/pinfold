import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'item', 'separator', 'custom'] as const;
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
      description:
        'One `ButtonConfig` each (label, icon, iconOnly, onClick, href, disabled…; each one\'s own settings win over the toolbar\'s), `{ type: \'separator\' }` between groups, or `{ content }` for anything else: a node, or `({ props, state }) => node` that spreads `props` on its control to join the arrow-key order.',
      group: 'data',
      items: {
        label: { type: 'node', description: 'A button: its text and name (required for a button).', group: 'data' },
        value: { type: 'string', description: 'With `selection`: what this button stands for.', group: 'data' },
        type: { type: 'string', description: '`separator` for a divider; otherwise the button\'s native type.', group: 'data' },
        icon: { type: 'node', description: 'A button: its icon.', group: 'data' },
        iconOnly: { type: 'boolean', description: 'A button: the icon alone; the label stays as its name and tooltip.', group: 'appearance' },
        variant: { type: 'string', description: 'A button: its own variant, over the toolbar\'s.', group: 'appearance' },
        tone: { type: 'string', description: 'A button: its own tone, over the toolbar\'s.', group: 'appearance' },
        size: { type: 'string', description: 'A button: its own size, over the toolbar\'s.', group: 'appearance' },
        disabled: { type: 'boolean', description: 'A button: this one only.', group: 'behaviour' },
        onClick: { type: 'function', description: 'A button: activation. With `selection` it runs before the value flips.', group: 'events' },
        href: { type: 'string', description: 'A button: a link.', group: 'data' },
        content: { type: 'node', description: 'Custom content: a node, or `({ props, state }) => node`.', group: 'data' },
      },
    },
    selection: {
      type: 'enum',
      values: ['none', 'single', 'multiple'],
      default: 'none',
      description: 'Buttons that stay pressed (`aria-pressed`): `single`, one at a time (text alignment); `multiple`, any (bold, italic). `none`: every button is an action.',
      group: 'behaviour',
      control: true,
    },
    value: { type: 'array', description: 'With `selection`: the pressed values, controlled. Each item\'s `value`, or its position.', group: 'data' },
    defaultValue: { type: 'array', description: 'With `selection`: the pressed values when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: 'With `selection`: `(values, event) => void`.', group: 'behaviour' },
    attached: { type: 'boolean', default: true, description: 'Join the buttons into one group with shared edges, or space them apart.', group: 'appearance', control: true },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'A row or a column; arrow keys follow it.', group: 'appearance', control: true },
    overflow: {
      type: 'enum',
      values: ['wrap', 'scroll'],
      default: 'wrap',
      description: 'More buttons than room: `wrap` onto more lines (an attached group stays on one line and its labels shrink), or `scroll` along one line with fading edges where buttons are hidden.',
      group: 'appearance',
      control: true,
    },
    variant: { type: 'enum', values: ['outline', 'soft', 'solid', 'ghost'], default: 'ghost', description: 'The variant of every button that does not set its own. `ghost` (attached): quiet buttons on one raised panel that follows the style pack.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.toolbar`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'neutral',
      description: 'The tone of every button that does not set its own. Precedence: this config, `defaults.toolbar`, then neutral (a toolbar never takes the provider tone: a row of brand buttons shouts).',
      group: 'appearance',
      control: true,
    },
    selectedTone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'With `selection`: the tone of a pressed button that does not set its own, so pressed reads at a glance.',
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
    { keys: 'Arrow keys', action: 'Move between buttons and custom controls that take the roving props, following the orientation and reading direction; they stop at the ends. Disabled buttons stay on the way. Inside a text field, select or editable region the keys stay with the control.' },
    { keys: 'Home / End', action: 'First / last button.' },
  ],
  aria: [
    '`role="toolbar"` named by `label`, with `aria-orientation` when vertical.',
    'Separators are `role="separator"` with the opposite orientation, so groups are announced.',
    'Roving tab index: the toolbar is one tab stop, so a row of icon buttons does not cost a keyboard user a dozen presses.',
    'Each button is a real Pinfold button, with its own name, loading and disabled states.',
    'With `selection`, buttons are toggle buttons: `aria-pressed` says which are on, never colour alone (the pressed fill and weight change too).',
  ],
  dataAttributes: [
    { name: 'data-attached', on: 'root', values: 'present when joined' },
    { name: 'data-orientation', on: 'root', values: '"horizontal" | "vertical"' },
    { name: 'data-pressed', on: 'item', values: 'present on a pressed button' },
    { name: 'data-overflow', on: 'root', values: '"wrap" | "scroll"' },
    { name: 'data-overflow-start / -end / -top / -bottom', on: 'root', values: 'present with `overflow: "scroll"` while buttons are hidden past that edge' },
    { name: 'data-group-start / data-group-end', on: 'item, custom', values: 'first / last of a group between separators' },
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
    {
      title: 'Groups, custom controls and scrolling',
      code: "<Toolbar label=\"Editor\" overflow=\"scroll\" selection=\"multiple\" items={[\n  { label: 'Undo', icon: <UndoIcon />, iconOnly: true, onClick: undo },\n  { type: 'separator' },\n  { content: ({ props }) => <select {...props} aria-label=\"Style\"><option>Body</option></select> },\n  { type: 'separator' },\n  { label: 'Bold', value: 'bold', icon: <BoldIcon />, iconOnly: true },\n]} />",
    },
  ],
};
