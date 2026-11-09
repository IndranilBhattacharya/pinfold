import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'image', 'fallback', 'status', 'item', 'overflow'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const person: Record<string, PropMeta> = {
  name: { type: 'string', description: 'The person or thing. Gives the accessible name, the initials and the fallback colour.', group: 'data' },
  src: { type: 'string', description: 'Image URL. While it loads, or if it fails, the initials show.', group: 'data' },
  alt: { type: 'string', description: 'Accessible name when it should differ from `name`.', group: 'data' },
  initials: { type: 'string', description: 'Overrides the initials made from `name`.', group: 'data' },
  status: { type: 'enum', values: ['online', 'away', 'busy', 'offline'], description: 'A presence dot, also read: "Ada Lovelace, online".', group: 'data', control: true },
};

export const avatarMeta: ComponentMeta = {
  name: 'avatar',
  displayName: 'Avatar',
  description: 'A picture of a person with initials while it loads or when it fails, an optional presence dot, or a stacked group with "+N".',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/',
  importPath: '@pinfold/react/avatar',
  requires: ['tooltip'],
  slots: SLOTS,
  props: {
    ...person,
    items: {
      type: 'array',
      description: 'A group: one entry per person (`name`, `src`, `alt`, `initials`, `status`). Stacked, with "+N" past `max`.',
      group: 'data',
      items: person,
    },
    tooltip: {
      type: 'boolean',
      description: 'A tooltip with the name and status on hover and keyboard focus, which also makes the avatar focusable. In a group, "+N" lists the hidden names.',
      group: 'behaviour',
      auto: 'on in a group, off on its own',
      control: true,
    },
    max: { type: 'number', default: 4, description: 'Group: how many avatars show before "+N".', group: 'behaviour' },
    label: { type: 'string', description: 'Group: accessible name of the group, e.g. "Project members".', group: 'data' },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Size preset. Precedence: this config, `defaults.avatar`, the provider, then md.', group: 'appearance', control: true },
    shape: { type: 'enum', values: ['circle', 'square'], default: 'circle', description: 'A circle for people, a rounded square for teams and apps.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['auto', 'primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'auto',
      description: 'Colour behind the initials. `auto` picks one from the name, so a person keeps the same colour everywhere.',
      group: 'appearance',
      control: true,
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { size: len('Avatar size.'), fontSize: len('Initials size.'), overlap: len('Group: how far each avatar tucks under the previous one.') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'Each avatar is `role="img"` named by `alt` or `name` (plus the status: "Ada Lovelace, online"); the picture, initials and dot inside are hidden from assistive tech, so it is read once whether or not the image loaded.',
    'Without a name it is decorative (`aria-hidden`), and warns in development.',
    'A group is `role="group"` named by `label`; "+N" is read as "N more" and its tooltip lists the hidden names.',
    'With `tooltip` each face takes keyboard focus, so the tooltip works without a pointer.',
    'The presence dot is never the only signal: the status is part of the name.',
  ],
  dataAttributes: [
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-shape', on: 'root', values: '"circle" | "square"' },
    { name: 'data-tone', on: 'root / item', values: 'the resolved tone' },
    { name: 'data-loaded', on: 'root / item', values: 'present when the image shows' },
    { name: 'data-group', on: 'root', values: 'present on a group' },
  ],
  cssVariables: ['--pinfold-avatar-size', '--pinfold-avatar-font-size', '--pinfold-avatar-overlap'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineAvatar } from '@pinfold/react/avatar';\n\nexport const Person = defineAvatar();\nexport const Team = defineAvatar({ size: 'sm', max: 3, label: 'Project members' });\n\n<Person name=\"Ada Lovelace\" src={user.photo} status=\"online\" />\n<Team items={members} />   // 3 avatars, then \"+5\"",
    },
  ],
};
