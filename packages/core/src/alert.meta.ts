import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'icon', 'content', 'title', 'description', 'actions', 'dismiss'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const alertMeta: ComponentMeta = {
  name: 'alert',
  displayName: 'Alert',
  description: 'A message box with a tone icon, a title, a description, action buttons and an optional dismiss button, from one config.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
  importPath: '@pinfold/react/alert',
  slots: SLOTS,
  props: {
    title: { type: 'node', description: 'The headline, e.g. "Payment failed".', group: 'data' },
    description: { type: 'node', description: 'The detail under the title.', group: 'data' },
    icon: { type: 'node', description: 'Replaces the tone icon; `false` removes it. Decorative (`aria-hidden`).', group: 'data', auto: 'the tone icon' },
    tone: {
      type: 'enum',
      values: ['info', 'success', 'warning', 'danger', 'neutral', 'primary'],
      default: 'info',
      description: 'What kind of message. An alert never takes the provider tone: its colour is its meaning.',
      group: 'appearance',
      control: true,
    },
    variant: { type: 'enum', values: ['soft', 'outline', 'accent'], default: 'soft', description: 'A tinted box, a frame, or a plain box with a coloured edge.', group: 'appearance', control: true },
    live: {
      type: 'enum',
      values: ['off', 'polite', 'assertive'],
      default: 'off',
      description: 'Announce it when it appears: `polite` is a status (waits for a pause), `assertive` an alert (interrupts). Leave `off` for messages that are on the page from the start. It changes what a screen reader does, not how the alert looks.',
      group: 'behaviour',
      control: true,
      silent: true,
    },
    actions: { type: 'array', description: 'Buttons, each a button config: `[{ label: "Retry", onClick: retry }]`. The first is tinted in the alert tone, the rest are quiet, all small, unless the config says otherwise.', group: 'data' },
    dismissible: { type: 'boolean', default: false, description: 'Show a dismiss button that hides the alert.', group: 'behaviour', control: true },
    dismissLabel: { type: 'string', default: 'Dismiss', description: 'Accessible name and tooltip of the dismiss button.', group: 'behaviour' },
    onDismiss: { type: 'function', description: 'Called after the dismiss button hides the alert.', group: 'behaviour' },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { padding: len('Inner padding.'), gap: len('Space between icon, text and buttons.'), iconSize: len('Tone icon size.'), radius: len('Corner radius.') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [{ keys: 'Tab', action: 'Moves through the action buttons and the dismiss button, like any button.' }],
  aria: [
    '`live: "off"` (default): no role, ordinary content. A message present at page load should not interrupt anyone.',
    '`live: "polite"` gives `role="status"`, `live: "assertive"` gives `role="alert"`: render the alert when the event happens and it is announced.',
    'The tone icon is decorative; the title says what happened, so colour and icon are never the only signal.',
    'The dismiss button is a real button named by `dismissLabel`; a dismissed alert is `hidden`.',
  ],
  dataAttributes: [
    { name: 'data-tone', on: 'root', values: 'the tone' },
    { name: 'data-variant', on: 'root', values: '"soft" | "outline" | "accent"' },
  ],
  cssVariables: ['--pinfold-alert-padding', '--pinfold-alert-gap', '--pinfold-alert-icon-size', '--pinfold-alert-radius'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineAlert } from '@pinfold/react/alert';\n\nexport const Problem = defineAlert({ tone: 'danger', live: 'assertive' });\nexport const Notice = defineAlert({ tone: 'info', dismissible: true });\n\n<Problem title=\"Payment failed\" description=\"Your card was declined.\" actions={[{ label: 'Retry', onClick: retry }]} />\n<Notice title=\"New: dark mode\" />",
    },
    { title: 'Controller', code: "const Saved = useAlert({ tone: 'success', title: 'Saved', dismissible: true });\nSaved.show();   // after a later save\nreturn <Saved />;" },
  ],
};
