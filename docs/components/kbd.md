# Kbd: spec

Status: **experimental**. Semantics: [the `kbd` element](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-kbd-element).

## Usage
```tsx
import { defineKbd } from '@pinfold/react/kbd';

export const Shortcut = defineKbd({ size: 'sm' });

<Shortcut keys={['mod', 'k']} />           // ⌘K on a Mac, Ctrl + K elsewhere
<Shortcut keys={['shift', 'enter']} />     // ⇧↵ / Shift + Enter
```
`useKbd(config)` and `<Kbd {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.kbd`, the provider (size), the library default.

## Keys
`mod` is Command on Apple platforms and Ctrl elsewhere. Named keys get symbols and spoken names:
`cmd ctrl alt shift enter esc tab backspace delete space up down left right pageup pagedown home end`
(aliases: `meta command control option opt return escape del arrowup…`). Anything else shows as
written (single characters upper-cased): `['mod', 'shift', 'p']`, `['F5']`.

## Config
| Key | Type | Default |
|---|---|---|
| `keys` | `string[]` | required |
| `variant` | `'outline' \| 'solid' \| 'ghost'` | `'outline'` (a keycap) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `display` | `'auto' \| 'symbols' \| 'text'`; `auto`: symbols on Apple platforms | `'auto'` |
| `separator` | `string`, between keys in text display | `'+'` |
| `dimensions` | `height, paddingX, gap, fontSize` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root key separator`) | | |

## Accessibility and SSR
- A combination is a `<kbd>` holding one `<kbd>` per key (HTML spec).
- Every symbol and abbreviation keeps its spoken name in visually hidden text ("Command", "Control"),
  so a screen reader never says "⌘" as nothing or spells C-T-R-L.
- The server cannot know the platform. The server HTML and the first client render show `Ctrl`;
  after hydration an Apple device switches to `⌘`, with no hydration mismatch (tested).

## Compared with shadcn/ui and HeroUI
| shadcn/ui | HeroUI | Pinfold |
|---|---|---|
| `<Kbd>⌘</Kbd>` per key, `KbdGroup` | `keys={['command']}` | `keys={['mod', 'k']}`: one config, platform aware |
| | symbols always | `display`: auto, symbols, text |
| no spoken names | `abbr` titles | visually hidden spoken names |

## Deliberately excluded
- Listening for the shortcut (Kbd displays it; key handling belongs to the component that acts on it).
