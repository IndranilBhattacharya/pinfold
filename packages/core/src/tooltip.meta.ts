import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'arrow'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const PLACEMENTS = ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'start', 'start-top', 'start-bottom', 'end', 'end-top', 'end-bottom'];

export const tooltipMeta: ComponentMeta = {
  name: 'tooltip',
  displayName: 'Tooltip',
  description: 'A short hint on hover or keyboard focus. Stays while the pointer is over it, closes on Escape, flips and shifts to stay on screen.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
  importPath: '@pinfold/react/tooltip',
  requires: ['button'],
  slots: SLOTS,
  props: {
    content: { type: 'node', required: true, description: 'The hint. Text only in spirit: nothing inside it can be clicked (use a popover for that).', group: 'data' },
    trigger: { type: 'object', description: 'What it describes: a button config, or any element that passes props to its root. Unset: spread `getTriggerProps()` on your own element.', group: 'data' },
    placement: { type: 'enum', values: PLACEMENTS, default: 'top', description: 'Preferred side and alignment. `start` and `end` swap in RTL. It flips when there is no room.', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['inverse', 'surface'], default: 'inverse', description: 'High contrast against the page, or a surface like a popover.', group: 'appearance', control: true },
    arrow: { type: 'boolean', default: true, description: 'Point at the trigger.', group: 'appearance', control: true },
    offset: { type: 'number', default: 8, description: 'Gap from the trigger, in px.', group: 'appearance' },
    delay: { type: 'number', default: 400, description: 'Milliseconds of hover before it opens. Keyboard focus opens it at once.', group: 'behaviour' },
    closeDelay: { type: 'number', default: 120, description: 'Milliseconds after the pointer leaves: time to reach the tooltip itself.', group: 'behaviour' },
    disabled: { type: 'boolean', default: false, description: 'Never open.', group: 'behaviour' },
    open: { type: 'boolean', description: 'Controlled state.', group: 'behaviour' },
    defaultOpen: { type: 'boolean', default: false, description: 'Initial state when uncontrolled.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: 'Called with the next state.', group: 'behaviour' },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { maxWidth: len('Longest line before wrapping.') } },
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
    { keys: 'Tab', action: 'Focusing the trigger opens the tooltip at once; leaving closes it.' },
    { keys: 'Escape', action: 'Closes the tooltip without moving focus.' },
  ],
  aria: [
    '`role="tooltip"`, linked with `aria-describedby` on the trigger while open.',
    'Meets WCAG 1.4.13: dismissible (Escape), hoverable (the pointer can move onto it), persistent (it stays until the pointer or focus leaves).',
    'It describes; it does not name. An icon-only control still needs its own label (a Pinfold button has one).',
    'Touch has no hover: it opens on focus, never on a stray tap.',
  ],
  dataAttributes: [
    { name: 'data-placement', on: 'root', values: 'the preferred placement' },
    { name: 'data-side', on: 'root', values: '"top" | "bottom" | "left" | "right": where it ended up' },
    { name: 'data-variant', on: 'root', values: '"inverse" | "surface"' },
  ],
  cssVariables: ['--pinfold-tooltip-max-width'],
  examples: [
    {
      title: 'Preset',
      code: "import { defineTooltip } from '@pinfold/react/tooltip';\n\nexport const Hint = defineTooltip({ placement: 'bottom' });\n\n<Hint content=\"Copies the link\" trigger={{ label: 'Share', variant: 'outline' }} />\n<Hint content=\"Opens in a new tab\" trigger={<a href=\"/docs\">Docs</a>} />",
    },
  ],
};
