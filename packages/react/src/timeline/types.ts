import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type TimelineSlot = 'root' | 'item' | 'marker' | 'connector' | 'body' | 'time' | 'title' | 'description' | 'content';
export type TimelineVariant = 'dot' | 'icon' | 'card';

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
  /** More under the text: a card, a quote, an attachment. */
  content?: React.ReactNode;
}

/** Passed to slot `render` overrides. */
export interface TimelineState {
  variant: TimelineVariant;
  orientation: 'vertical' | 'horizontal';
  size: PinfoldSize;
  tone: PinfoldTone;
}

/**
 *   const History = defineTimeline();
 *   <History label="Order history" items={[{ title: 'Ordered', time: '2026-11-02' }, { title: 'Shipped', time: '2026-11-04T09:30' }]} />
 */
/** One event as you wrote it (strings become `{ title }`), its position and whether it is pending. `render` overrides of the repeating parts get it as `item`. */
export type TimelineItemContext = TimelineItem & { index: number; pending: boolean };

export interface TimelineConfig extends SlotOverrides<TimelineSlot, TimelineState, TimelineItemContext> {
  /** Names the list of events. */
  label: string;
  items: ReadonlyArray<TimelineItem | string>;
  /** @default 'dot' */
  variant?: TimelineVariant;
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Vertical: text on one side, or alternating sides. @default 'start' */
  align?: 'start' | 'alternate';
  /** The last event is still happening: its marker pulses. @default false */
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
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TimelineRootProps) => React.ReactElement;
}
export type TimelineComponent = PinfoldComponent<TimelineApi, TimelineRootProps>;
