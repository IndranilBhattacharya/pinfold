import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'item', 'marker', 'connector', 'opposite', 'body', 'time', 'title', 'description', 'content'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const TONES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];
const STATUSES = ['complete', 'current', 'upcoming', 'error'];
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const timelineMeta: ComponentMeta = {
  name: 'timeline',
  displayName: 'Timeline',
  description:
    'Events in order: an order history, an activity feed, a roadmap. Dots, icons or cards on a line that joins the markers exactly (or stops short of them, dashed, or none); vertical or horizontal, one side or alternating; content on the other side of the line; a status per event (done, current, to come, error) that colours its marker and the line; custom markers; collapsible details; ISO times shown in the locale.',
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
        content: { type: 'node', description: 'More under the text. With `collapsible`, hidden until the title is pressed.', group: 'data' },
        status: { type: 'enum', values: STATUSES, description: 'Where the event stands: `complete` (a filled marker, the line after it in the tone), `current` (a ring), `upcoming` (a hollow muted marker), `error` (the danger tone). Read after the title.', group: 'appearance' },
        marker: { type: 'node', description: 'Replaces the marker\'s content: a node, or `(item) => node` (an avatar, a number, a custom icon). The marker drops its own fill.', group: 'data' },
        opposite: { type: 'node', description: 'On the other side of the line: a time, an amount, a note.', group: 'data' },
        open: { type: 'boolean', description: 'With `collapsible`: whether `content` shows, controlled.', group: 'behaviour' },
        defaultOpen: { type: 'boolean', description: 'With `collapsible`: whether `content` shows at first.', group: 'behaviour' },
      },
    },
    variant: { type: 'enum', values: ['dot', 'icon', 'card'], default: 'dot', description: 'Small dots, icons in circles, or each event on a card.', group: 'appearance', control: true },
    orientation: { type: 'enum', values: ['vertical', 'horizontal'], default: 'vertical', description: 'A column, or a row that scrolls when long.', group: 'appearance', control: true },
    align: { type: 'enum', values: ['start', 'alternate'], default: 'start', description: 'Text on one side of the line, or alternating sides (left and right, or above and below in a row). A narrow vertical timeline puts every event on one side.', group: 'appearance', control: true },
    connector: {
      type: 'enum',
      values: ['gap', 'joined', 'dashed', 'none'],
      default: 'gap',
      description: 'The line between markers: stops a little short of each marker (`gap`), touches them (`joined`), dashed with the same space, or no line. It is always centred on the markers.',
      group: 'appearance',
      control: true,
    },
    density: { type: 'enum', values: ['comfortable', 'compact'], default: 'comfortable', description: 'Space between events (and smaller icon markers and card padding when compact).', group: 'appearance', control: true },
    timePlacement: { type: 'enum', values: ['above', 'below', 'opposite'], default: 'above', description: 'The time above the title, below the text, or on the other side of the line.', group: 'appearance', control: true },
    marker: { type: 'function', description: '`(item) => node`: the content of every marker (an item\'s own `marker` wins).', group: 'data' },
    collapsible: { type: 'boolean', default: false, description: 'Events with `content` show it only when their title (a button) is pressed.', group: 'behaviour', control: true },
    onOpenChange: { type: 'function', description: '`(item, open, event) => void` when a collapsible event opens or closes.', group: 'events' },
    onItemClick: { type: 'function', description: '`(item, event) => void`: each title becomes a button (a card is clickable as a whole).', group: 'events' },
    labels: {
      type: 'object',
      description: 'Text read, for translation.',
      group: 'data',
      keys: { status: { type: 'object', description: 'Read after the title of an event with a `status`: `{ complete, current, upcoming, error }`. Default "done", "current", "not started", "error".', group: 'data' } },
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { markerSize: len('Marker diameter (and the width of the marker column).'), lineWidth: len('Thickness of the line.'), gap: len('Space between events.'), oppositeWidth: len('Width of the opposite column with `align: "start"`. Default a quarter of the width.') },
    },
    pending: { type: 'boolean', default: false, description: 'The last event is still happening: its marker pulses, it is the current step, and events before it without a `status` count as complete.', group: 'appearance', control: true },
    reverse: { type: 'boolean', default: false, description: 'Newest first.', group: 'appearance', control: true },
    locale: { type: 'string', description: 'A BCP 47 locale for ISO times. Default the browser\'s.', group: 'data' },
    radius: RADIUS_PROP,
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
    'A pending last event, or one with `status: "current"`, has `aria-current="step"`; an event with a `status` reads it after its title ("done", "error"). Markers and connectors are decorative.',
    'With `collapsible`, the title is a button with `aria-expanded` that controls the content. With `onItemClick`, the title is a button.',
  ],
  dataAttributes: [
    { name: 'data-variant / data-orientation / data-align / data-connector / data-density / data-time-placement', on: 'root', values: 'the layout' },
    { name: 'data-opposite', on: 'root', values: 'present when there is content on the other side of the line' },
    { name: 'data-status', on: 'item, connector', values: '"complete" | "current" | "upcoming" | "error" (on the connector: the earlier event\'s)' },
    { name: 'data-pending', on: 'item', values: 'the event still happening' },
    { name: 'data-open', on: 'item', values: 'a collapsible event that is open' },
  ],
  cssVariables: ['--pinfold-timeline-marker-size', '--pinfold-timeline-line-width', '--pinfold-timeline-gap', '--pinfold-timeline-opposite-width'],
  examples: [
    { title: 'Progress with a status per event', code: "<History label=\"Deployment\" variant=\"icon\" connector=\"joined\" items={[\n  { title: 'Build', status: 'complete' },\n  { title: 'Tests', status: 'error', description: '2 failed' },\n  { title: 'Deploy', status: 'upcoming' },\n]} />" },
    { title: 'Times on the other side', code: "<History label=\"Activity\" timePlacement=\"opposite\" items={events} />" },
    { title: 'Order history', code: "import { defineTimeline } from '@pinfold/react/timeline';\n\nexport const History = defineTimeline();\n\n<History label=\"Order history\" pending items={[\n  { title: 'Ordered', time: '2026-11-02T10:15' },\n  { title: 'Shipped', time: '2026-11-04', tone: 'success' },\n  { title: 'Out for delivery' },\n]} />" },
  ],
};
