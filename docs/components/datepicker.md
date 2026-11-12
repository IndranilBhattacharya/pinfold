# Date picker: spec

Status: **experimental**. Pattern: [APG date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), non-modal.

## Usage
```tsx
import { defineDatePicker } from '@pinfold/react/datepicker';
// styles: core.css, calendar.css, datepicker.css

export const DateField = defineDatePicker();

<DateField label="Due date" value={due} onChange={setDue} min="2026-11-01" clearable />
<DateField label="Stay" mode="range" months={2} name="stay" value={stay} onChange={setStay} />
```
Type a date in the reader's own order ("8/11/2026" in the UK, "11/8/2026" in the US, or
"2026-11-08" anywhere) or pick it from the calendar. Values are ISO dates; with `name`, a hidden
input submits them, a range as "start/end" (ISO 8601). Precedence: use-site props, the preset,
`defaults.datepicker`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | as Input | |
| `mode` | `'single' \| 'range'` | `'single'` |
| `value`, `defaultValue`, `onChange` | a day or `{ start, end }`, `null` for none | none |
| `min`, `max`, `isDateDisabled` | hold the calendar and typed dates alike; `(date, { mode, start }) => boolean` | all |
| `disabledDates`, `disabledWeekdays` | the same as data: days and `{ start, end }` spans; weekdays 0 Sunday to 6 Saturday | none |
| `locale`, `weekStart`, `formatOptions` | the shown date (`dateStyle: 'medium'`), typing order, calendar | the browser's |
| `months`, `showToday` | the popup's calendar | `1`, `false` |
| `clearable`, `placeholder` | | `false`, the locale's pattern ("dd/mm/yyyy") |
| `labels` | `{ open, clear, invalid, time, startTime, endTime, done }` | English |
| `open`, `defaultOpen`, `onOpenChange`, `placement` | the popup | `'bottom-start'` |
| `variant`, `size`, `tone`, `dimensions` | as Input; `width` | `'outline'`, `'md'`, `'primary'` |
| `granularity` | `'day' \| 'month' \| 'year'`: what is picked (a month or a year is its first day) | `'day'` |
| `captionLayout`, `yearRange` | `'buttons' \| 'dropdown' \| 'label'`. `buttons`: the caption's month opens a grid of months and its year a grid of years, in place, so a day, a month and a year are all chosen in one calendar (Escape goes back). `dropdown`: two selects. `label`: text and arrows. The years offered | `'buttons'`, `min`/`max` years or 100 back, 20 ahead |
| `presets` | quick picks beside the months: names (`'today'`, `'yesterday'`, `'last7'`, `'last30'`, `'last90'`, `'next7'`, `'next30'`, `'thisWeek'`, `'lastWeek'`, `'thisMonth'`, `'lastMonth'`, `'thisYear'`, `'lastYear'`) or `{ label, value }` | none |
| `minDays`, `maxDays`, `allowDisabledInRange`, `onRangeStart` | a range's length; whether it may cover blocked days (off: the end cannot pass the nearest one); the first pick | none, none, `false` |
| `showWeekNumbers`, `dayContent` | ISO week numbers; `(date) => node` under a day's number (a price, a dot) | `false`, none |
| `time`, `timeStep`, `hourCycle` | a time with the day: values become `"2026-11-09T14:30"` (a wall time, no zone); time fields and a Done button in the popup; typed text takes a time after the date | `false`, `1` minute, the locale's |
| `minTime`, `maxTime` | the hours a time may fall in, `"09:00"` to `"18:00"` | none |
| `timeZone`, `defaultTimeZone`, `onTimeZoneChange`, `showTimeZone`, `timeZones` | with `time`: the IANA zone the value is shown and chosen in; a list in the popup to change it; the zones it offers | the reader's zone, `false`, every zone the browser knows |
| `valueFormat` | with `time`: how the value is stored and handed to `onChange`. `'wall'`: `"2026-11-09T14:30"`, what the clock shows. `'utc'`: the instant, `"2026-11-09T09:00:00.000Z"`. `'offset'`: the clock with its offset, `"2026-11-09T14:30:00+05:30"`. A value in any of the three forms is read | `'wall'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label control input clear trigger popup time timeInput done description error` | |

Controller: `isOpen`, `open()`, `close()`, `focus()`.

Inactive (`inactiveDatePickerOptions`): the calendar's rules, plus `time` when picking months or years; `hourCycle`, `timeStep`,
`minTime`, `maxTime`, the zone options and `valueFormat` without `time`; `timeZones`, `defaultTimeZone` and `onTimeZoneChange` without `showTimeZone`.

## Time zones
A day alone (`"2026-11-09"`) has no zone and is never shifted. With `time`, pick how you store it:
```tsx
// The API wants UTC; people choose in their own zone, or in the one you set
<DateField label="Starts" time valueFormat="utc" value={startsAt} onChange={setStartsAt} />
<DateField label="Starts" time timeZone="America/New_York" valueFormat="utc" value={startsAt} onChange={setStartsAt} />
// Let them choose the zone; keep the clock and its offset
<DateField label="Call" time showTimeZone valueFormat="offset" value={call} onChange={setCall} onTimeZoneChange={setZone} />
```
Changing the zone keeps the moment and moves the clock. The conversions are plain functions in `@pinfold/core`, with no
library and correct across daylight saving (a time that never happens moves forward, one that happens twice is the first):

| Function | Does |
|---|---|
| `wallToInstant(wall, zone)` / `instantToWall(instant, zone)` | a clock time in a zone to epoch ms, and back |
| `convertWallTime(wall, from, to)` | the same moment on another clock |
| `wallToValue(wall, zone, format)` / `valueToWall(value, zone)` | to and from the stored forms above |
| `zoneOffset(instant, zone)`, `formatOffset(minutes)` | minutes ahead of UTC; `"+05:30"` |
| `localTimeZone()`, `timeZones()`, `timeZoneLabel(zone)`, `isTimeZone(name)` | the reader's zone; every zone; `"(GMT+05:30) Asia/Kolkata"`; a name check |

## Accessibility
- A real text input named by its label; the calendar button is named ("Choose a date") with
  `aria-haspopup="dialog"` and `aria-expanded`.
- ArrowDown (or the button from the keyboard) opens the calendar in a non-modal dialog with focus on
  the chosen day; choosing closes it and focus returns to the field; Escape does the same.
- Typed text that is not a day that can be chosen shows the expected pattern in the error slot,
  linked by `aria-describedby`, and marks the field invalid.
