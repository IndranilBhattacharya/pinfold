import * as React from 'react';
import { mergeConfig } from '../preset';
import { DatePicker } from './client';
import type { DatePickerConfig, DatePickerTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type DatePickerPresetProps<P> = DatePickerTagProps;

/** What `defineDatePicker` returns: a component with the preset baked in. */
export type DefinedDatePicker<P extends Partial<DatePickerConfig> = Partial<DatePickerConfig>> = ((props: DatePickerPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable datepicker, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const DueDate = defineDatePicker({ months: 2 });
 *
 * Props win over the preset, then `defaults.datepicker`, the provider and the library defaults.
 */
export function defineDatePicker<P extends Partial<DatePickerConfig>>(preset: P = {} as P): DefinedDatePicker<P> {
  const Defined = ((props: DatePickerPresetProps<P>) =>
    React.createElement(DatePicker, mergeConfig<DatePickerTagProps>(preset as unknown as Partial<DatePickerTagProps>, props as unknown as Partial<DatePickerTagProps>))) as DefinedDatePicker<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedDatePicker';
  return Defined;
}
