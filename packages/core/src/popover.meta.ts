import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'title', 'description', 'content', 'actions', 'arrow'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const PLACEMENTS = ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'start', 'start-top', 'start-bottom', 'end', 'end-top', 'end-bottom'];

export const popoverMeta: ComponentMeta = {
  name: 'popover',
  displayName: 'Popover',
  description: 'A floating panel anchored to a trigger, opened by a click or, as a hover card, by hovering. Can hold anything, including controls.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  importPath: '@pinfold/react/popover',
  requires: ['button'],
  slots: SLOTS,
  props: {
    title: { type: 'node', description: 'The heading, and the accessible name of the panel.', group: 'data' },
    description: { type: 'node', description: 'A line under the title.', group: 'data' },
    content: { type: 'node', description: 'Anything: text, a form, a list.', group: 'data' },
    actions: { type: 'array', description: 'Buttons at the bottom, each a button config. Small; the first solid, the rest ghost. Each closes the popover unless its `onClick` returns `false`.', group: 'data' },
    trigger: { type: 'object', description: 'What opens it: a button config, or any element that passes props to its root. Unset: spread `getTriggerProps()` on your own element.', group: 'data' },
    openOn: { type: 'enum', values: ['click', 'hover'], default: 'click', description: '`click` moves focus into the panel. `hover` is a hover card: it opens on hover or keyboard focus and leaves focus alone.', group: 'behaviour', control: true, silent: true },
    placement: { type: 'enum', values: PLACEMENTS, default: 'bottom', description: 'Preferred side and alignment. `start` and `end` swap in RTL. It flips when there is no room.', group: 'appearance', control: true },
    arrow: { type: 'boolean', default: false, description: 'Point at the trigger.', group: 'appearance', control: true },
    offset: { type: 'number', default: 8, description: 'Gap from the trigger, in px.', group: 'appearance' },
    delay: { type: 'number', default: 200, description: 'Hover: milliseconds before it opens.', group: 'behaviour' },
    closeDelay: { type: 'number', default: 200, description: 'Hover: milliseconds after the pointer leaves.', group: 'behaviour' },
    closeOnOutside: { type: 'boolean', default: true, description: 'A press outside closes it.', group: 'behaviour' },
    closeOnEscape: { type: 'boolean', default: true, description: 'Escape closes it and returns focus to the trigger.', group: 'behaviour' },
    open: { type: 'boolean', description: 'Controlled state.', group: 'behaviour' },
    defaultOpen: { type: 'boolean', default: false, description: 'Initial state when uncontrolled.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: 'Called with the next state.', group: 'behaviour' },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('Panel width.'), padding: len('Inner padding.') } },
    radius: RADIUS_PROP,
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Enter, Space', action: 'On the trigger: opens the panel and moves focus into it.' },
    { keys: 'Tab', action: 'Moves through the panel in document order, then on to the rest of the page.' },
    { keys: 'Escape', action: 'Closes it and returns focus to the trigger.' },
  ],
  aria: [
    '`role="dialog"` (non-modal), named by the title and described by the description.',
    'The trigger has `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.',
    'The panel stays right after its trigger in the DOM, so the tab order is the visual order.',
    'A hover card also opens on keyboard focus, and stays while the pointer is over it (WCAG 1.4.13).',
  ],
  dataAttributes: [
    { name: 'data-placement', on: 'root', values: 'the preferred placement' },
    { name: 'data-side', on: 'root', values: '"top" | "bottom" | "left" | "right": where it ended up' },
    { name: 'data-open-on', on: 'root', values: '"click" | "hover"' },
  ],
  cssVariables: ['--pinfold-popover-width', '--pinfold-popover-padding'],
  examples: [
    {
      title: 'Preset',
      code: "import { definePopover } from '@pinfold/react/popover';\n\nexport const Details = definePopover({ placement: 'bottom-start' });\n\n<Details\n  title=\"Share this page\"\n  content={<CopyLink />}\n  actions={[{ label: 'Done' }]}\n  trigger={{ label: 'Share', variant: 'outline' }}\n/>",
    },
    { title: 'Hover card', code: "const Profile = definePopover({ openOn: 'hover' });\n<Profile title=\"Ada Lovelace\" description=\"Mathematician\" trigger={<a href=\"/ada\">Ada</a>} />" },
  ],
};
