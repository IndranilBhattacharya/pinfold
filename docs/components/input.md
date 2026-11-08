# Input: spec

Status: **experimental**. A native `<input>` or `<textarea>`.

## Usage
```tsx
import { defineInput } from '@pinfold/react/input';

export const Email = defineInput({ type: 'email', autoComplete: 'email', required: true });
export const Search = defineInput({ type: 'search', clearable: true, hideLabel: true, startContent: <SearchIcon /> });
export const Notes = defineInput({ multiline: true, autosize: true, rows: 2 });
export const Amount = defineInput({ labelPlacement: 'inside', startContent: '

<Email label="Work email" name="email" description="We never share it." />
<Search label="Search" onChange={setQuery} />
<Notes label="Notes" name="notes" error={errors.notes} />
```
`useInput(config)` and `<Input {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.input`, the provider (size), the library default. Other tag props go to the root;
`slotProps.input` reaches the native element (`onBlur`, `aria-*`, `min`...).

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node (required); also the accessible name | |
| `hideLabel` | `boolean`, label for screen readers only | `false` |
| `description`, `error` | node, linked with `aria-describedby`; `error` marks it invalid | none |
| `invalid`, `required`, `disabled`, `readOnly` | `boolean` | `false` |
| `nativeErrors` | `boolean`: the browser's message in the error slot, not its bubble | `true` |
| `name`, `id` | `string` | none, generated |
| `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'url' \| 'tel'` | `'text'` |
| `value`, `defaultValue` | `string` | uncontrolled |
| `onChange` | `(value, event?) => void`; no `event` from the clear button | none |
| `placeholder`, `autoComplete`, `inputMode`, `maxLength`, `minLength`, `pattern` | native | none |
| `multiline`, `rows`, `autosize` | a `<textarea>`; rows; grows with its content | `false`, `3`, `false` |
| `resize`, `resizeIcon` | multiline: `'vertical' \| 'none'`, a drag handle in the end corner; its icon | `'vertical'`, two lines |
| `startContent`, `endContent` | node: an icon, a unit, text, a shortcut | none |
| `clearable`, `clearLabel`, `clearIcon` | a clear button while it has a value; its name; its icon | `false`, `'Clear'`, a cross |
| `labelPlacement` | `'outside' \| 'inside'`: above, or in the field rising to its top edge on focus or with a value | `'outside'` |
| `variant` | `'outline' \| 'filled' \| 'underline'` | `'outline'` |
| `size` | `'sm' \| 'md' \| 'lg'`, the same heights as a button | `'md'` (provider) |
| `dimensions` | `width, height, paddingX, radius` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label control field input startContent endContent clear handle description error`) | | |

Controller: `focus()`, `clear()`.
Inactive (`inactiveInputOptions`): `type` when multiline; `rows`, `autosize`, `resize`, `resizeIcon`
unless multiline; `resize`, `resizeIcon` with `autosize`; `resizeIcon` with `resize: 'none'`;
`clearLabel`, `clearIcon` without `clearable`; `clearable` when read-only or disabled;
`labelPlacement` with `hideLabel`.

Motion: the frame takes the accent on focus and the ring fades in; `underline` grows a bar from the
centre; an inside label rises; the clear button springs in. Reduced motion and `disableAnimation`
turn it off.

## Forms
- The native element holds the value unless you pass `value`, so forms submit and reset with no help.
- `required`, `type`, `pattern` and the like validate natively. On submit the browser's own message,
  in the reader's language, shows in the error slot, and the first invalid field takes focus. Your
  `error` always wins; `nativeErrors: false` brings the bubble back.
- A form reset restores the value and clears native messages.

## Accessibility
- The drag handle is decorative (`aria-hidden`) and pointer-only, like the browser's own; it never
  goes below the height `rows` gives. `autosize` fits long text without a pointer.
- An inside label is still the real `<label>`; it sits after the input in the DOM so CSS can lift it,
  and the input keeps its name.
- A real `<label>`. A placeholder is not a name, and a missing label warns in development.
- The control's frame clears 3:1 against the surface (WCAG 1.4.11); the focus ring is on the frame.
- `required` is the native attribute; the `*` marker is hidden from screen readers.
- An error is linked, not a live region: it is read when the field takes focus, so several errors at
  once do not talk over each other.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Field`, `FieldLabel`, `Input`, `FieldError`, `InputGroup` | `Input` with `label`, `errorMessage` | `TextField` | `label`, `description`, `error` |
| `Textarea` | `Textarea` | `multiline` | `multiline`, `autosize` |
| | `isClearable`, `startContent` | `InputAdornment` | `clearable`, `startContent` |

## Deliberately excluded
- `type: 'number'`: spinners and locale parsing are a poor fit. Use the Number field.
- `type: 'date'`: use the Date picker.
- A password reveal button and a character counter: both are one `endContent` or `description` away.
