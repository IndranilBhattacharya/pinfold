import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'item', 'marker', 'connector', 'body', 'time', 'title', 'description', 'content'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const TONES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];

export const timelineMeta: ComponentMeta = {
  name: 'timeline',
  displayName: 'Timeline',
  description: 'Events in order: an order history, an activity feed, a roadmap. Dots, icons or cards; vertical (one side or alternating) or horizontal; ISO times shown in the locale; a pending last event.',
  pattern: 'https://html.spec.whatwg.org/multipage/grouping-content.html#the-ol-element',
  importPath: '@pinfold/react/timeline',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the list of events.', group: 'data' },
    items: {
      type: 'array',
      orString: true,
      required: true,
      description: 'The events. A string is an event with that title.',
      group: 'data',
      items: {
        title: { type: 'node', required: true, description: 'What happened.', group: 'data' },
        description: { type: 'node', description: 'A line under it.', group: 'data' },
        time: { type: 'string', description: 'When: an ISO date or date-time (shown in the locale, kept in `datetime`), or your own text.', group: 'data' },
        icon: { type: 'node', description: 'In the marker (the icon and card variants).', group: 'data' },
        tone: { type: 'enum', values: TONES, description: 'This event\'s colour.', group: 'appearance' },
        content: { type: 'node', description: 'More under the text.', group: 'data' },
      },
    },
    variant: { type: 'enum', values: ['dot', 'icon', 'card'], default: 'dot', description: 'Small dots, icons in circles, or each event on a card.', group: 'appearance', control: true },
    orientation: { type: 'enum', values: ['vertical', 'horizontal'], default: 'vertical', description: 'A column, or a row that scrolls when long.', group: 'appearance', control: true },
    align: { type: 'enum', values: ['start', 'alternate'], default: 'start', description: 'Vertical: text on one side, or alternating sides of the line.', group: 'appearance', control: true },
    pending: { type: 'boolean', default: false, description: 'The last event is still happening: its marker pulses and it is the current step.', group: 'appearance', control: true },
    reverse: { type: 'boolean', default: false, description: 'Newest first.', group: 'appearance', control: true },
    locale: { type: 'string', description: 'A BCP 47 locale for ISO times. Default the browser\'s.', group: 'data' },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.timeline`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: TONES, default: 'primary', description: 'Colour of the markers. Precedence: this config, `defaults.timeline`, the provider, then primary.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'An ordered list named by `label`: the number of events is read, in order.',
    'Times are `<time datetime>`: shown in the reader\'s locale, exact for machines.',
    'A pending last event has `aria-current="step"`; markers and connectors are decorative.',
  ],
  dataAttributes: [
    { name: 'data-variant / data-orientation / data-align', on: 'root', values: 'the layout' },
    { name: 'data-pending', on: 'item', values: 'the event still happening' },
  ],
  cssVariables: [],
  examples: [
    { title: 'Order history', code: "import { defineTimeline } from '@pinfold/react/timeline';\n\nexport const History = defineTimeline();\n\n<History label=\"Order history\" pending items={[\n  { title: 'Ordered', time: '2026-11-02T10:15' },\n  { title: 'Shipped', time: '2026-11-04', tone: 'success' },\n  { title: 'Out for delivery' },\n]} />" },
  ],
};
