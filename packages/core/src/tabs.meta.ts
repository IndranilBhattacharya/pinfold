import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'list', 'tab', 'indicator', 'icon', 'endContent', 'panel'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const tabsMeta: ComponentMeta = {
  name: 'tabs',
  displayName: 'Tabs',
  description: 'Panels from a list, one shown at a time, picked from a row of tabs with a sliding indicator: underline, segmented or pills.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
  importPath: '@pinfold/react/tabs',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'The accessible name of the tab list, e.g. "Account settings".', group: 'data' },
    items: {
      type: 'array',
      required: true,
      description: 'One tab and its panel each.',
      group: 'data',
      items: {
        id: { type: 'string', required: true, description: 'Stable id: the value of `value` and `onChange`.', group: 'data' },
        label: { type: 'node', required: true, description: 'The tab text.', group: 'data' },
        content: { type: 'node', description: 'The panel.', group: 'data' },
        icon: { type: 'node', description: 'Before the text.', group: 'data' },
        endContent: { type: 'node', description: 'After the text: a count or a badge.', group: 'data' },
        disabled: { type: 'boolean', description: 'Focusable, never selected.', group: 'behaviour' },
      },
    },
    value: { type: 'string', description: 'The selected tab id, controlled.', group: 'data' },
    defaultValue: { type: 'string', description: 'The selected tab id when uncontrolled. Default the first tab that is not disabled.', group: 'data' },
    onChange: { type: 'function', description: '`(id, event) => void` when another tab is selected.', group: 'behaviour' },
    variant: {
      type: 'enum',
      values: ['underline', 'segmented', 'pills'],
      default: 'underline',
      description: '`underline`: a bar slides under the selected tab. `segmented`: a raised pill slides in a tray. `pills`: the selected tab fills with the tone.',
      group: 'appearance',
      control: true,
    },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'Tabs in a row above the panel, or a column beside it; arrow keys follow it.', group: 'appearance', control: true },
    activation: {
      type: 'enum',
      values: ['auto', 'manual'],
      default: 'auto',
      description: '`auto`: arrow keys select as they move. `manual`: arrows move focus, Enter or Space selects (for panels that are slow to show).',
      group: 'behaviour',
      control: true,
      silent: true,
    },
    fullWidth: { type: 'boolean', default: false, description: 'A row of tabs that shares the full width.', group: 'appearance', control: true },
    keepMounted: { type: 'boolean', default: false, description: 'Keep hidden panels in the DOM (their state survives a switch). Otherwise only the selected panel renders.', group: 'behaviour', control: true, silent: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.tabs`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of the indicator. Precedence: this config, `defaults.tabs`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { height: len('Tab height.'), gap: len('Space between the tab list and the panel.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Into the tab list (the selected tab), then into the panel.' },
    { keys: 'Arrow keys', action: 'The next or previous tab, following the orientation and reading direction; wraps.' },
    { keys: 'Home / End', action: 'First / last tab.' },
    { keys: 'Enter / Space', action: 'With `activation: "manual"`, select the focused tab.' },
  ],
  aria: [
    '`role="tablist"` named by `label`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` labelled by its tab.',
    'One tab stop: the selected tab. The panel takes focus when it holds nothing focusable, so Tab always reaches it.',
    'A disabled tab keeps focus on the arrow path (`aria-disabled`), so it can be found, but is never selected.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"underline" | "segmented" | "pills"' },
    { name: 'data-orientation', on: 'root', values: '"horizontal" | "vertical"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-selected', on: 'tab', values: 'present on the selected tab' },
  ],
  cssVariables: ['--pinfold-tabs-height', '--pinfold-tabs-gap'],
  examples: [
    {
      title: 'Settings tabs',
      code: "import { defineTabs } from '@pinfold/react/tabs';\n\nexport const Settings = defineTabs();\n\n<Settings label=\"Settings\" items={[\n  { id: 'profile', label: 'Profile', content: <Profile /> },\n  { id: 'billing', label: 'Billing', content: <Billing /> },\n]} />",
    },
  ],
};
