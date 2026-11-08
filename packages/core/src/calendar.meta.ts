import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'header', 'title', 'previous', 'next', 'months', 'grid', 'weekday', 'day', 'footer', 'today'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const calendarMeta: ComponentMeta = {
  name: 'calendar',
  displayName: 'Calendar',
  description:
    'A month grid to choose a day, a range (with a preview as you point) or several days; one or more months side by side. Week start and names from the locale; dates are ISO strings, the same on the server and in every time zone.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/',
  importPath: '@pinfold/react/calendar',
  slots: SLOTS,
  props: {
    label: { type: 'string', default: 'Calendar', description: 'Names the calendar.', group: 'data' },
    mode: { type: 'enum', values: ['single', 'range', 'multiple'], default: 'single', description: 'One day, a range (two picks, in any order), or several days.', group: 'behaviour', control: true },
    value: { type: 'object', orString: true, description: 'The chosen day ("2026-11-08"), a range `{ start, end }`, or days (an array), by `mode`; controlled.', group: 'data' },
    defaultValue: { type: 'object', orString: true, description: 'The chosen value when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(value) => void`: a day, a `{ start, end }` range once both ends are picked, or the days.', group: 'events' },
    min: { type: 'string', description: 'The earliest day that can be chosen ("2026-11-01"). Earlier months cannot be shown.', group: 'behaviour' },
    max: { type: 'string', description: 'The latest day that can be chosen.', group: 'behaviour' },
    isDateDisabled: { type: 'function', description: '`(date) => boolean`: days that cannot be chosen, e.g. weekends or booked nights.', group: 'behaviour' },
    month: { type: 'string', description: 'The visible month (any day in it), controlled.', group: 'data' },
    defaultMonth: { type: 'string', description: 'The visible month at first. Default the chosen day\'s, else today\'s.', group: 'data' },
    onMonthChange: { type: 'function', description: '`(month) => void`: the first day of the newly shown month.', group: 'events' },
    months: { type: 'enum', values: [1, 2, 3], default: 1, description: 'Months side by side (they stack on narrow screens).', group: 'appearance', control: true },
    locale: { type: 'string', description: 'A BCP 47 locale for names and the week start. Default the browser\'s.', group: 'data' },
    weekStart: { type: 'number', description: '0 Sunday … 6 Saturday. Default the locale\'s.', group: 'behaviour' },
    showOutsideDays: { type: 'boolean', default: true, description: 'Days of the neighbouring months fill the grid (one month at a time).', group: 'appearance', control: true },
    showToday: { type: 'boolean', default: false, description: 'A "Today" button under the grid.', group: 'appearance', control: true },
    labels: {
      type: 'object',
      description: 'Text read and shown, for translation.',
      group: 'data',
      keys: {
        previous: { type: 'string', description: 'Default "Previous month".', group: 'data' },
        next: { type: 'string', description: 'Default "Next month".', group: 'data' },
        today: { type: 'string', description: 'Default "Today".', group: 'data' },
      },
    },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.calendar`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of chosen days and the range. Precedence: this config, `defaults.calendar`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Arrow keys', action: 'The day before or after (following the reading direction), or a week up or down; the month turns as needed.' },
    { keys: 'Home / End', action: 'The first / last day of the week (from the locale\'s week start).' },
    { keys: 'PageUp / PageDown', action: 'The same day a month earlier / later; with Shift, a year.' },
    { keys: 'Enter / Space', action: 'Choose the focused day (in a range: the first end, then the second).' },
    { keys: 'Escape', action: 'Drop a range in progress.' },
  ],
  aria: [
    'A `group` named by `label`; each month is a `grid` labelled by its heading (a polite live region, so turning a month is read).',
    'One tab stop: the focused day. Each day is a button named by its full date ("Sunday, 8 November 2026"); chosen days\' cells have `aria-selected`; today has `aria-current="date"`.',
    'Days that cannot be chosen keep focus (`aria-disabled`), so the keyboard can pass over them.',
    'Weekday headers are short with the full name in `abbr`.',
  ],
  dataAttributes: [
    { name: 'data-mode', on: 'root', values: '"single" | "range" | "multiple"' },
    { name: 'data-selected / data-range-start / data-range-end / data-in-range', on: 'day', values: 'the chosen days and the range' },
    { name: 'data-outside', on: 'day', values: 'a neighbouring month\'s day' },
  ],
  cssVariables: [],
  examples: [
    { title: 'A day', code: "import { defineCalendar } from '@pinfold/react/calendar';\n\nexport const Picker = defineCalendar();\n\n<Picker value={day} onChange={setDay} min=\"2026-11-01\" />" },
    { title: 'A stay over two months', code: "<Picker mode=\"range\" months={2} value={stay} onChange={setStay} isDateDisabled={(d) => booked.has(d)} />" },
  ],
};
