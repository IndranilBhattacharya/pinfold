# File upload: spec

Status: **experimental**. Pick or drop files, check them, preview them, upload them.

## Usage
```tsx
import { defineFileUpload } from '@pinfold/react/fileupload';

export const Images = defineFileUpload({ accept: 'image/*', maxSize: 5_000_000 });

<Images name="photos" maxFiles={6} />                       // a native form gets the files
<Images upload={(file, { signal, onProgress }) => send(file, { signal, onProgress })} onUploadComplete={(file, res) => save(res)} />
<Images variant="button" multiple={false} label="Upload avatar" />
```
Precedence: use-site props, the preset, `defaults.fileupload`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `description`, `icon` | the zone's title; the line under it; its icon (`null` for none) | "Drop files here or browse"; a hint from the rules; a cloud |
| `name` | name of the hidden file input, which holds the files for a native form | |
| `value` / `defaultValue` | the files held (File objects) | `[]` |
| `accept` | as for a file input: `.pdf,image/*` | any |
| `multiple` | several files; off, a new pick replaces the file | `true` |
| `maxSize`, `maxFiles` | bytes; files held at once | |
| `validate` | `(file) => string \| null`: a reason to reject | |
| `upload` | `(file, { signal, onProgress }) => Promise`; see Uploads | |
| `concurrency` | uploads at once | `3` |
| `paste` | pasting files while the upload has focus adds them | `false` |
| `disabled` | nothing can be added or removed; the zone stays focusable | `false` |
| `list`, `previews` | the file list; image thumbnails in it | `true`, `true` |
| `variant` | `'dropzone'`, `'button'` (a control with the hint beside it), `'compact'` (one line) | `'dropzone'` |
| `renderItem` | `({ item, props, children }) => node`: the content of each file row | |
| `labels` | `{ title, browse, drop, remove, retry, dismiss, queued, uploading, done, error, type, size, count }` | English |
| `dimensions` | `{ minHeight, thumbSize }` | |
| `radius`, `size`, `tone` | | theme, `'md'`, `'primary'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root zone icon title description browse input list item thumb info name meta progress actions retry remove rejections rejection` | |

`item` (in `renderItem` and file row slot overrides) is
`{ id, file, name, size, type, status, progress, error, response, preview, index, remove(), retry() }`.

## Events
| Event | Called with |
|---|---|
| `onChange` | `(files)`: files were added or removed |
| `onReject` | `(rejections)`: each `{ file, reasons, codes }`, codes from `'type' \| 'size' \| 'count' \| 'invalid'` |
| `onUploadComplete` | `(file, response)` |
| `onUploadError` | `(file, error)` |

## Behaviour
- The zone is a `<button>`: Enter, Space or a click open the file dialog. Dropping files on it is an extra; while
  files are dragged over it the zone shows `data-dragging`, and `data-invalid` when their types break `accept`.
- Every pick, drop or paste is checked: type, size, `validate`, then the count. Kept files join the list; the rest
  are listed with every reason until the next pick or Dismiss.
- Statuses: `idle` (held, no `upload`), `queued`, `uploading`, `done`, `error`. With `upload` the component runs it
  for each added file, `concurrency` at a time. `onProgress(fraction)` takes 0 to 1 (a number over 1 is read as a
  percentage). Removing a file or unmounting aborts its upload through `signal`. A failed upload shows its error
  message and a Retry button.
- Previews: image files get a thumbnail from an object URL, released when the file is removed, the value no
  longer holds it, or the component unmounts. Nothing else reads a file's contents.
- The hidden `<input type="file">` (with `name`, `accept`, `multiple`) always holds the current files where the
  browser allows setting them, so a plain form posts them.
- `useFileUpload` adds `files`, `items`, `rejections`, `dragging`, `open()`, `add(files)`, `remove(file)`,
  `retry(file)`, `clear()`, `clearRejections()` and the prop getters.

## Accessibility
- The zone is a real button named by its text and described by the hint; disabled uses `aria-disabled`.
- The file input is `aria-hidden` and out of the tab order.
- Each upload is a `progressbar` named by its file; Retry and Remove are named with the file ("Remove photo.png").
- Additions, completions and failures are announced in a polite live region; rejections are a `status` region.
- Forced colours: the system highlight for the drag state and progress.
