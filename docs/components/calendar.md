# Calendar: spec

Status: **experimental**. Pattern: the grid of the [APG date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).

## Usage
```tsx
import { defineCalendar } from '@pinfold/react/calendar';

export const Picker = defineCalendar();

<Picker value={day} onChange={setDay} min="2026-11-01" />
<Picker mode="range" months={2} value={stay} onChange={setStay} isDateDisabled={(d) => booked.has(d)} />
<Picker mode="multiple" value={days} onChange={setDays} locale="fr-FR" />
```
Dates are ISO strings ("2026-11-08"): plain data that survives JSON, server rendering and time
zones, and compares as text. Week start and names come from `locale` (the browser's by default).
Precedence: use-site props, the preset, `defaults.calendar`, the provider (size, tone), the
library default.

## Config
| Key | Type | Default |
|---|---|---|
| `mode` | `'single' \| 'range' \| 'multiple'` | `'single'` |
| `value`, `defaultValue`, `onChange` | a day, `{ start, end }`, or days, by mode | none |
| `min`, `max`, `isDateDisabled` | days that can be chosen; `(date) => boolean` | all |
| `month`, `defaultMonth`, `onMonthChange` | the visible month | the chosen day's, else today's |
| `months` | `1 \| 2 \| 3` side by side (they wrap when narrow) | `1` |
| `locale`, `weekStart` | names and the first weekday (0 Sunday … 6 Saturday) | the browser's, the locale's |
| `showOutsideDays`, `showToday` | neighbouring days (one month); a Today button | `true`, `false` |
| `labels` | `{ previous, next, today }` | English |
| `label`, `size`, `tone` | the group's name | `'Calendar'`, `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root header title previous next months grid weekday day footer today` | |

A range is two picks in any order; while the second is pending, the band follows the pointer or the
focused day, and Escape drops it. Controller: `month`, `setMonth(date)`, `focus()`.

Inactive (`inactiveCalendarOptions`): `showOutsideDays` with more than one month.

## Accessibility
- A `group` named by `label`; each month is a `grid` labelled by its heading, a polite live
  region, so turning the month is read. Weekday headers are short with the full name in `abbr`.
- One tab stop, the focused day. Arrows move a day or a week (left and right follow the reading
  direction); Home and End go to the week's ends; PageUp and PageDown move a month, a year with
  Shift. The month turns as focus leaves it; `min` and `max` hold it.
- Each day is a button named by its full date; chosen days' cells have `aria-selected`; today
  has `aria-current="date"`, set only in the browser (the server's day may not be the reader's).
- Days that cannot be chosen stay focusable with `aria-disabled`, and are struck through.
