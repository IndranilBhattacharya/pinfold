import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'header', 'title', 'monthButton', 'yearButton', 'monthSelect', 'yearSelect', 'previous', 'next', 'body', 'presets', 'preset', 'months', 'grid', 'weekday', 'weekNumber', 'day', 'dayContent', 'cell', 'footer', 'today'] as const;

/** Picking options the calendar and the date picker share. */
export const CALENDAR_PICK_PROPS: Record<string, PropMeta> = {
  granularity: { type: 'enum', values: ['day', 'month', 'year'], default: 'day', description: 'Pick a day, a month (its first day, "2026-11-01") or a year ("2026-01-01").', group: 'behaviour', control: true },
  captionLayout: { type: 'enum', values: ['buttons', 'dropdown', 'label'], default: 'buttons', description: 'The header. `buttons`: the month and the year open a grid of months and of years in place, so a day, a month and a year are chosen in one calendar. `dropdown`: two selects. `label`: text and arrows.', group: 'appearance', control: true },
  disabledDates: { type: 'array', orString: true, description: 'Days that cannot be chosen, as data: days and `{ start, end }` spans (holidays, booked nights).', group: 'behaviour', items: { start: { type: 'string', required: true, description: 'First day of the span.', group: 'data' }, end: { type: 'string', required: true, description: 'Last day of the span.', group: 'data' } } },
  disabledWeekdays: { type: 'array', description: 'Weekdays that cannot be chosen: 0 Sunday to 6 Saturday (`[0, 6]` for weekends).', group: 'behaviour' },
  yearRange: { type: 'array', description: 'Years the year dropdown offers, `[from, to]`. Default `min`/`max` years, else 100 back and 20 ahead.', group: 'behaviour' },
  showWeekNumbers: { type: 'boolean', default: false, description: 'ISO week numbers before each week.', group: 'appearance', control: true },
  dayContent: { type: 'function', description: '`(date) => node`: something under a day\'s number, a price or an event dot.', group: 'appearance' },
  presets: {
    type: 'array',
    orString: true,
    description: "Quick picks beside the months: names ('today', 'yesterday', 'last7', 'last30', 'last90', 'next7', 'next30', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear') or `{ label, value }` (a day, a range, or a function returning one).",
    group: 'data',
  },
  minDays: { type: 'number', description: 'A range: fewest days it may cover (both ends counted). Ends closer than this cannot be picked.', group: 'behaviour' },
  maxDays: { type: 'number', description: 'A range: most days it may cover.', group: 'behaviour' },
  allowDisabledInRange: { type: 'boolean', default: false, description: 'A range may cover days that cannot be chosen. Off: once a start is picked, an end past the nearest blocked day cannot be (a booking cannot span a booked night).', group: 'behaviour' },
  onRangeStart: { type: 'function', description: '`(date) => void`: a range\'s first day was picked.', group: 'events' },
};
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
    isDateDisabled: { type: 'function', description: '`(date, { mode, start }) => boolean`: days that cannot be chosen, e.g. weekends or booked nights. `start` is a range\'s first pick while its end is being chosen, so the end can depend on it.', group: 'behaviour' },
    ...CALENDAR_PICK_PROPS,
    month: { type: 'string', description: 'The visible month (any day in it), controlled.', group: 'data' },
    defaultMonth: { type: 'string', description: 'The visible month at first. Default the chosen day\'s, else today\'s.', group: 'data' },
    onMonthChange: { type: 'function', description: '`(month) => void`: the first day of the newly shown month.', group: 'events' },
    months: { type: 'enum', values: [1, 2, 3], default: 1, description: 'Months side by side (they stack on narrow screens).', group: 'appearance', control: true },
    locale: { type: 'string', description: 'A BCP 47 locale for names and the week start. Default the browser\'s.', group: 'data' },
    weekStart: { type: 'number', description: '0 Sunday … 6 Saturday. Default the locale\'s.', group: 'behaviour' },
    showOutsideDays: { type: 'boolean', default: true, description: 'Days of the neighbouring months fill the grid (one month at a time).', group: 'appearance', control: true },
    showToday: { type: 'boolean', default: false, description: 'A "Today" button under the grid.', group: 'appearance', control: true },
    footer: { type: 'node', description: 'Content under the grid, in the footer: actions, a time field.', group: 'data' },
    labels: {
      type: 'object',
      description: 'Text read and shown, for translation.',
      group: 'data',
      keys: {
        previous: { type: 'string', description: 'Default "Previous month".', group: 'data' },
        next: { type: 'string', description: 'Default "Next month".', group: 'data' },
        today: { type: 'string', description: 'Default "Today".', group: 'data' },
        month: { type: 'string', description: 'The month dropdown. Default "Month".', group: 'data' },
        year: { type: 'string', description: 'The year dropdown. Default "Year".', group: 'data' },
        week: { type: 'string', description: 'The week number column. Default "Wk".', group: 'data' },
        presets: { type: 'string', description: 'The preset list. Default "Presets".', group: 'data' },
        chooseMonth: { type: 'string', description: 'After the month on its caption button. Default "choose a month".', group: 'data' },
        chooseYear: { type: 'string', description: 'After the year on its caption button. Default "choose a year".', group: 'data' },
      },
    },
    radius: RADIUS_PROP,
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
    render: perSlot('Replace a slot element: `({ props, state, children, item }) => node`. Days and month or year cells get `item`: `{ date, selected, disabled, today, outside, rangeStart, rangeEnd }`.', 'function'),
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
