import type * as React from 'react';
import type { DateValueFormat, IsoDate, Length, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';
import type { CalendarDateContext, CalendarGranularity, CalendarPreset, CalendarRange } from '../calendar/types';

export type DatePickerSlot = 'root' | 'label' | 'control' | 'input' | 'clear' | 'trigger' | 'popup' | 'time' | 'timeInput' | 'timeZone' | 'timeZoneSelect' | 'done' | 'description' | 'error';

/** Passed to slot `render` overrides. */
export interface DatePickerState {
  mode: 'single' | 'range';
  variant: 'outline' | 'filled' | 'underline';
  size: PinfoldSize;
  tone: PinfoldTone;
  open: boolean;
  invalid: boolean;
  disabled: boolean;
}

export interface DatePickerDimensions {
  /** Width of the field. */
  width?: Length;
}

/** Text read and shown, for translation. */
export interface DatePickerLabels {
  /** @default 'Choose a date' */
  open?: string;
  /** @default 'Clear' */
  clear?: string;
  /** Shown when typed text is not a date. Default "Enter a date like 08/11/2026" in the locale's order. */
  invalid?: string;
  /** The time field. @default 'Time' */
  time?: string;
  /** A range's first time field. @default 'Start time' */
  startTime?: string;
  /** A range's second time field. @default 'End time' */
  endTime?: string;
  /** Closes the popup when a time is shown. @default 'Done' */
  done?: string;
  /** The zone list. @default 'Time zone' */
  timeZone?: string;
}

interface DatePickerShared extends FieldConfig, SlotOverrides<DatePickerSlot, DatePickerState> {
  min?: IsoDate;
  max?: IsoDate;
  /** Days that cannot be chosen: `(date, { mode, start }) => boolean` (`start`: a range's first pick). */
  isDateDisabled?: (date: IsoDate, context: CalendarDateContext) => boolean;
  /** Pick a day, a month or a year. @default 'day' */
  granularity?: CalendarGranularity;
  /** The calendar's header: month and year buttons that open month and year grids, two dropdowns, or plain text. @default 'buttons' */
  captionLayout?: 'buttons' | 'dropdown' | 'label';
  /** Days that cannot be chosen, as data: days and `{ start, end }` spans. */
  disabledDates?: ReadonlyArray<IsoDate | CalendarRange>;
  /** Weekdays that cannot be chosen: 0 Sunday … 6 Saturday. */
  disabledWeekdays?: readonly number[];
  /** Years the year dropdown offers, `[from, to]`. */
  yearRange?: readonly [number, number];
  /** ISO week numbers in the calendar. @default false */
  showWeekNumbers?: boolean;
  /** Something under a day's number: a price, an event dot. */
  dayContent?: (date: IsoDate) => React.ReactNode;
  /** Quick picks beside the calendar: names (`'last7'`, `'thisMonth'`...) or `{ label, value }`. */
  presets?: readonly CalendarPreset[];
  /** A range: fewest days it may cover. */
  minDays?: number;
  /** A range: most days it may cover. */
  maxDays?: number;
  /** A range may cover days that cannot be chosen. @default false */
  allowDisabledInRange?: boolean;
  /** A range's first day was picked. */
  onRangeStart?: (date: IsoDate) => void;
  /** A time with the day: values become "2026-11-09T14:30" (a wall time, no zone). @default false */
  time?: boolean;
  /** Minutes between the times offered. @default 1 */
  timeStep?: number;
  /** 12 or 24 hours. Default the locale's. */
  hourCycle?: 12 | 24;
  /** With `time`: the earliest time of day, "09:00". */
  minTime?: string;
  /** With `time`: the latest time of day, "18:00". */
  maxTime?: string;
  /**
   * With `time`: the zone the date and time are shown and chosen in ("Asia/Kolkata"), controlled.
   * Default the reader's own zone.
   */
  timeZone?: string;
  /** The zone at first, when people can change it. */
  defaultTimeZone?: string;
  /** People chose another zone. */
  onTimeZoneChange?: (timeZone: string) => void;
  /** With `time`: a list in the popup to choose the zone. @default false */
  showTimeZone?: boolean;
  /** The zones that list offers. Default every zone the browser knows. */
  timeZones?: readonly string[];
  /**
   * With `time`: how the value is stored and handed to `onChange`. `'wall'`: "2026-11-09T14:30", what
   * the clock shows, no zone. `'utc'`: the instant, "2026-11-09T09:00:00.000Z". `'offset'`: the clock
   * with its offset, "2026-11-09T14:30:00+05:30". A value in any of these forms is read. @default 'wall'
   */
  valueFormat?: DateValueFormat;
  /** A BCP 47 locale for the shown date, typing order and the calendar. Default the browser's. */
  locale?: string;
  /** 0 Sunday … 6 Saturday. Default the locale's. */
  weekStart?: number;
  /** How the chosen date is shown: `Intl.DateTimeFormat` options. Default `dateStyle: 'medium'`. */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** Months in the popup. @default 1 */
  months?: 1 | 2 | 3;
  /** A "Today" button in the popup. @default false */
  showToday?: boolean;
  /** @default false */
  clearable?: boolean;
  /** Default the locale's numeric pattern, e.g. "dd/mm/yyyy". */
  placeholder?: string;
  labels?: DatePickerLabels;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** @default 'bottom-start' */
  placement?: OverlayPlacement;
  /** @default 'outline' */
  variant?: 'outline' | 'filled' | 'underline';
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: DatePickerDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface DatePickerSingleConfig extends DatePickerShared {
  /** One day or a range. @default 'single' */
  mode?: 'single';
  /** The chosen day ("2026-11-08"; "2026-11-08T14:30" with `time`), controlled; `null` for none. */
  value?: IsoDate | null;
  defaultValue?: IsoDate;
  onChange?: (value: IsoDate | null) => void;
}

export interface DatePickerRangeConfig extends DatePickerShared {
  mode: 'range';
  value?: CalendarRange | null;
  defaultValue?: CalendarRange;
  onChange?: (value: CalendarRange | null) => void;
}

/**
 *   const DateField = defineDatePicker();
 *   <DateField label="Due date" value={due} onChange={setDue} min={today} />
 *   <DateField label="Stay" mode="range" months={2} value={stay} onChange={setStay} />
 */
export type DatePickerConfig = DatePickerSingleConfig | DatePickerRangeConfig;

export type DatePickerRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type DatePickerTagProps = DatePickerConfig & Omit<DatePickerRootProps, keyof DatePickerShared | 'mode' | 'value' | 'defaultValue' | 'onChange'>;

export interface DatePickerApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: DatePickerRootProps) => React.ReactElement;
}
export type DatePickerComponent = PinfoldComponent<DatePickerApi, DatePickerRootProps>;
