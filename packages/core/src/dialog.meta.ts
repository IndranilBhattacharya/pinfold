import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'panel', 'title', 'description', 'content', 'actions', 'close'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const dialogMeta: ComponentMeta = {
  name: 'dialog',
  displayName: 'Dialog',
  description: 'A native modal dialog from one config: centred, or a sheet from any edge; an alert dialog with one option. Focus trap, Escape and focus return come from the browser.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  importPath: '@pinfold/react/dialog',
  slots: SLOTS,
  props: {
    title: { type: 'node', description: 'The heading, and the accessible name. A real `<h2>`.', group: 'data' },
    description: { type: 'node', description: 'Read when the dialog opens.', group: 'data' },
    content: { type: 'node', description: 'Anything. Scrolls inside the panel when it is too tall.', group: 'data' },
    actions: { type: 'array', description: 'Buttons at the bottom, each a button config. The last is solid, the rest ghost, as in `[Cancel, Save]`. Each closes the dialog unless its `onClick` returns `false`; a promise closes when it resolves and stays open if it rejects.', group: 'data' },
    trigger: { type: 'object', description: 'What opens it: a button config, or any element that passes props to its root. Unset: call `.open()`, or control `open`.', group: 'data' },
    role: {
      type: 'enum',
      values: ['dialog', 'alertdialog'],
      default: 'dialog',
      description: '`alertdialog` asks for a decision: an outside press does not close it, there is no close button by default, and the first action takes focus (put the safe one first).',
      group: 'behaviour',
      control: true,
    },
    placement: { type: 'enum', values: ['center', 'top', 'bottom', 'start', 'end'], default: 'center', description: 'Centred, or a sheet from an edge. `start` and `end` swap in RTL.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg', 'xl', 'full'], default: 'md', description: 'Width of a centred dialog. Independent of the provider size: it is a layout choice, not a density.', group: 'appearance', control: true },
    modal: { type: 'boolean', default: true, description: 'Modal: the rest of the page is inert and scroll is locked. `false` opens it without either.', group: 'behaviour' },
    closeButton: { type: 'boolean', description: 'Show a close button in the corner.', group: 'behaviour', auto: 'on, off for an alert dialog' },
    closeLabel: { type: 'string', default: 'Close', description: 'Accessible name and tooltip of the close button.', group: 'behaviour' },
    closeOnOutside: { type: 'boolean', description: 'A press on the backdrop closes it.', group: 'behaviour', auto: 'on, off for an alert dialog' },
    closeOnEscape: { type: 'boolean', default: true, description: 'Escape closes it.', group: 'behaviour' },
    open: { type: 'boolean', description: 'Controlled state.', group: 'behaviour' },
    defaultOpen: { type: 'boolean', default: false, description: 'Initial state when uncontrolled.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: 'Called with the next state.', group: 'behaviour' },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { width: len('Panel width.'), height: len('Panel height (a top or bottom sheet).'), padding: len('Inner padding.'), radius: len('Corner radius.') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab, Shift+Tab', action: 'Moves through the dialog only: the page behind is inert.' },
    { keys: 'Escape', action: 'Closes it and returns focus to what opened it.' },
  ],
  aria: [
    'A native `<dialog>` opened with `showModal()`: the top layer, an inert page and focus return are the browser\'s, so they cannot break.',
    'Named by the title (`aria-labelledby`), described by the description (`aria-describedby`). Without a title it warns in development.',
    'Focus goes to the first control inside; add `data-autofocus` to a control (through `slotProps`) to choose another. An alert dialog focuses its first action, so put the safe one first.',
    'Scroll is locked without the page shifting sideways.',
  ],
  dataAttributes: [
    { name: 'data-placement', on: 'root', values: '"center" | "top" | "bottom" | "start" | "end"' },
    { name: 'data-size', on: 'root', values: '"sm" | "md" | "lg" | "xl" | "full"' },
    { name: 'data-modal', on: 'root', values: 'present when modal' },
  ],
  cssVariables: ['--pinfold-dialog-width', '--pinfold-dialog-height', '--pinfold-dialog-padding', '--pinfold-dialog-radius'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineDialog } from '@pinfold/react/dialog';\n\nexport const Confirm = defineDialog({ role: 'alertdialog', size: 'sm' });\nexport const Panel = defineDialog({ placement: 'end' });\n\n<Confirm\n  title=\"Delete this project?\"\n  description=\"This cannot be undone.\"\n  trigger={{ label: 'Delete', tone: 'danger', variant: 'soft' }}\n  actions={[{ label: 'Cancel' }, { label: 'Delete', tone: 'danger', onClick: remove }]}\n/>",
    },
    { title: 'From code', code: "const Welcome = useDialog({ title: 'Welcome', content: <Tour /> });\nWelcome.open();\nreturn <Welcome />;" },
  ],
};
