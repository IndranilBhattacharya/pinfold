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
| `min`, `max`, `isDateDisabled` | days that can be chosen; `(date, { mode, start }) => boolean` (`start`: a range's first pick, so the end can depend on it) | all |
| `disabledDates`, `disabledWeekdays` | the same as data: days and `{ start, end }` spans (holidays, booked nights); weekdays 0 Sunday to 6 Saturday (`[0, 6]` for weekends). All of these apply together and may change at any time (a start date from another field as `min`) | none |
| `granularity` | `'day' \| 'month' \| 'year'`: what is picked (a month or a year is its first day) | `'day'` |
| `captionLayout`, `yearRange` | `'buttons' \| 'dropdown' \| 'label'`. `buttons`: the caption's month opens a grid of months and its year a grid of years, in place, so a day, a month and a year are all chosen in one calendar (Escape goes back). `dropdown`: two selects. `label`: text and arrows. The years offered | `'buttons'`, `min`/`max` years or 100 back, 20 ahead |
| `presets` | quick picks beside the months: names (`'today'`, `'yesterday'`, `'last7'`, `'last30'`, `'last90'`, `'next7'`, `'next30'`, `'thisWeek'`, `'lastWeek'`, `'thisMonth'`, `'lastMonth'`, `'thisYear'`, `'lastYear'`) or `{ label, value }` | none |
| `minDays`, `maxDays`, `allowDisabledInRange`, `onRangeStart` | a range's length; whether it may cover blocked days (off: the end cannot pass the nearest one); the first pick | none, none, `false` |
| `showWeekNumbers`, `dayContent` | ISO week numbers; `(date) => node` under a day's number (a price, a dot) | `false`, none |
| `footer` | content under the grid (actions, a time field) | none |
| `month`, `defaultMonth`, `onMonthChange` | the visible month | the chosen day's, else today's |
| `months` | `1 \| 2 \| 3` side by side (they wrap when narrow) | `1` |
| `locale`, `weekStart` | names and the first weekday (0 Sunday … 6 Saturday) | the browser's, the locale's |
| `showOutsideDays`, `showToday` | neighbouring days (one month); a Today button | `true`, `false` |
| `labels` | `{ previous, next, today, month, year, week, presets }` | English |
| `label`, `size`, `tone` | the group's name | `'Calendar'`, `'md'`, `'primary'` (provider) |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root header title monthSelect yearSelect previous next body presets preset months grid weekday weekNumber day dayContent cell footer today`; days and month or year cells pass `item` (`{ date, selected, disabled, today, outside, rangeStart, rangeEnd }`) to `render` | |

A range is two picks in any order; while the second is pending, the band follows the pointer or the
focused day, and Escape drops it. Controller: `month`, `setMonth(date)`, `focus()`.

Inactive (`inactiveCalendarOptions`): `showOutsideDays` with more than one month; `showOutsideDays`, `showWeekNumbers`, `dayContent`, `months`, `weekStart` when picking months or years; `minDays`, `maxDays`, `allowDisabledInRange` outside a range.

Month and year pickers are grids of twelve buttons, three to a row: arrows move one (or a row), PageUp and PageDown a page, Home and End the page's ends.

## Controller
`useCalendar(config)` adds `month`, `setMonth(date)`, `view` (`'day' | 'month' | 'year'`), `setView(view)` (never closer than
`granularity`) and `focus()`.

## Accessibility
- Caption buttons are named "November: choose a month" and "2026: choose a year"; zoomed out, arrows move by month or year, Enter opens, Escape returns to the days.
- A `group` named by `label`; each month is a `grid` labelled by its heading, a polite live
  region, so turning the month is read. Weekday headers are short with the full name in `abbr`.
- One tab stop, the focused day. Arrows move a day or a week (left and right follow the reading
  direction); Home and End go to the week's ends; PageUp and PageDown move a month, a year with
  Shift. The month turns as focus leaves it; `min` and `max` hold it.
- Each day is a button named by its full date; chosen days' cells have `aria-selected`; today
  has `aria-current="date"`, set only in the browser (the server's day may not be the reader's).
- Days that cannot be chosen stay focusable with `aria-disabled`, and are struck through.
