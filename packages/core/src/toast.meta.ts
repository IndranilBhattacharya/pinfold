import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'list', 'item', 'icon', 'content', 'title', 'description', 'action', 'dismiss'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const toastMeta: ComponentMeta = {
  name: 'toast',
  displayName: 'Toast',
  description: 'Short messages that appear in a corner and leave by themselves: queued, paused while read, and announced to screen readers. Errors and toasts with an action stay until dismissed.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
  importPath: '@pinfold/react/toast',
  requires: ['button'],
  slots: SLOTS,
  props: {
    placement: {
      type: 'enum',
      values: ['top-start', 'top', 'top-end', 'bottom-start', 'bottom', 'bottom-end'],
      default: 'bottom-end',
      description: 'The corner or edge they stack in. `start` and `end` swap in RTL.',
      group: 'appearance',
      control: true,
    },
    duration: { type: 'number', default: 5000, description: 'Milliseconds before a toast leaves. Errors and toasts with an action stay unless they set their own `duration`; 0 stays.', group: 'behaviour' },
    max: { type: 'number', default: 5, description: 'How many are on screen at once; the rest wait their turn.', group: 'behaviour' },
    stack: { type: 'boolean', default: true, description: 'Pile the toasts behind the newest one; hover or focus fans them out.', group: 'appearance', control: true },
    visible: { type: 'number', default: 3, description: 'How many show at full size when fanned out; the rest scroll, with no scrollbar.', group: 'appearance' },
    label: { type: 'string', default: 'Notifications', description: 'Accessible name of the region.', group: 'behaviour' },
    dismissLabel: { type: 'string', default: 'Dismiss', description: 'Accessible name and tooltip of each dismiss button.', group: 'behaviour' },
    swipe: { type: 'boolean', default: true, description: 'Swipe a toast toward its edge (a third of its width, or a flick) to dismiss it; a shorter swipe springs back. The dismiss button stays for everyone else.', group: 'behaviour', control: true, silent: true },
    store: { type: 'object', description: 'A store from `createToastStore()` to show toasts from outside React. `defineToast` makes one for you.', group: 'behaviour' },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('Toast width.'), gap: len('Space between toasts.'), inset: len('Distance from the viewport edge.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Reaches the action and dismiss buttons in document order; focus pauses every timer.' },
    { keys: 'Escape', action: 'With focus inside a toast: dismisses it.' },
  ],
  aria: [
    'The region is a named landmark and a polite live region, present from the first render so announcements are reliable; an error is `role="alert"`, which interrupts.',
    'Timers stop while the pointer or focus is inside, and while the tab is hidden: a message is never gone before it could be read (WCAG 2.2.1).',
    'Errors and toasts with an action stay until dismissed, since an action must not vanish before it can be used.',
    'A modal dialog makes everything outside it inert, toasts included: they are still shown and announced, but their buttons work once it closes.',
  ],
  dataAttributes: [
    { name: 'data-placement', on: 'root', values: 'the placement' },
    { name: 'data-expanded', on: 'root', values: 'present while the stack is open' },
    { name: 'data-index', on: 'item', values: '0 for the newest' },
    { name: 'data-tone', on: 'item', values: 'the toast tone' },
  ],
  cssVariables: ['--pinfold-toast-width', '--pinfold-toast-gap', '--pinfold-toast-inset'],
  examples: [
    {
      title: 'One region, shown from anywhere',
      code: "'use client';\nimport { defineToast } from '@pinfold/react/toast';\n\nexport const Toasts = defineToast({ placement: 'bottom-end' });\n\n// once, near the root of the app\n<Toasts />\n\n// anywhere, also outside React\nToasts.show({ title: 'Saved', tone: 'success' });\nToasts.show({ title: 'Upload failed', tone: 'danger', action: { label: 'Retry', onClick: retry } });",
    },
    {
      title: 'A list instead of a pile',
      code: "export const Toasts = defineToast({ stack: false, visible: 4 });",
    },
    {
      title: 'Update in place',
      code: "Toasts.show({ id: 'save', title: 'Saving…', duration: 0 });\nawait save();\nToasts.show({ id: 'save', title: 'Saved', tone: 'success' });",
    },
  ],
};
