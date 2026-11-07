import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'media', 'body', 'title', 'description', 'content', 'actions'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const cardMeta: ComponentMeta = {
  name: 'card',
  displayName: 'Card',
  description: 'A surface with an optional image, a real heading, a description, any content and action buttons; the whole card can be one link.',
  pattern: 'https://inclusive-components.design/cards/',
  importPath: '@pinfold/react/card',
  requires: ['button'],
  slots: SLOTS,
  props: {
    title: { type: 'node', description: 'The heading. With `href` it is also the link text.', group: 'data' },
    description: { type: 'node', description: 'A line under the title.', group: 'data' },
    content: { type: 'node', description: 'Anything below: a price, a list, a form.', group: 'data' },
    image: {
      type: 'object',
      description: 'A picture at the top (or the start). `alt` is required: use `alt: ""` when it is decoration.',
      group: 'data',
      keys: { src: { type: 'string', description: 'Image URL.', group: 'data' }, alt: { type: 'string', description: 'What it shows, or "" for decoration.', group: 'data' } },
    },
    actions: { type: 'array', description: 'Buttons at the bottom, each a button config. Small; the first solid, the rest outline, unless the config says otherwise.', group: 'data' },
    href: { type: 'string', description: 'Makes the whole card a link: the title is the link and its hit area covers the card. Buttons inside stay separate.', group: 'behaviour' },
    target: { type: 'string', description: 'Link target. `_blank` adds `rel="noopener noreferrer"`.', group: 'behaviour' },
    rel: { type: 'string', description: 'Link rel, merged with the safe defaults.', group: 'behaviour' },
    headingLevel: {
      type: 'enum',
      values: [2, 3, 4, 5, 6],
      default: 3,
      description: 'The title is a real `<h2>`–`<h6>`, so cards show up in the page outline. Match it to the page.',
      group: 'behaviour',
      control: true,
    },
    as: { type: 'enum', values: ['div', 'article', 'section', 'li'], default: 'div', description: 'Root element: `article` for standalone content, `li` inside a list of cards.', group: 'behaviour' },
    variant: { type: 'enum', values: ['outline', 'elevated', 'filled', 'ghost'], default: 'outline', description: 'A bordered surface, a raised one, a tinted one, or none.', group: 'appearance', control: true },
    padding: { type: 'enum', values: ['none', 'sm', 'md', 'lg'], default: 'md', description: 'Inner spacing.', group: 'appearance', control: true },
    orientation: {
      type: 'enum',
      values: ['vertical', 'horizontal'],
      default: 'vertical',
      description: 'Image on top, or at the start. A horizontal card stacks again when its container is narrower than 32rem.',
      group: 'appearance',
      control: true,
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { padding: len('Inner padding.'), gap: len('Space between parts.'), radius: len('Corner radius.'), mediaSize: len('Image height (vertical) or width (horizontal).') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the structure and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [{ keys: 'Tab', action: 'A linked card is one stop (its title link), then each action button.' }],
  aria: [
    'The title is a real heading (`headingLevel`), so screen reader users can jump between cards.',
    'A linked card is not one giant link: only the title is the `<a>`, so it is read as the title alone; a pseudo-element stretches its hit area over the card. Buttons inside stay separately focusable.',
    'The focus ring of a linked card is drawn around the whole card.',
    '`image.alt` is required by the types; `""` marks a decorative picture.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"outline" | "elevated" | "filled" | "ghost"' },
    { name: 'data-padding', on: 'root', values: '"none" | "sm" | "md" | "lg"' },
    { name: 'data-orientation', on: 'root', values: '"vertical" | "horizontal"' },
    { name: 'data-link', on: 'root', values: 'present when the card is a link' },
  ],
  cssVariables: ['--pinfold-card-padding', '--pinfold-card-gap', '--pinfold-card-radius', '--pinfold-card-media-size'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineCard } from '@pinfold/react/card';\n\nexport const Plan = defineCard({ variant: 'elevated', as: 'article' });\nexport const Post = defineCard({ orientation: 'horizontal', headingLevel: 2 });\n\n<Plan title=\"Pro\" description=\"For growing teams\" content={<Price amount={29} />} actions={[{ label: 'Upgrade', onClick: upgrade }]} />\n{posts.map((p) => <Post key={p.id} title={p.title} description={p.excerpt} href={p.url} image={{ src: p.cover, alt: '' }} />)}",
    },
  ],
};
