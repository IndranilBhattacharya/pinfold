import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';
import { FIELD_ARIA, fieldProps } from './field.meta';
import { CALENDAR_PICK_PROPS } from './calendar.meta';

const SLOTS = ['root', 'label', 'control', 'input', 'clear', 'trigger', 'popup', 'time', 'timeInput', 'done', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const datepickerMeta: ComponentMeta = {
  name: 'datepicker',
  displayName: 'Date picker',
  pascal: 'DatePicker',
  description:
    'A date field: type a date in the reader\'s own format (day, month and year in the locale\'s order) or pick it from a calendar. One day or a range; ISO values; a hidden input submits them.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/',
  importPath: '@pinfold/react/datepicker',
  requires: ['calendar'],
  slots: SLOTS,
  props: {
    ...fieldProps,
    mode: { type: 'enum', values: ['single', 'range'], default: 'single', description: 'One day, or a range (typed "start – end").', group: 'behaviour', control: true },
    value: { type: 'object', orString: true, description: 'The chosen day ("2026-11-08") or `{ start, end }`, controlled; `null` for none.', group: 'data' },
    defaultValue: { type: 'object', orString: true, description: 'The chosen value when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(value) => void`: a day, a `{ start, end }` range, or `null` when cleared.', group: 'events' },
    min: { type: 'string', description: 'The earliest day that can be chosen or typed.', group: 'behaviour' },
    max: { type: 'string', description: 'The latest day that can be chosen or typed.', group: 'behaviour' },
    isDateDisabled: { type: 'function', description: '`(date, { mode, start }) => boolean`: days that cannot be chosen; `start` is a range\'s first pick while its end is chosen.', group: 'behaviour' },
    ...CALENDAR_PICK_PROPS,
    time: { type: 'boolean', default: false, description: 'A time with the day: values become "2026-11-09T14:30" (a wall time, no zone); the popup shows time fields and a Done button.', group: 'behaviour', control: true },
    timeStep: { type: 'number', default: 1, description: 'Minutes between the times offered.', group: 'behaviour' },
    hourCycle: { type: 'enum', values: [12, 24], description: '12 or 24 hours. Default the locale\'s.', group: 'appearance' },
    locale: { type: 'string', description: 'A BCP 47 locale for the shown date, the typing order and the calendar. Default the browser\'s.', group: 'data' },
    weekStart: { type: 'number', description: '0 Sunday … 6 Saturday. Default the locale\'s.', group: 'behaviour' },
    formatOptions: { type: 'object', description: '`Intl.DateTimeFormat` options for the shown date. Default `{ dateStyle: "medium" }`.', group: 'appearance' },
    months: { type: 'enum', values: [1, 2, 3], default: 1, description: 'Months in the popup.', group: 'appearance' },
    showToday: { type: 'boolean', default: false, description: 'A "Today" button in the popup.', group: 'appearance' },
    clearable: { type: 'boolean', default: false, description: 'A button that empties the field.', group: 'behaviour', control: true },
    placeholder: { type: 'string', description: 'Default the locale\'s numeric pattern, e.g. "dd/mm/yyyy".', group: 'data' },
    labels: {
      type: 'object',
      description: 'Text read and shown, for translation.',
      group: 'data',
      keys: {
        open: { type: 'string', description: 'The calendar button. Default "Choose a date" ("Choose dates" for a range).', group: 'data' },
        clear: { type: 'string', description: 'Default "Clear".', group: 'data' },
        invalid: { type: 'string', description: 'Shown when typed text is not a date that can be chosen. Default "Enter a date like dd/mm/yyyy".', group: 'data' },
        time: { type: 'string', description: 'Default "Time".', group: 'data' },
        startTime: { type: 'string', description: 'Default "Start time".', group: 'data' },
        endTime: { type: 'string', description: 'Default "End time".', group: 'data' },
        done: { type: 'string', description: 'Default "Done".', group: 'data' },
      },
    },
    open: { type: 'boolean', description: 'The calendar, controlled.', group: 'behaviour' },
    defaultOpen: { type: 'boolean', default: false, description: 'Open at first.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: '`(open) => void`.', group: 'events' },
    placement: { type: 'enum', values: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end'], default: 'bottom-start', description: 'Where the calendar opens; it flips when there is no room.', group: 'appearance' },
    variant: { type: 'enum', values: ['outline', 'filled', 'underline'], default: 'outline', description: 'The field: framed, tinted, or a line under it (as Input).', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.datepicker`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of the focus and the calendar\'s chosen days. Precedence: this config, `defaults.datepicker`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: { type: 'length', description: 'Width of the field.', group: 'appearance' } } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Typing', action: 'A date in the locale\'s order ("8/11/2026"), or "2026-11-08"; Enter or leaving the field takes it.' },
    { keys: 'ArrowDown / Alt+ArrowDown', action: 'Open the calendar with focus on the chosen day.' },
    { keys: 'Calendar keys', action: 'As Calendar; Enter chooses, closes and returns focus to the field.' },
    { keys: 'Escape', action: 'Close the calendar and return focus to the field.' },
  ],
  aria: [
    'A real text input labelled by `label`; the calendar button is named ("Choose a date") with `aria-haspopup="dialog"` and `aria-expanded`.',
    'The calendar opens in a non-modal `dialog` labelled by the field\'s label; focus moves into it from the keyboard and returns to the field.',
    'Typed text that is not a date shows a message in the error slot, linked by `aria-describedby`, with the expected pattern.',
    ...FIELD_ARIA,
  ],
  dataAttributes: [
    { name: 'data-mode', on: 'root', values: '"single" | "range"' },
    { name: 'data-variant', on: 'root', values: '"outline" | "filled" | "underline"' },
    { name: 'data-open / data-filled / data-invalid', on: 'root', values: 'the field\'s state' },
  ],
  cssVariables: ['--pinfold-datepicker-width'],
  examples: [
    { title: 'A due date', code: "import { defineDatePicker } from '@pinfold/react/datepicker';\n\nexport const DateField = defineDatePicker();\n\n<DateField label=\"Due date\" value={due} onChange={setDue} min=\"2026-11-01\" />" },
    { title: 'A stay', code: "<DateField label=\"Stay\" mode=\"range\" months={2} name=\"stay\" value={stay} onChange={setStay} />" },
  ],
};
