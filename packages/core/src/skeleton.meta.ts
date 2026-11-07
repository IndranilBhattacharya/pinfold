import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'line'] as const;
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
  description: 'A placeholder in the shape of content that is loading, which swaps to the real content when it arrives.',
  pattern: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy',
  importPath: '@pinfold/react/skeleton',
  slots: SLOTS,
  props: {
    variant: { type: 'enum', values: ['text', 'rect', 'circle'], default: 'text', description: 'Lines of text, a block (an image, a card), or a circle (an avatar).', group: 'appearance', control: true },
    lines: { type: 'number', default: 1, description: 'Text lines; the last of several is shorter, like real text.', group: 'appearance' },
    items: { type: 'array', description: 'A layout from one config: each item is a shape (`variant`, `lines`, `size`, `dimensions`), or a nested group (`items`, `direction`).', group: 'data' },
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
    content: { type: 'node', description: 'The real content, shown when `loading` is false.', group: 'data' },
    label: {
      type: 'string',
      default: '',
      description: 'Announced while loading (visually hidden). Empty by default, so a page of skeletons does not repeat "Loading"; the container is `aria-busy` either way.',
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
    'An optional `label` is announced while loading, as visually hidden text.',
    'Shimmer stops under `prefers-reduced-motion` and with the provider\'s `disableAnimation`.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"text" | "rect" | "circle"' },
    { name: 'data-animation', on: 'root', values: '"pulse" | "wave" | "none"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-loading', on: 'root', values: 'present while loading' },
  ],
  cssVariables: ['--pinfold-skeleton-width', '--pinfold-skeleton-height', '--pinfold-skeleton-radius', '--pinfold-skeleton-gap'],
  examples: [
    {
      title: 'Preset that swaps to the content',
      code: "import { defineSkeleton } from '@pinfold/react/skeleton';\n\nexport const Paragraph = defineSkeleton({ lines: 3 });\n\n<Paragraph loading={!data} content={<p>{data?.bio}</p>} />",
    },
    { title: 'Avatar and card', code: "const Avatar = defineSkeleton({ variant: 'circle', size: 'lg' });\nconst Cover = defineSkeleton({ variant: 'rect', dimensions: { height: 160 } });" },
  ],
};
