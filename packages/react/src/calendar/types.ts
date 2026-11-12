import type * as React from 'react';
import type { CalendarPresetName, IsoDate, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type CalendarSlot =
  | 'root'
  | 'header'
  | 'title'
  | 'monthButton'
  | 'yearButton'
  | 'monthSelect'
  | 'yearSelect'
  | 'previous'
  | 'next'
  | 'body'
  | 'presets'
  | 'preset'
  | 'months'
  | 'grid'
  | 'weekday'
  | 'weekNumber'
  | 'day'
  | 'dayContent'
  | 'cell'
  | 'footer'
  | 'today';

/** What is picked: a day, a month (its first day) or a year (its first day). */
export type CalendarGranularity = 'day' | 'month' | 'year';

/** A preset in the side list: a name (`'last7'`, `'thisMonth'`...) or your own label and value. */
export type CalendarPreset = CalendarPresetName | { label: string; value: IsoDate | CalendarRange | (() => IsoDate | CalendarRange) };

/** What `isDateDisabled` knows besides the day: the mode, and the start of a range being picked. */
export interface CalendarDateContext {
  mode: 'single' | 'range' | 'multiple';
  /** A range in progress: its first day (so the end can depend on it). */
  start: IsoDate | null;
}

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
  /** The month dropdown. @default 'Month' */
  month?: string;
  /** The year dropdown. @default 'Year' */
  year?: string;
  /** The week number column's header. @default 'Wk' */
  week?: string;
  /** The preset list. @default 'Presets' */
  presets?: string;
  /** After the month's name on the caption button. @default 'choose a month' */
  chooseMonth?: string;
  /** After the year on the caption button. @default 'choose a year' */
  chooseYear?: string;
}

/** Passed to slot `render` overrides. */
export interface CalendarState {
  mode: 'single' | 'range' | 'multiple';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The first visible month (its first day). */
  month: IsoDate;
  granularity: CalendarGranularity;
  /** What the grid shows right now: days, or the months or years the caption opened. */
  view: CalendarGranularity;
}

/** One day of the grid and its state. `render` overrides of the repeating parts get it as `item`. */
export type CalendarDayContext = { date: IsoDate; outside: boolean; disabled: boolean; selected: boolean; today: boolean; rangeStart: boolean; rangeEnd: boolean };

interface CalendarShared extends SlotOverrides<CalendarSlot, CalendarState, CalendarDayContext> {
  /** Names the calendar. @default 'Calendar' */
  label?: string;
  /** The earliest day that can be chosen. */
  min?: IsoDate;
  /** The latest day that can be chosen. */
  max?: IsoDate;
  /** Days that cannot be chosen: `(date) => boolean`. Runs with `disabledDates` and `disabledWeekdays`. */
  isDateDisabled?: (date: IsoDate, context: CalendarDateContext) => boolean;
  /** Days that cannot be chosen, as data: days and `{ start, end }` spans (holidays, booked nights). */
  disabledDates?: ReadonlyArray<IsoDate | CalendarRange>;
  /** Weekdays that cannot be chosen: 0 Sunday … 6 Saturday (`[0, 6]` for weekends). */
  disabledWeekdays?: readonly number[];
  /** Pick a day, a month or a year. @default 'day' */
  granularity?: CalendarGranularity;
  /**
   * The header. `'buttons'`: the month and the year are buttons that open a grid of months and of
   * years in place, so a day, a month and a year are all chosen in one calendar. `'dropdown'`: two
   * selects. `'label'`: plain text and arrows. @default 'buttons'
   */
  captionLayout?: 'buttons' | 'dropdown' | 'label';
  /** Years the year dropdown (and the year grid) offers. Default `min`/`max` years, else 100 back and 20 ahead. */
  yearRange?: readonly [number, number];
  /** ISO week numbers before each week. @default false */
  showWeekNumbers?: boolean;
  /** Something under a day's number: a price, a dot for events. */
  dayContent?: (date: IsoDate) => React.ReactNode;
  /** Quick picks beside the months: names (`'today'`, `'last7'`, `'thisMonth'`...) or `{ label, value }`. */
  presets?: readonly CalendarPreset[];
  /** A range: fewest days it may cover (both ends counted). */
  minDays?: number;
  /** A range: most days it may cover. */
  maxDays?: number;
  /** A range may cover days that cannot be chosen (they are skipped, not chosen). @default false */
  allowDisabledInRange?: boolean;
  /** A range's first day was picked. */
  onRangeStart?: (date: IsoDate) => void;
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
  /** Content under the grid, in the footer: actions, a time field. */
  footer?: React.ReactNode;
  labels?: CalendarLabels;
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
  /** What the grid shows: days, or the months or years the caption opened. */
  view: CalendarGranularity;
  /** Zoom out to months or years, or back in (never closer than `granularity`). */
  setView: (view: CalendarGranularity) => void;
  /** Show the month a day is in. */
  setMonth: (date: IsoDate) => void;
  /** Focus the focused day (the chosen one, else today). */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CalendarRootProps) => React.ReactElement;
}
export type CalendarComponent = PinfoldComponent<CalendarApi, CalendarRootProps>;
