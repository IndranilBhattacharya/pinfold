# Navigation menu: spec

Status: **experimental**. Pattern: [APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/).

## Usage
```tsx
import { defineNavMenu } from '@pinfold/react/navmenu';

export const SiteNav = defineNavMenu();

<SiteNav
  label="Main"
  value={pathname}
  items={[
    {
      label: 'Products',
      content: <FeaturedCard />,
      items: [
        { label: 'Analytics', href: '/analytics', description: 'Know your traffic', icon: <ChartIcon /> },
        { label: 'Automation', href: '/automation', description: 'Flows that run themselves', icon: <BoltIcon /> },
      ],
    },
    { label: 'Pricing', href: '/pricing' },
  ]}
/>
```
An entry with `items` or `content` is a button that opens a panel under it; any other entry is a
link (or a button without `href`). `value` is the current page's key (id, else href, else label).
Links go through `onNavigate`, the provider's `navigate`, or the browser. Precedence: use-site
props, the preset, `defaults.navmenu`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `items` | names the landmark; entries or strings | required |
| `value`, `defaultValue`, `onChange(key, item, event)` | the current page | none |
| `onNavigate(href, event)` | follow links yourself | provider `navigate` |
| `open`, `defaultOpen`, `onOpenChange` | the open entry's key or `null` | `null` |
| `openOn` | `hover` (and a press) or `click` | `'hover'` |
| `variant` | `ghost` tint, `underline` bar, `pills` fill | `'ghost'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `dimensions` | `columnWidth` | `'md'`, `'primary'`, `14rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root list item link trigger chevron panel content grid panelLink icon description` | |

Entry: `{ label, href?, target?, icon?, items?, content?, columns?, id?, disabled?, onClick? }`;
panel link: `{ label, href?, description?, icon?, id?, disabled?, onClick?, target? }`. `columns`
defaults to 2 with more than three links. An open panel is shifted back into the viewport; under
40rem its links stack in one column.

Controller: `value`, `open`, `setOpen(key | null)`.

## Inactive options
| Option | Inactive when |
|---|---|
| `openOn`, `open`, `defaultOpen` | no entry has a panel |

## Accessibility
- A `nav` landmark with a list; panel buttons are disclosures (`aria-expanded`, `aria-controls`).
  No `menu` roles: the entries are page links, and menus would hide them from link lists.
- `aria-current="page"` on the current link; the button whose panel holds it is marked for the eye.
- Escape closes and returns focus to the button; focus leaving the menu or a press outside closes.
- Hover opens after 120 ms and closes after 260 ms, so the pointer can cross to the panel (WCAG
  1.4.13); touch and keyboard open with a press.
- Arrow keys are an addition to Tab: Left/Right/Home/End between entries, Down into a panel,
  Up/Down inside it.

## Deliberately excluded
- One shared animated viewport that morphs between panels: panels are independent and fade.
- A phone layout: entries wrap. Put a Sidebar in a Dialog for a full mobile menu.
