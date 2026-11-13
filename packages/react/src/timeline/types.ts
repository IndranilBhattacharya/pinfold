import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type TimelineSlot = 'root' | 'item' | 'marker' | 'connector' | 'opposite' | 'body' | 'time' | 'title' | 'description' | 'content';
export type TimelineVariant = 'dot' | 'icon' | 'card';
/** Where an event stands. */
export type TimelineStatus = 'complete' | 'current' | 'upcoming' | 'error';
export type TimelineConnector = 'gap' | 'joined' | 'dashed' | 'none';

/** One event. A string is an event with that title. */
export interface TimelineItem {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** When: an ISO date or date-time (shown in the locale), or your own text. */
  time?: string;
  /** In the marker. */
  icon?: React.ReactNode;
  /** This event's colour. */
  tone?: PinfoldTone;
  /** More under the text: a card, a quote, an attachment. With `collapsible`, hidden until the title is pressed. */
  content?: React.ReactNode;
  /** Where the event stands: `complete` fills the marker and colours the line after it, `current` rings it, `upcoming` is hollow and muted, `error` uses the danger tone. */
  status?: TimelineStatus;
  /** Replaces the marker's content: a node, or `(item) => node`. The marker drops its own fill. */
  marker?: React.ReactNode | ((item: TimelineItemContext) => React.ReactNode);
  /** On the other side of the line: a time, an amount, a note. */
  opposite?: React.ReactNode;
  /** With `collapsible`: whether `content` shows, controlled. */
  open?: boolean;
  /** With `collapsible`: whether `content` shows at first. */
  defaultOpen?: boolean;
}

/** Text read, for translation. */
export interface TimelineLabels {
  /** Read after the title of an event with a `status`. Default "done", "current", "not started", "error". */
  status?: Partial<Record<TimelineStatus, string>>;
}

export interface TimelineDimensions {
  /** Marker diameter (and the width of the marker column). */
  markerSize?: Length;
  /** Thickness of the line. */
  lineWidth?: Length;
  /** Space between events. */
  gap?: Length;
  /** Width of the opposite column with `align: 'start'`. Default a quarter of the width. */
  oppositeWidth?: Length;
}

/** Passed to slot `render` overrides. */
export interface TimelineState {
  variant: TimelineVariant;
  orientation: 'vertical' | 'horizontal';
  align: 'start' | 'alternate';
  connector: TimelineConnector;
  density: 'comfortable' | 'compact';
  size: PinfoldSize;
  tone: PinfoldTone;
}

/**
 * One event as you wrote it (strings become `{ title }`), its position, its status and whether it
 * is pending or open. `render` overrides of the repeating parts, `marker` functions and the event
 * callbacks get it.
 */
export type TimelineItemContext = TimelineItem & {
  /** Position as shown (after `reverse`). */
  index: number;
  pending: boolean;
  /** The status as resolved: the item's own, or from `pending`. */
  status?: TimelineStatus;
  /** With `collapsible`: whether the content shows. */
  open: boolean;
  first: boolean;
  last: boolean;
};

/**
 *   const History = defineTimeline();
 *   <History label="Order history" items={[{ title: 'Ordered', time: '2026-11-02' }, { title: 'Shipped', time: '2026-11-04T09:30' }]} />
 */
export interface TimelineConfig extends SlotOverrides<TimelineSlot, TimelineState, TimelineItemContext> {
  /** Names the list of events. */
  label: string;
  items: ReadonlyArray<TimelineItem | string>;
  /** @default 'dot' */
  variant?: TimelineVariant;
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Text on one side of the line, or alternating sides (left and right, or above and below in a row). @default 'start' */
  align?: 'start' | 'alternate';
  /** The line between markers: a little short of each marker, touching them, dashed, or none. Always centred on the markers. @default 'gap' */
  connector?: TimelineConnector;
  /** @default 'comfortable' */
  density?: 'comfortable' | 'compact';
  /** The time above the title, below the text, or on the other side of the line. @default 'above' */
  timePlacement?: 'above' | 'below' | 'opposite';
  /** The content of every marker: `(item) => node`. An item's own `marker` wins. */
  marker?: (item: TimelineItemContext) => React.ReactNode;
  /** Events with `content` show it only when their title (a button) is pressed. @default false */
  collapsible?: boolean;
  /** A collapsible event opened or closed. */
  onOpenChange?: (item: TimelineItemContext, open: boolean, event: React.SyntheticEvent) => void;
  /** Each title becomes a button (a card is clickable as a whole). */
  onItemClick?: (item: TimelineItemContext, event: React.MouseEvent) => void;
  labels?: TimelineLabels;
  dimensions?: TimelineDimensions;
  /** The last event is still happening: its marker pulses, it is current, and earlier events without a `status` count as complete. @default false */
  pending?: boolean;
  /** Newest first. @default false */
  reverse?: boolean;
  /** A BCP 47 locale for ISO times. Default the browser's. */
  locale?: string;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TimelineRootProps = Omit<React.HTMLAttributes<HTMLOListElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type TimelineTagProps = TimelineConfig & Omit<TimelineRootProps, keyof TimelineConfig>;

export interface TimelineApi {
  /** Open or close a collapsible event by its position as shown. */
  setOpen: (index: number, open: boolean) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TimelineRootProps) => React.ReactElement;
}
export type TimelineComponent = PinfoldComponent<TimelineApi, TimelineRootProps>;
