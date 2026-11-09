import type * as React from 'react';
import type { IsoDate, Length, OverlayPlacement, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { FieldConfig } from '../field';
import type { SlotOverrides } from '../types';
import type { CalendarRange } from '../calendar/types';

export type DatePickerSlot = 'root' | 'label' | 'control' | 'input' | 'clear' | 'trigger' | 'popup' | 'description' | 'error';

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
}

interface DatePickerShared extends FieldConfig, SlotOverrides<DatePickerSlot, DatePickerState> {
  min?: IsoDate;
  max?: IsoDate;
  /** Days that cannot be chosen. */
  isDateDisabled?: (date: IsoDate) => boolean;
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
  /** The chosen day ("2026-11-08"), controlled; `null` for none. */
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
