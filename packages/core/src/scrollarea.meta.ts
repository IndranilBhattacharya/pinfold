import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'viewport', 'content', 'indicator'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const length = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const scrollareaMeta: ComponentMeta = {
  name: 'scrollarea',
  displayName: 'Scroll area',
  pascal: 'ScrollArea',
  description: 'A scrolling region that shows where more content is: a fade, a shadow, a glow or a line on each edge that hides something. Follows new content like a chat, reports reaching either end, scrolls by keyboard.',
  pattern: 'https://www.w3.org/WAI/WCAG22/Techniques/general/G202',
  importPath: '@pinfold/react/scrollarea',
  slots: SLOTS,
  props: {
    content: { type: 'node', description: 'What scrolls. On the tag, `children` work too.', group: 'data' },
    label: { type: 'string', description: 'Names the region for assistive technology. With a label the area is a landmark region.', group: 'data' },
    orientation: { type: 'enum', values: ['vertical', 'horizontal', 'both'], default: 'vertical', description: 'Which way it scrolls.', group: 'appearance', control: true },
    indicator: { type: 'enum', values: ['fade', 'shadow', 'glow', 'line', 'none'], default: 'fade', description: 'How an edge shows that it hides content: the content fades out, a shadow or a tone glow lies over it, or a thin line.', group: 'appearance', control: true },
    indicatorSize: { type: 'length', description: 'How deep the fade, shadow or glow reaches. Default 2rem (a line: 2px).', group: 'appearance' },
    scrollbar: { type: 'enum', values: ['auto', 'thin', 'hover', 'hidden'], default: 'thin', description: 'The scrollbar: the browser\'s, a thin one, one that shows while pointing at the area, or none (still scrollable).', group: 'appearance', control: true },
    stickToEnd: { type: 'boolean', default: false, description: 'A chat or a log: stay at the end as content arrives, unless the reader scrolled away.', group: 'behaviour', control: true, silent: true },
    reachThreshold: { type: 'number', default: 48, description: 'How close (px) to an end counts as reaching it.', group: 'behaviour' },
    onReachStart: { type: 'function', description: 'Scrolled to the start: load older content.', group: 'events' },
    onReachEnd: { type: 'function', description: 'Scrolled to the end: load more.', group: 'events' },
    onEdgesChange: { type: 'function', description: '`({ top, bottom, start, end })`, when an edge starts or stops hiding content.', group: 'events' },
    onScroll: { type: 'function', description: 'The viewport\'s scroll event.', group: 'events' },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: {
        height: length('A fixed height.'),
        maxHeight: length('Grow with the content up to this height, then scroll.'),
        width: length('A fixed width.'),
        maxWidth: length('Grow with the content up to this width, then scroll.'),
        padding: length('Space inside the viewport, around the content.'),
      },
    },
    radius: RADIUS_PROP,
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'Colour of the glow and the line. Precedence: this config, `defaults.scrollarea`, the provider, then primary.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Focuses the area when it has no focusable content and something to scroll.' },
    { keys: 'Arrow keys / Page Up / Page Down / Home / End / Space', action: 'Scroll, as the browser does.' },
  ],
  aria: [
    'The viewport is focusable (`tabindex="0"`) only while it overflows, so a keyboard can scroll it (WCAG 2.1.1).',
    'With `label` the viewport is a `region` with that name.',
    'Indicators are decorative: `aria-hidden`.',
  ],
  dataAttributes: [
    { name: 'data-overflow-top / -bottom / -start / -end', on: 'root', values: 'present while that edge hides content' },
    { name: 'data-orientation / data-indicator / data-scrollbar', on: 'root', values: 'the options' },
  ],
  cssVariables: ['--pinfold-scrollarea-height', '--pinfold-scrollarea-max-height', '--pinfold-scrollarea-width', '--pinfold-scrollarea-max-width', '--pinfold-scrollarea-padding', '--pinfold-scrollarea-indicator-size'],
  examples: [
    { title: 'A list that fades at the edges', code: "import { defineScrollArea } from '@pinfold/react/scrollarea';\n\nexport const Scroll = defineScrollArea({ dimensions: { maxHeight: 320 } });\n\n<Scroll label=\"Changelog\">{entries}</Scroll>" },
    { title: 'A chat that follows new messages', code: "export const Messages = defineScrollArea({ stickToEnd: true, indicator: 'shadow', dimensions: { height: 480 } });\n\n<Messages label=\"Conversation\" onReachStart={loadOlder}>{messages.map(renderMessage)}</Messages>" },
  ],
};
