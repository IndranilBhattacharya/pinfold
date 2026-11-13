import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'line', 'shape'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const skeletonMeta: ComponentMeta = {
  name: 'skeleton',
  displayName: 'Skeleton',
  description: 'A placeholder in the shape of content that is loading (a shape, a ready-made layout, or any layout written as data), which swaps to the real content when it arrives.',
  pattern: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy',
  importPath: '@pinfold/react/skeleton',
  slots: SLOTS,
  props: {
    variant: {
      type: 'enum',
      values: ['text', 'rect', 'circle', 'pill', 'square'],
      default: 'text',
      description: 'Lines of text, a block (an image, a card), a circle (an avatar), a pill (a button, a chip) or a square (an icon, a thumbnail).',
      group: 'appearance',
      control: true,
    },
    lines: { type: 'number', default: 1, description: 'Text lines; the last of several is shorter, like real text.', group: 'appearance' },
    lastLine: { type: 'length', default: '62%', description: 'Width of the last of several text lines.', group: 'appearance' },
    ratio: { type: 'length', description: 'Aspect ratio of a rect, square or circle (`\'16/9\'` or `1.78`); replaces the height.', group: 'appearance' },
    preset: {
      type: 'enum',
      values: ['text', 'avatar-text', 'card', 'list', 'table', 'form', 'sidebar', 'tabs', 'article', 'dashboard', 'profile'],
      description: 'A ready-made layout. Tune it with `rows`, `columns` and `count`.',
      group: 'appearance',
      control: true,
    },
    count: { type: 'number', description: 'Copies of the preset or layout, laid out in `columns`. Default 1.', group: 'appearance' },
    rows: { type: 'number', description: 'Rows inside a preset: text lines, list items, table rows, form fields, sidebar entries, tabs. Default per preset.', group: 'appearance' },
    columns: { type: 'number', description: 'Columns of a preset: table columns, dashboard tiles, or the grid of `count` copies. Default per preset.', group: 'appearance' },
    layout: {
      type: 'array',
      description:
        'Any layout as data: nodes with one shape key (`line`, `text`, `circle`, `square`, `rect`, `pill`, `space`), a group (`row`, `stack`, `grid`) or `preset`, plus options (`width`, `height`, `ratio`, `radius`, `gap`, `align`, `frame`, `repeat`, `last`, `columns`, `grow`). Checked in development.',
      group: 'data',
    },
    items: { type: 'array', description: 'The earlier layout form: each item is a shape (`variant`, `lines`, `size`, `dimensions`), or a nested group (`items`, `direction`). `layout` is shorter and does more.', group: 'data' },
    direction: { type: 'enum', values: ['column', 'row'], default: 'column', description: 'How `items` flow. In a row, circles keep their size and the rest share the width.', group: 'appearance', control: true },
    animation: {
      type: 'enum',
      values: ['shimmer', 'wave', 'pulse', 'stagger', 'none'],
      default: 'shimmer',
      description: '`shimmer`: one band of light across every shape together. `wave`: a sweep inside each shape. `pulse`: a slow breath. `stagger`: the breath passed from shape to shape. Off under reduced motion and with `disableAnimation`.',
      group: 'appearance',
      control: true,
    },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Text line height and circle size. Precedence: this config, `defaults.skeleton`, the provider, then md.', group: 'appearance', control: true },
    loading: { type: 'boolean', default: true, description: 'While true the placeholder shows; set it false and `content` replaces it.', group: 'behaviour', control: true },
    content: { type: 'node', description: 'The real content, shown when `loading` is false. On the tag, `children` work too.', group: 'data' },
    label: {
      type: 'string',
      default: '',
      description: 'Announced once while loading, as one visually hidden status. Empty by default, so a page of skeletons does not repeat "Loading"; the container is `aria-busy` either way.',
      group: 'data',
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { width: len('Width (default: the full width; a circle uses its size).'), height: len('Height of a block or circle, or of one text line.'), radius: len('Corner radius.'), gap: len('Space between text lines.') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the semantics and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'The root carries `aria-busy="true"` while loading; the placeholder shapes are `aria-hidden`.',
    'An optional `label` is announced once while loading: one visually hidden `role="status"`, never one per shape.',
    'Shimmer stops under `prefers-reduced-motion` and with the provider\'s `disableAnimation`.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"text" | "rect" | "circle" | "pill" | "square" (a single shape)' },
    { name: 'data-preset', on: 'root', values: 'the preset, when one is set' },
    { name: 'data-kind', on: 'shape', values: 'the layout node: "line" | "text" | "circle" | "square" | "rect" | "pill" | "row" | "stack" | "grid" | "space"' },
    { name: 'data-animation', on: 'root', values: '"shimmer" | "wave" | "pulse" | "stagger" | "none"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-loading', on: 'root', values: 'present while loading' },
  ],
  cssVariables: ['--pinfold-skeleton-width', '--pinfold-skeleton-height', '--pinfold-skeleton-radius', '--pinfold-skeleton-gap'],
  examples: [
    {
      title: 'Preset that swaps to the content',
      code: "import { defineSkeleton } from '@pinfold/react/skeleton';\n\nexport const Paragraph = defineSkeleton({ lines: 3 });\n\n<Paragraph loading={!data} content={<p>{data?.bio}</p>} />",
    },
    { title: 'Ready-made layouts', code: "export const Cards = defineSkeleton({ preset: 'card', count: 3, columns: 3 });\nexport const Table = defineSkeleton({ preset: 'table', rows: 8, columns: 5 });\n<Table loading={!rows} content={<DataTable rows={rows} />} />" },
    {
      title: 'Any layout as data',
      code: "const Post = defineSkeleton({\n  layout: [\n    { row: [{ circle: 40 }, { stack: [{ line: '40%' }, { line: '25%' }] }] },\n    { rect: true, ratio: '16/9' },\n    { text: 3, last: '45%' },\n    { row: [{ pill: 80 }, { space: true }, { pill: 80 }] },\n  ],\n});",
    },
    { title: 'Avatar and card', code: "const Avatar = defineSkeleton({ variant: 'circle', size: 'lg' });\nconst Cover = defineSkeleton({ variant: 'rect', dimensions: { height: 160 } });" },
  ],
};
