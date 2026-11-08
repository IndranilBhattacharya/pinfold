import type * as React from 'react';
import type { IsoDate, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type CalendarSlot = 'root' | 'header' | 'title' | 'previous' | 'next' | 'months' | 'grid' | 'weekday' | 'day' | 'footer' | 'today';

/** A chosen span of days, both ends included. */
export interface CalendarRange {
  start: IsoDate;
  end: IsoDate;
}

/** Text read and shown, for translation. */
export interface CalendarLabels {
  /** @default 'Previous month' */
  previous?: string;
  /** @default 'Next month' */
  next?: string;
  /** @default 'Today' */
  today?: string;
}

/** Passed to slot `render` overrides. */
export interface CalendarState {
  mode: 'single' | 'range' | 'multiple';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The first visible month (its first day). */
  month: IsoDate;
}

interface CalendarShared extends SlotOverrides<CalendarSlot, CalendarState> {
  /** Names the calendar. @default 'Calendar' */
  label?: string;
  /** The earliest day that can be chosen. */
  min?: IsoDate;
  /** The latest day that can be chosen. */
  max?: IsoDate;
  /** Days that cannot be chosen: `(date) => boolean`, e.g. weekends. */
  isDateDisabled?: (date: IsoDate) => boolean;
  /** The visible month (any day in it), controlled. */
  month?: IsoDate;
  /** The visible month at first. Default the chosen day's month, else today's. */
  defaultMonth?: IsoDate;
  onMonthChange?: (month: IsoDate) => void;
  /** Months shown side by side. @default 1 */
  months?: 1 | 2 | 3;
  /** A BCP 47 locale for names and the week start. Default the browser's. */
  locale?: string;
  /** 0 Sunday … 6 Saturday. Default the locale's. */
  weekStart?: number;
  /** Days of the next and previous month fill the grid. @default true */
  showOutsideDays?: boolean;
  /** A "Today" button under the grid. @default false */
  showToday?: boolean;
  labels?: CalendarLabels;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface CalendarSingleConfig extends CalendarShared {
  /** One day, a range, or several days. @default 'single' */
  mode?: 'single';
  /** The chosen day, controlled; `null` for none. */
  value?: IsoDate | null;
  defaultValue?: IsoDate;
  onChange?: (value: IsoDate) => void;
}

export interface CalendarRangeConfig extends CalendarShared {
  mode: 'range';
  value?: CalendarRange | null;
  defaultValue?: CalendarRange;
  onChange?: (value: CalendarRange) => void;
}

export interface CalendarMultipleConfig extends CalendarShared {
  mode: 'multiple';
  value?: readonly IsoDate[];
  defaultValue?: readonly IsoDate[];
  onChange?: (value: IsoDate[]) => void;
}

/**
 *   const Picker = defineCalendar();
 *   <Picker value={day} onChange={setDay} min="2026-11-01" />
 *   <Picker mode="range" months={2} value={stay} onChange={setStay} isDateDisabled={booked} />
 */
export type CalendarConfig = CalendarSingleConfig | CalendarRangeConfig | CalendarMultipleConfig;

export type CalendarRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type CalendarTagProps = CalendarConfig & Omit<CalendarRootProps, keyof CalendarShared | 'mode' | 'value' | 'defaultValue' | 'onChange'>;

export interface CalendarApi {
  /** The first visible month. */
  month: IsoDate;
  /** Show the month a day is in. */
  setMonth: (date: IsoDate) => void;
  /** Focus the focused day (the chosen one, else today). */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CalendarRootProps) => React.ReactElement;
}
export type CalendarComponent = PinfoldComponent<CalendarApi, CalendarRootProps>;
