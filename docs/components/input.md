# Input: spec

Status: **experimental**. A native `<input>` or `<textarea>`.

## Usage
```tsx
import { defineInput } from '@pinfold/react/input';

export const Email = defineInput({ type: 'email', autoComplete: 'email', required: true });
export const Search = defineInput({ type: 'search', clearable: true, hideLabel: true, startContent: <SearchIcon /> });
export const Notes = defineInput({ multiline: true, autosize: true, rows: 2 });
export const Amount = defineInput({ labelPlacement: 'inside', inputMode: 'decimal', startContent: '$', endContent: 'USD' });

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
| `description` | node, linked with `aria-describedby` | none |
| `error` | node, or `({ message, validating, status }) => node` to wrap the message validation produced; shows, marks invalid and links it | none |
| `invalid`, `required`, `disabled`, `readOnly` | `boolean` | `false` |
| `nativeErrors` | `boolean`: the browser's message in the error slot, not its bubble | `true` |
| `name`, `id` | `string` | none, generated |
| `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'url' \| 'tel'` | `'text'` |
| `value`, `defaultValue` | `string` | uncontrolled |
| `onChange` | `(value, event?) => void`; no `event` from the clear button | none |
| `onFocus`, `onBlur`, `onKeyDown` | `(event) => void` on the native element; `onBlur` runs after validation on blur | none |
| `onEnter` | `(value, event) => void`: Enter in a one-line field, Ctrl or Cmd + Enter when multiline. The form still submits natively unless you `preventDefault()` | none |
| `onClear` | `() => void`: the clear button or `clear()` emptied it | none |
| `validate` | `(value) => message \| { status, message } \| null`, or a promise of one (see Validation) | none |
| `validateOn` | `'change' \| 'blur' \| 'submit'` | `'blur'` |
| `messages` | your text for the browser's messages: `required, type, pattern, min, max, minLength, maxLength, step, badInput`, each a string or `(el) => string` | the browser's |
| `status` | `'error' \| 'warning' \| 'success'`: a helper state that tones the frame and the description and adds an icon | none |
| `onValidate` | `({ valid, status, message, value }) => void`, after every validation run | none |
| `onInvalid` | `(message, event) => void`: the browser refused to submit because of this field | none |
| `placeholder`, `autoComplete`, `inputMode`, `maxLength`, `minLength`, `pattern` | native | none |
| `multiline`, `rows`, `autosize` | a `<textarea>`; rows; grows with its content | `false`, `3`, `false` |
| `resize`, `resizeIcon` | multiline: `'vertical' \| 'none'`, a drag handle in the end corner; its icon | `'vertical'`, two lines |
| `startContent`, `endContent` | node, or a function of state (`({ hasValue, invalid, status }) => node`): an icon, a unit, a button | none |
| `clearable`, `clearLabel`, `clearIcon` | a clear button while it has a value; its name; its icon | `false`, `'Clear'`, a cross |
| `revealable`, `revealLabel` | password: a toggle button (`aria-pressed`) that shows the text | `false`, `'Show password'` |
| `showCount`, `countLabel(left)` | a count under the field ("12/80" with `maxLength`); near the limit it turns amber, at it red, and "20 characters left" is read politely once typing pauses | `false`, English |
| `labelPlacement` | `'outside' \| 'inside'`: above, or in the field rising to its top edge on focus or with a value | `'outside'` |
| `variant` | `'outline' \| 'filled' \| 'underline'` | `'outline'` |
| `size` | `'sm' \| 'md' \| 'lg'`, the same heights as a button | `'md'` (provider) |
| `dimensions` | `width, height, paddingX, radius` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label control field input startContent endContent clear reveal handle description counter error statusIcon validating`) | | |

Controller: `focus()`, `clear()`, `validate()` (a promise of whether it is valid; shows the result), `setError(message)` (an error from elsewhere, such as a server; it blocks native submit until the next edit or `clearError()`), `clearError()`.
Inactive (`inactiveInputOptions`): `type` when multiline; `rows`, `autosize`, `resize`, `resizeIcon`
unless multiline; `resize`, `resizeIcon` with `autosize`; `resizeIcon` with `resize: 'none'`;
`clearLabel`, `clearIcon` without `clearable`; `clearable` when read-only or disabled;
`labelPlacement` with `hideLabel`; `revealable` unless a single-line password; `revealLabel` without it;
`countLabel` without `showCount` and `maxLength`.

