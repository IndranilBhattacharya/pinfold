# Timeline: spec

Status: **experimental**. Pattern: an ordered list.

## Usage
```tsx
import { defineTimeline } from '@pinfold/react/timeline';

export const History = defineTimeline();

// An order history: the last event is still happening
<History label="Order history" pending items={[
  { title: 'Ordered', time: '2026-11-02T10:15' },
  { title: 'Shipped', time: '2026-11-04', tone: 'success' },
  'Out for delivery',
]} />

// A status per event: it colours the marker and the line after it, and is read after the title
<History label="Deployment" variant="icon" connector="joined" items={[
  { title: 'Build', status: 'complete' },
  { title: 'Tests', status: 'error', description: '2 failed' },
  { title: 'Deploy', status: 'upcoming' },
]} />

// Times on one side of the line, the text on the other
<History label="Activity" timePlacement="opposite" items={events} />

// Alternating sides, with your own content opposite each event
<History label="Roadmap" align="alternate" variant="card" items={[
  { title: 'Beta', opposite: 'Q1', content: <Notes /> },
  { title: 'Launch', opposite: 'Q2' },
]} />

// Your own markers (avatars, numbers): per item, or one function for all
<History label="Comments" marker={(item) => <Avatar name={item.author} size="sm" />}
  dimensions={{ markerSize: 24 }} items={comments} />

// Collapsible details, clickable events
<History label="Audit log" collapsible items={entries} onItemClick={(item) => open(item.index)} />
```
Precedence: use-site props, the preset, `defaults.timeline`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the list | required |
| `items` | strings, or `{ title, description?, time?, icon?, tone?, content?, status?, marker?, opposite?, open?, defaultOpen? }`; ISO times show in the locale | required |
| `variant` | `'dot' \| 'icon' \| 'card'` | `'dot'` |
| `orientation` | `'vertical' \| 'horizontal'` (a row that scrolls when long) | `'vertical'` |
| `align` | `'start'` (text on one side) \| `'alternate'` (left and right, or above and below in a row); a vertical timeline narrower than 34rem puts everything on one side | `'start'` |
| `connector` | `'gap'` (the line stops a little short of each marker) \| `'joined'` (it touches them) \| `'dashed'` \| `'none'` | `'gap'` |
| `density` | `'comfortable' \| 'compact'` (less space, smaller icon markers and card padding) | `'comfortable'` |
| `timePlacement` | `'above'` the title \| `'below'` the text \| `'opposite'` (the other side of the line) | `'above'` |
| `marker` | `(item) => node`: every marker's content; an item's own `marker` (node or function) wins | none |
| `collapsible`, `onOpenChange(item, open, event)` | events with `content` show it when their title (a button) is pressed; item `open` (controlled) / `defaultOpen` | `false` |
| `onItemClick(item, event)` | each title becomes a button; a card is clickable as a whole | none |
| `pending` | the last event is still happening (pulses, current); earlier events without a `status` count as complete | `false` |
| `reverse`, `locale` | newest first; the locale of ISO times | `false`, the browser's |
| `labels` | `{ status: { complete, current, upcoming, error } }` read after a title | "done", "current", "not started", "error" |
| `dimensions` | `markerSize, lineWidth, gap` (between events), `oppositeWidth` (with `align: 'start'`, default a quarter) | from the size |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root item marker connector opposite body time title description content`) | | |

Item `status`: `complete` fills the marker (a check in the icon and card variants) and colours the
line to the next event; `current` rings it; `upcoming` is hollow and muted; `error` uses the danger
tone (an alert mark). The line takes the status of the earlier of the two events it joins, also
with `reverse`.

Controller: `setOpen(index, open)` for collapsible events (by position as shown). `render`
overrides of the repeating parts, `marker` functions and the callbacks get `item`: the event as
written plus `index`, `status`, `pending`, `open`, `first`, `last`.

Inactive (`inactiveTimelineOptions`): `radius` unless `variant: 'card'` (dots and icons are round);
`collapsible` when no event has `content`; `onOpenChange` without `collapsible`.

## Layout
Each event is a grid: the marker column, the text, and the opposite column when there is opposite
content. The marker and the line share the marker column and are both centred in it, so the line
runs through the centre of every marker in every variant, size, orientation, alignment and in
right-to-left text. The marker sits on the first line of the text (the card's first line in the
card variant). A marker of your own sizes to its content and stays centred on the line; give
`dimensions.markerSize` its size to centre it on the first line of text as well.

## Accessibility
- An ordered list named by `label`.
- Times are `<time datetime>`, shown in the reader's locale.
- A current event (`status: 'current'`, or the pending one) has `aria-current="step"`. A status you
  set is read after the title as hidden text, never colour alone. Markers and lines are decorative.
- With `collapsible`, the title is a button with `aria-expanded` and `aria-controls`; the content is
  `hidden` while closed. With `onItemClick`, the title is a button.
