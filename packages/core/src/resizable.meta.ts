import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'panel', 'handle', 'grip'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const resizableMeta: ComponentMeta = {
  name: 'resizable',
  displayName: 'Resizable',
  description: 'Panels side by side or stacked, with handles between them to drag or move with arrow keys; each panel held within its min and max; sizes kept per browser with `autoSaveId`.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/',
  importPath: '@pinfold/react/resizable',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the group, e.g. "Editor".', group: 'data' },
    panels: {
      type: 'array',
      required: true,
      description: 'The panels, in order.',
      group: 'data',
      items: {
        id: { type: 'string', required: true, description: 'Stable id.', group: 'data' },
        content: { type: 'node', required: true, description: 'What it shows.', group: 'data' },
        label: { type: 'string', description: 'Names the panel (a region) and its handle ("Resize Files").', group: 'data' },
        defaultSize: { type: 'number', description: 'Percent. Default an equal share of what is left.', group: 'data' },
        min: { type: 'number', description: 'Percent. Default 10.', group: 'behaviour' },
        max: { type: 'number', description: 'Percent. Default 90.', group: 'behaviour' },
      },
    },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'Side by side, or stacked.', group: 'appearance', control: true },
    sizes: { type: 'array', description: 'The sizes (percents), controlled.', group: 'data' },
    onResize: { type: 'function', description: '`(sizes) => void` while a handle moves.', group: 'events' },
    autoSaveId: { type: 'string', description: 'Keep the sizes in this browser under this key (loaded after the first paint, so server HTML matches).', group: 'behaviour' },
    handle: { type: 'enum', values: ['line', 'grip'], default: 'line', description: 'A hairline, or a hairline with a grip.', group: 'appearance', control: true },
    step: { type: 'number', default: 5, description: 'Percent an arrow key moves a handle.', group: 'behaviour' },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.resizable`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'Colour of a handle in use. Precedence: this config, `defaults.resizable`, the provider, then primary.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Each handle, between the panels\' own content.' },
    { keys: 'Arrow keys', action: 'Move the focused handle by `step` (left and right follow the reading direction).' },
    { keys: 'Home / End', action: 'The panel before the handle to its min / max.' },
  ],
  aria: [
    'Each handle is a focusable `separator` (window splitter) named "Resize <panel>", with `aria-valuenow`, `aria-valuemin` and `aria-valuemax` for the panel before it, and `aria-controls`.',
    'A handle between side-by-side panels is `aria-orientation="vertical"`, and the reverse.',
    'A double click puts a handle back to its default.',
  ],
  dataAttributes: [
    { name: 'data-orientation / data-handle', on: 'root', values: 'the layout' },
    { name: 'data-dragging', on: 'handle', values: 'present while dragged' },
  ],
  cssVariables: [],
  examples: [
    { title: 'An editor', code: "import { defineResizable } from '@pinfold/react/resizable';\n\nexport const Workspace = defineResizable({ handle: 'grip' });\n\n<Workspace label=\"Editor\" autoSaveId=\"editor\" panels={[\n  { id: 'files', label: 'Files', defaultSize: 25, min: 15, content: <Files /> },\n  { id: 'code', label: 'Code', content: <Code /> },\n]} />" },
  ],
};
