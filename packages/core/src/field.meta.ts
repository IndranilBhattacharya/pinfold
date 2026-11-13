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

const msg = (description: string): PropMeta => ({ type: 'string', description, group: 'behaviour' });

/** Validation options shared by input, number field, one-time code, checkbox, radio, switch and slider. */
export const validationProps: Record<string, PropMeta> = {
  error: { type: 'node', description: 'The error message: shows it, marks the control invalid and links it with `aria-describedby`. A function receives `{ message, validating, status }`, the message validation produced, to wrap or replace it.', group: 'data' },
  validate: { type: 'function', description: '`(value) => message | { status, message } | null`, or a promise of one. An error is also the native custom validity, so a plain `<form>` will not submit; a newer run makes an older async result stale.', group: 'behaviour' },
  validateOn: { type: 'enum', values: ['change', 'blur', 'submit'], default: 'blur', description: 'When results show: as you type, when the field is left after an edit (then live while an error shows), or on submit and `validate()`.', group: 'behaviour', silent: true },
  messages: {
    type: 'object',
    description: 'Your text for the browser\'s constraint messages, for translation: a string or `(el) => string` each.',
    group: 'behaviour',
    keys: {
      required: msg('A required field is empty.'),
      type: msg('Not an email, a URL...'),
      pattern: msg('Does not match `pattern`.'),
      min: msg('Below `min`.'),
      max: msg('Above `max`.'),
      minLength: msg('Shorter than `minLength`.'),
      maxLength: msg('Longer than `maxLength`.'),
      step: msg('Not on a `step`.'),
      badInput: msg('Text the browser cannot read as a value.'),
    },
  },
  onValidate: { type: 'function', description: '`({ valid, status, message, value }) => void`, after every validation run.', group: 'events' },
  onInvalid: { type: 'function', description: '`(message, event) => void`: the browser refused to submit the form because of this field.', group: 'events' },
  status: { type: 'enum', values: ['error', 'warning', 'success'], description: 'A helper state: `warning` and `success` tone the description and the frame and add an icon; `error` marks it invalid. A `validate` result wins.', group: 'appearance', control: true },
};

export const VALIDATION_ARIA = [
  '`validate` errors are set as the native custom validity, so the browser blocks submit and `:invalid` matches; the message shows in the error slot, linked with `aria-describedby`, with `aria-invalid`.',
  'While an async `validate` runs the control has `aria-busy` and the root `data-validating`; a stale result is dropped.',
  'A warning or success message is linked like an error but does not set `aria-invalid`.',
];
