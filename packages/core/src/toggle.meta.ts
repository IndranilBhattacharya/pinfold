import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'label', 'items', 'item', 'indicator', 'icon', 'text'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const row: Record<string, PropMeta> = {
  value: { type: 'string', required: true, description: 'The value this button stands for.', group: 'data' },
  label: { type: 'node', required: true, description: 'The text, and the name when `iconOnly`.', group: 'data' },
  icon: { type: 'node', description: 'An icon before the text.', group: 'data' },
  iconOnly: { type: 'boolean', default: false, description: 'Show the icon alone; the label stays as its name and tooltip.', group: 'appearance' },
  disabled: { type: 'boolean', default: false, description: 'This button only.', group: 'behaviour' },
};

export const toggleMeta: ComponentMeta = {
  name: 'toggle',
  displayName: 'Toggle',
  description: 'A button that stays pressed, or a group of them from a list: one choice (a segmented control) or several (formatting buttons).',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
  importPath: '@pinfold/react/toggle',
  slots: SLOTS,
  props: {
    label: { type: 'node', required: true, description: 'One toggle: its text and name. A group: the group name.', group: 'data' },
    hideLabel: { type: 'boolean', default: true, description: 'A group: keep its name for screen readers only. One toggle always shows its label (unless `iconOnly`).', group: 'appearance' },
    pressed: { type: 'boolean', description: 'One toggle: controlled state.', group: 'data' },
    defaultPressed: { type: 'boolean', default: false, description: 'One toggle: initial state when uncontrolled.', group: 'data' },
    icon: { type: 'node', description: 'One toggle: an icon before the text.', group: 'data' },
    iconOnly: { type: 'boolean', default: false, description: 'One toggle: the icon alone; the label stays as its name and tooltip.', group: 'appearance' },
    items: { type: 'array', description: 'A group: one button each.', group: 'data', items: row },
    selection: { type: 'enum', values: ['single', 'multiple'], default: 'single', description: 'A group: one value at a time (a segmented control, read as radios) or any number (pressed buttons).', group: 'behaviour', control: true, silent: true },
    value: { type: 'string[]', description: 'A group: the selected values, controlled.', group: 'data' },
    defaultValue: { type: 'string[]', description: 'A group: the selected values when uncontrolled.', group: 'data' },
    allowEmpty: { type: 'boolean', default: false, description: 'A single selection: pressing the selected button clears it.', group: 'behaviour' },
    onChange: { type: 'function', description: 'One toggle: `(pressed, event) => void`. A group: `(values, event) => void`.', group: 'behaviour' },
    name: { type: 'string', description: 'Submit the selection with a form: one hidden field per selected value.', group: 'data' },
    disabled: { type: 'boolean', default: false, description: 'Every button.', group: 'behaviour', control: true },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'A group: a row or a column; arrow keys follow it.', group: 'appearance', control: true },
    fullWidth: { type: 'boolean', default: false, description: 'A group: fill the container, buttons sharing the width.', group: 'appearance', control: true },
    variant: {
      type: 'enum',
      values: ['segmented', 'outline', 'ghost'],
      default: 'segmented',
      description: '`segmented`: a tray with a raised pill that slides to the selection. `outline`: joined framed buttons. `ghost`: quiet buttons that fill when pressed.',
      group: 'appearance',
      control: true,
    },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.toggle`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of the pressed state. Precedence: this config, `defaults.toggle`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { height: len('Button height.'), paddingX: len('Inline padding of each button.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'One stop for a group: the selected button, else the first.' },
    { keys: 'Arrow keys', action: 'Move along the group, following the orientation and reading direction. A single selection selects as it moves.' },
    { keys: 'Home / End', action: 'First / last button.' },
    { keys: 'Space / Enter', action: 'Press the focused button.' },
  ],
  aria: [
    'One toggle is a `<button aria-pressed>`.',
    'A single selection is a `radiogroup` of `radio` buttons with `aria-checked`, as a segmented control is read; a multiple selection is a `group` of `aria-pressed` buttons.',
    'The group is named by its label, kept for screen readers by default. An icon-only button keeps its label as its name and its tooltip.',
    'Pressed is never colour alone: the pressed button is raised, filled or framed.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: 'the variant' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-pressed', on: 'item', values: 'present while pressed' },
  ],
  cssVariables: ['--pinfold-toggle-height', '--pinfold-toggle-padding-x'],
  examples: [
    {
      title: 'A segmented control',
      code: "import { defineToggle } from '@pinfold/react/toggle';\n\nexport const View = defineToggle({ fullWidth: true });\n\n<View label=\"View\" defaultValue={['list']} items={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }, { value: 'calendar', label: 'Calendar' }]} onChange={setView} />",
    },
    {
      title: 'Formatting buttons, and one toggle',
      code: "export const Format = defineToggle({ selection: 'multiple', variant: 'ghost' });\n<Format label=\"Text style\" items={[{ value: 'bold', label: 'Bold', icon: <BoldIcon />, iconOnly: true }, { value: 'italic', label: 'Italic', icon: <ItalicIcon />, iconOnly: true }]} />\n\nexport const Pin = defineToggle({ variant: 'outline' });\n<Pin label=\"Pin\" icon={<PinIcon />} onChange={setPinned} />",
    },
  ],
};
