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
| `min`, `max`, `isDateDisabled` | hold the calendar and typed dates alike | all |
| `locale`, `weekStart`, `formatOptions` | the shown date (`dateStyle: 'medium'`), typing order, calendar | the browser's |
| `months`, `showToday` | the popup's calendar | `1`, `false` |
| `clearable`, `placeholder` | | `false`, the locale's pattern ("dd/mm/yyyy") |
| `labels` | `{ open, clear, invalid }` | English |
| `open`, `defaultOpen`, `onOpenChange`, `placement` | the popup | `'bottom-start'` |
| `variant`, `size`, `tone`, `dimensions` | as Input; `width` | `'outline'`, `'md'`, `'primary'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label control input clear trigger popup description error` | |

Controller: `isOpen`, `open()`, `close()`, `focus()`.

## Accessibility
- A real text input named by its label; the calendar button is named ("Choose a date") with
  `aria-haspopup="dialog"` and `aria-expanded`.
- ArrowDown (or the button from the keyboard) opens the calendar in a non-modal dialog with focus on
  the chosen day; choosing closes it and focus returns to the field; Escape does the same.
- Typed text that is not a day that can be chosen shows the expected pattern in the error slot,
  linked by `aria-describedby`, and marks the field invalid.
