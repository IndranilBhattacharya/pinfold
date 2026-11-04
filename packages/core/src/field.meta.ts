import type { PropMeta } from './meta';

/** The options every form control shares. */
export const fieldProps: Record<string, PropMeta> = {
  label: { type: 'node', required: true, description: 'The visible name, and the accessible one.', group: 'data' },
  hideLabel: { type: 'boolean', default: false, description: 'Keep the label for screen readers only.', group: 'appearance', control: true },
  description: { type: 'node', description: 'Help text, linked with `aria-describedby`.', group: 'data' },
  error: { type: 'node', description: 'The error message: shows it, marks the control invalid and links it with `aria-describedby`.', group: 'data' },
  invalid: { type: 'boolean', default: false, description: 'Marks the control invalid without a message.', group: 'behaviour', control: true },
  required: { type: 'boolean', default: false, description: 'Native `required`, with a marker after the label.', group: 'behaviour', control: true },
  disabled: { type: 'boolean', default: false, description: 'Native `disabled`: not focusable, not submitted with the form.', group: 'behaviour', control: true },
  nativeErrors: { type: 'boolean', default: true, description: 'Show the browser\'s validation message in place of its bubble, and focus the first invalid control on submit. `error` always wins.', group: 'behaviour' },
  name: { type: 'string', description: 'The form field name.', group: 'data' },
  id: { type: 'string', description: 'Id of the control. Generated without one.', group: 'data' },
};

export const FIELD_ARIA = [
  'A real `<label>` names the control; `description` and `error` are linked with `aria-describedby`, and `error` sets `aria-invalid`.',
  'Native validation: the browser\'s message shows in the error slot instead of its bubble, in the reader\'s language, and submitting focuses the first invalid control. A form reset clears it.',
  'An error message is not a live region: it is read when the control takes focus, so many errors at once do not talk over each other.',
];
