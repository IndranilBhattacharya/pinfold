import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'header', 'title', 'description', 'content', 'footer', 'actions', 'close', 'arrow'] as const;
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
  description: 'A floating panel anchored to a trigger, opened by a click, hover, focus or from code. Holds anything: a free `content` area (a node or a function of `{ close, isOpen }`), a header, a footer and actions, scrolling inside when it is too tall.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  importPath: '@pinfold/react/popover',
  requires: ['button'],
  slots: SLOTS,
  props: {
    title: { type: 'node', description: 'The heading, and the accessible name of the panel.', group: 'data' },
    description: { type: 'node', description: 'A line under the title.', group: 'data' },
    content: { type: 'node', description: 'Anything: text, a form, a list. A function receives `{ close, isOpen }`. Scrolls inside the panel when it is taller than `dimensions.maxHeight`. On the tag, `children` work too.', group: 'data' },
    header: { type: 'node', description: 'Your own header content, under the title (or the whole header without one). A node or a function of `{ close, isOpen }`.', group: 'data' },
    footer: { type: 'node', description: 'Your own footer content, before the actions (or the whole footer without them). A node or a function of `{ close, isOpen }`.', group: 'data' },
    actions: { type: 'array', description: 'Buttons at the bottom, each a button config. Small; the first solid, the rest ghost. Each closes the popover unless its `onClick` returns `false`; a promise shows the loading state and closes when it resolves.', group: 'data' },
    trigger: { type: 'object', description: 'What opens it: a button config, or any element that passes props to its root. Unset: spread `getTriggerProps()` on your own element.', group: 'data' },
    openOn: {
      type: 'enum',
      values: ['click', 'hover', 'focus', 'manual'],
      default: 'click',
      description: '`click` toggles it and moves focus into the panel. `hover` is a hover card (hover or keyboard focus, focus stays put). `focus` opens while the trigger or the panel has focus (help for a field). `manual`: only `open` or the controller.',
      group: 'behaviour',
      control: true,
      silent: true,
    },
    modal: { type: 'boolean', default: false, description: 'Keep Tab inside the panel until it closes (`aria-modal`). For a popover that asks for input before anything else.', group: 'behaviour', control: true, silent: true },
    placement: { type: 'enum', values: PLACEMENTS, default: 'bottom', description: 'Preferred side and alignment. `start` and `end` swap in RTL. It flips when there is no room, and enters from the side it opened on.', group: 'appearance', control: true },
    arrow: { type: 'boolean', default: false, description: 'Point at the trigger.', group: 'appearance', control: true },
    offset: { type: 'number', default: 8, description: 'Gap from the trigger, in px.', group: 'appearance' },
    matchTriggerWidth: { type: 'boolean', default: false, description: 'As wide as the trigger, following it when it resizes.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg', 'auto'], default: 'md', description: 'Width and padding: 16rem, 20rem or 28rem; `auto` fits the content up to `dimensions.maxWidth`. A layout choice, not the provider size.', group: 'appearance', control: true },
    closeButton: { type: 'boolean', default: false, description: 'A close button in the corner.', group: 'behaviour', control: true },
    closeLabel: { type: 'string', default: 'Close', description: 'Accessible name of the close button.', group: 'behaviour' },
    delay: { type: 'number', default: 200, description: 'Hover: milliseconds before it opens.', group: 'behaviour' },
    closeDelay: { type: 'number', default: 200, description: 'Hover: milliseconds after the pointer leaves.', group: 'behaviour' },
    closeOnOutsidePress: { type: 'boolean', default: true, description: 'A press outside closes it.', group: 'behaviour' },
    closeOnOutside: { type: 'boolean', description: 'Deprecated alias of `closeOnOutsidePress`.', group: 'behaviour', status: 'deprecated', alias: 'closeOnOutsidePress' },
    closeOnEscape: { type: 'boolean', default: true, description: 'Escape closes it and returns focus to the trigger. Nested popovers close one at a time.', group: 'behaviour' },
    closeOnScroll: { type: 'boolean', default: false, description: 'Scrolling the page (not the panel) closes it.', group: 'behaviour' },
    open: { type: 'boolean', description: 'Controlled state.', group: 'behaviour' },
    defaultOpen: { type: 'boolean', default: false, description: 'Initial state when uncontrolled.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: '`(open, reason)`: the next state, and why (`trigger`, `hover`, `focus`, `escape`, `outside`, `scroll`, `blur`, `action`, `closeButton`, `api`).', group: 'events' },
    onOpen: { type: 'function', description: 'It asked to open.', group: 'events' },
    onClose: { type: 'function', description: '`(reason)`: it asked to close, and why (as `onOpenChange`).', group: 'events' },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { width: len('Panel width.'), maxWidth: len('Widest it grows (`size: "auto"`).'), maxHeight: len('Tallest it grows; the content scrolls inside, header and footer stay.'), padding: len('Inner padding.') },
    },
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
    { keys: 'Enter, Space', action: 'On the trigger: opens the panel and moves focus into it (`openOn: "click"`).' },
    { keys: 'Tab', action: 'Moves through the panel in document order, then on to the rest of the page; with `modal`, it cycles inside the panel.' },
    { keys: 'Escape', action: 'Closes it and returns focus to the trigger. Nested popovers close one at a time, innermost first.' },
  ],
  aria: [
    '`role="dialog"` (non-modal, or `aria-modal` with `modal`), named by the title and described by the description.',
    'The trigger has `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.',
    'The panel stays right after its trigger in the DOM, so the tab order is the visual order.',
    'A hover card also opens on keyboard focus, and stays while the pointer is over it (WCAG 1.4.13).',
  ],
  dataAttributes: [
    { name: 'data-placement', on: 'root', values: 'the preferred placement' },
    { name: 'data-side', on: 'root', values: '"top" | "bottom" | "left" | "right": where it ended up' },
    { name: 'data-open-on', on: 'root', values: '"click" | "hover" | "focus" | "manual"' },
    { name: 'data-size', on: 'root', values: '"sm" | "md" | "lg" | "auto"' },
    { name: 'data-state', on: 'root', values: '"open", or "closed" while the exit animation runs' },
    { name: 'data-overflow-top / -bottom', on: 'root', values: 'present while the content hides more above or below' },
  ],
  cssVariables: ['--pinfold-popover-width', '--pinfold-popover-max-width', '--pinfold-popover-max-height', '--pinfold-popover-padding'],
  examples: [
    {
      title: 'Preset',
      code: "import { definePopover } from '@pinfold/react/popover';\n\nexport const Details = definePopover({ placement: 'bottom-start' });\n\n<Details\n  title=\"Share this page\"\n  content={<CopyLink />}\n  actions={[{ label: 'Done' }]}\n  trigger={{ label: 'Share', variant: 'outline' }}\n/>",
    },
    { title: 'Hover card', code: "const Profile = definePopover({ openOn: 'hover' });\n<Profile title=\"Ada Lovelace\" description=\"Mathematician\" trigger={<a href=\"/ada\">Ada</a>} />" },
    {
      title: 'Free content',
      code: "<Popover\n  trigger={{ label: 'Filters' }}\n  size=\"lg\"\n  dimensions={{ maxHeight: 360 }}\n  content={({ close }) => <FilterForm onApply={close} />}\n/>",
    },
  ],
};
