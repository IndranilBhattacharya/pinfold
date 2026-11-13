# One-time code: spec

Status: **experimental**. Native: [`autocomplete="one-time-code"`](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete-one-time-code).

## Usage
```tsx
import { defineOtp } from '@pinfold/react/otp';

export const Code = defineOtp({ groups: [3, 3] });

<Code label="Verification code" name="code" onComplete={verify} />
```
Precedence: use-site props, the preset, `defaults.otp`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `name`, `id` | |
| `length` | `number` | `6` |
| `type` | `'numeric' \| 'alphanumeric'` (shown upper case) | `'numeric'` |
| `value`, `defaultValue`, `onChange` | `string` | |
| `onComplete` | `(value)` once every box is filled | none |
| `onPaste` | `(text, event) => void` before the text is cleaned; `event.preventDefault()` cancels the paste | none |
| `onFocus`, `onBlur`, `onKeyDown` | `(event) => void` on the native element | none |
| validation | `validate`, `validateOn` (`'blur'`), `messages`, `status`, `onValidate`, `onInvalid`; `error` may be a function of `{ message, validating, status }`. See [Input: Validation](input.md#validation) | |
| `groups`, `separator` | e.g. `[3, 3]`; what sits between: a node or `(index) => node` | none, `'–'` |
| `mask`, `maskChar` | dots instead of characters (a password input); the mark | `false`, `'•'` |
| `placeholder` | a faint mark in each empty box, e.g. `'·'` | none |
| `variant` | `'outline' \| 'filled' \| 'underline'` | `'outline'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size` | | `'md'` (provider) |
| `dimensions` | `slotSize, gap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label control input slots slot caret separator description error statusIcon validating`) | | |

Inactive (`inactiveOtpOptions`): `separator` without `groups`, `maskChar` without `mask`.
Controller: `value`, `clear()`, `focus()`, `validate()`, `setError(message)`, `clearError()`.

The boxes stay on one line and shrink (to 1.75rem) in a narrow container. A typical check: `validateOn:
'change'` with an async `validate` that answers once the code is complete; older answers are dropped.

## Accessibility
- One native input lies over the boxes and holds the code: screen readers read one field, SMS
  autofill and password managers fill it, a paste fills every box, and `pattern` plus `required`
  validate it natively. Characters that do not fit `type` are dropped, and a whole code pasted
  over a partly typed one replaces it.
- The boxes are drawn from its value and `aria-hidden`. Typing always goes at the end.
- Only the box just typed into animates; a code present from the start loads still.
