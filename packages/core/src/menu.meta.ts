import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'item', 'indicator', 'icon', 'label', 'shortcut', 'separator', 'group', 'groupLabel'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const PLACEMENTS = ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'start', 'start-top', 'start-bottom', 'end', 'end-top', 'end-bottom'];

const item: Record<string, PropMeta> = {
  type: { type: 'enum', values: ['item', 'checkbox', 'radio', 'separator', 'group'], default: 'item', description: 'What the row is.', group: 'data' },
  id: { type: 'string', description: 'React key; the position is used without one.', group: 'data' },
  label: { type: 'node', description: 'The text. A group\'s label names the group.', group: 'data' },
  icon: { type: 'node', description: 'Decorative icon before the label.', group: 'data' },
  shortcut: { type: 'node', description: 'A hint at the end, e.g. "⌘K". It does not bind the key.', group: 'data' },
  tone: { type: 'enum', values: ['danger', 'success', 'warning', 'info'], description: 'Colour for the row, e.g. a destructive action.', group: 'appearance' },
  disabled: { type: 'boolean', default: false, description: 'Stays reachable by keyboard, does nothing.', group: 'behaviour' },
  checked: { type: 'boolean', default: false, description: 'A checkbox or radio row. You own the state; update it in `onSelect`.', group: 'behaviour' },
  onSelect: { type: 'function', description: 'Called on click, Enter or Space.', group: 'behaviour' },
  href: { type: 'string', description: 'Makes the row a real link.', group: 'behaviour' },
  target: { type: 'string', description: 'Link target. `_blank` adds `rel="noopener noreferrer"`.', group: 'behaviour' },
  closeOnSelect: { type: 'boolean', description: 'Close after selecting.', group: 'behaviour', auto: 'on; off for checkbox and radio rows' },
  items: { type: 'array', description: 'A group\'s rows.', group: 'data' },
};

export const menuMeta: ComponentMeta = {
  name: 'menu',
  displayName: 'Menu',
  description: 'A dropdown or context menu from a list: actions, links, checkbox and radio rows, separators and groups, with full keyboard support and typeahead.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
  importPath: '@pinfold/react/menu',
  slots: SLOTS,
  props: {
    items: { type: 'array', required: true, description: 'The rows.', group: 'data', items: item },
    trigger: { type: 'object', description: 'A dropdown: the button config or element that opens it. A context menu: the area it opens on. Unset: spread `getTriggerProps()` on your own element.', group: 'data' },
    mode: {
      type: 'enum',
      values: ['dropdown', 'context'],
      default: 'dropdown',
      description: '`context` opens at the pointer on right-click, and on the Menu key or Shift+F10 when the area has focus.',
      group: 'behaviour',
      control: true,
    },
    label: { type: 'string', description: 'Accessible name of the menu. A dropdown is named by its trigger without one; a context menu needs it.', group: 'data' },
    placement: { type: 'enum', values: PLACEMENTS, default: 'bottom-start', description: 'Preferred side and alignment. `start` and `end` swap in RTL. It flips when there is no room.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Row size. Precedence: this config, `defaults.menu`, the provider, then md.', group: 'appearance', control: true },
    offset: { type: 'number', default: 4, description: 'Gap from the trigger, in px.', group: 'appearance' },
    loop: { type: 'boolean', default: true, description: 'Arrow keys wrap from the last row to the first.', group: 'behaviour' },
    open: { type: 'boolean', description: 'Controlled state.', group: 'behaviour' },
    defaultOpen: { type: 'boolean', default: false, description: 'Initial state when uncontrolled.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: 'Called with the next state.', group: 'behaviour' },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('Menu width (default: fits the rows).'), maxHeight: len('Taller menus scroll.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Enter, Space, ArrowDown', action: 'On the trigger: opens and focuses the first row.' },
    { keys: 'ArrowUp', action: 'On the trigger: opens and focuses the last row.' },
    { keys: 'ArrowDown, ArrowUp', action: 'Moves between rows, wrapping unless `loop: false`.' },
    { keys: 'Home, End', action: 'First and last row.' },
    { keys: 'Enter, Space', action: 'Selects the row.' },
    { keys: 'A letter', action: 'Jumps to the next row starting with it; keep typing to narrow.' },
    { keys: 'Escape', action: 'Closes and returns focus to the trigger.' },
    { keys: 'Tab', action: 'Closes and moves on from the trigger.' },
  ],
  aria: [
    '`role="menu"` with `menuitem`, `menuitemcheckbox` (or `menuitemradio`) rows and `aria-checked`; groups are `role="group"` named by their label.',
    'The trigger has `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`.',
    'Focus is real, not `aria-activedescendant`: each row takes focus in turn (tabindex -1), the Tab key leaves the menu.',
    'Disabled rows are `aria-disabled` and stay reachable, so a screen reader user can find out they exist.',
    'A link row is a real `<a>`: open in a new tab and copy link keep working.',
  ],
  dataAttributes: [
    { name: 'data-mode', on: 'root', values: '"dropdown" | "context"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-placement', on: 'root', values: 'the preferred placement' },
    { name: 'data-side', on: 'root', values: '"top" | "bottom" | "left" | "right": where it ended up' },
    { name: 'data-tone', on: 'item', values: 'the row tone' },
    { name: 'data-disabled', on: 'item', values: 'present when disabled' },
  ],
  cssVariables: ['--pinfold-menu-width', '--pinfold-menu-max-height'],
  examples: [
    {
      title: 'Dropdown',
      code: "import { defineMenu } from '@pinfold/react/menu';\n\nexport const RowActions = defineMenu({ placement: 'bottom-end' });\n\n<RowActions\n  trigger={{ label: 'Actions', variant: 'outline' }}\n  items={[\n    { label: 'Edit', shortcut: 'E', onSelect: edit },\n    { label: 'Docs', href: '/docs' },\n    { type: 'separator' },\n    { label: 'Delete', tone: 'danger', onSelect: remove },\n  ]}\n/>",
    },
    { title: 'Context menu', code: "const Canvas = useMenu({ mode: 'context', label: 'Canvas', trigger: <div className=\"canvas\" tabIndex={0} />, items });\nreturn <Canvas />;" },
  ],
};