Motion: the frame takes the accent on focus and the ring fades in; `underline` grows a bar from the
centre; an inside label rises; the clear button springs in. Reduced motion and `disableAnimation`
turn it off.

## Forms
- The native element holds the value unless you pass `value`, so forms submit and reset with no help.
- `required`, `type`, `pattern` and the like validate natively. On submit the browser's own message,
  in the reader's language, shows in the error slot, and the first invalid field takes focus. Your
  `error` always wins; `nativeErrors: false` brings the bubble back.
- A form reset restores the value and clears native messages and validation results.

## Validation
The same options work on every form control (input, number field, one-time code, checkbox, radio,
switch, slider), with no form library:

- `validate(value)` returns a message (an error), nothing (valid), or `{ status: 'warning' | 'success',
  message }`. It may return a promise: the field shows a spinner (`validating` slot, `data-validating`
  on the root, `aria-busy` on the control), and a newer run makes an older result stale, so it is dropped.
- When results show, by `validateOn`: `change` as you type; `blur` (default) when the field is left
  after an edit, then live while an error shows, so it clears as it is fixed; `submit` once the form is
  submitted or `validate()` is called.
- A synchronous error is set as the native custom validity at every edit, whatever `validateOn`, so a
  plain `<form>` will not submit and `:invalid` matches. An async `validate` runs only when its result
  shows; await `Field.validate()` before submitting if the result must block.
- The browser's constraint messages (`required`, `type`, `pattern`, `minLength`...) show in the same
  place, in the reader's language, or in yours through `messages`. They show on blur after an edit
  (not when you only tab through), and on submit.
- `status: 'warning' | 'success'` (or a `validate` result with one) tones the frame and the message
  and adds an icon; it never sets `aria-invalid`. The root reflects the resolved status as
  `data-validity`.
- Order: `error` wins, then `setError`, then `validate`, then the browser's message.

```tsx
const Username = defineInput({ autoComplete: 'username', required: true, minLength: 3 });
const Password = defineInput({ type: 'password', revealable: true, required: true });

function SignUp() {
  const User = useInput({
    label: 'Username',
    name: 'user',
    messages: { required: 'Pick a username.', minLength: (el) => `At least ${el.minLength} characters.` },
    // Async: a spinner while it runs; older answers are dropped.
    validate: async (name) => ((await api.taken(name)) ? 'That name is taken.' : null),
  });
  const Pass = useInput({
    label: 'Password',
    name: 'password',
    validateOn: 'change',
    validate: (pw) => (pw.length < 8 ? 'At least 8 characters.' : /\d/.test(pw) ? { status: 'success', message: 'Strong.' } : { status: 'warning', message: 'Add a number to make it stronger.' }),
  });
  return (
    // A plain form: the browser will not submit while a field is invalid.
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!(await User.validate())) return; // wait for the async check
        const reply = await api.signUp(new FormData(e.currentTarget));
        if (reply.error) User.setError(reply.error); // shown, and blocks submit until edited
      }}
    >
      <User />
      <Pass />
      <button>Create account</button>
    </form>
  );
}
```

## Accessibility
- The drag handle is decorative (`aria-hidden`) and pointer-only, like the browser's own; it never
  goes below the height `rows` gives. `autosize` fits long text without a pointer.
- An inside label is still the real `<label>`; it sits after the input in the DOM so CSS can lift it,
  and the input keeps its name.
- A real `<label>`. A placeholder is not a name, and a missing label warns in development.
- The control's frame clears 3:1 against the surface (WCAG 1.4.11); the focus ring is on the frame.
- `required` is the native attribute; the `*` marker is hidden from screen readers.
- An error is linked, not a live region: it is read when the field takes focus, so several errors at
  once do not talk over each other. A warning or a success is linked the same way, without
  `aria-invalid`; its icon is decorative.
- While an async `validate` runs the input has `aria-busy="true"`.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Field`, `FieldLabel`, `Input`, `FieldError`, `InputGroup` | `Input` with `label`, `errorMessage` | `TextField` | `label`, `description`, `error` |
| `Textarea` | `Textarea` | `multiline` | `multiline`, `autosize` |
| | `isClearable`, `startContent` | `InputAdornment` | `clearable`, `startContent` |

## Deliberately excluded
- `type: 'number'`: spinners and locale parsing are a poor fit. Use the Number field.
- `type: 'date'`: use the Date picker.
- A strength meter for passwords: rules differ per product; put a Progress in `description`.
