import * as React from 'react';
import { mergeConfig } from '../preset';
import { Calendar } from './client';
import type { CalendarConfig, CalendarTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type CalendarPresetProps<P> = CalendarTagProps;

/** What `defineCalendar` returns: a component with the preset baked in. */
export type DefinedCalendar<P extends Partial<CalendarConfig> = Partial<CalendarConfig>> = ((props: CalendarPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable calendar, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Booking = defineCalendar({ weekStart: 1 });
 *
 * Props win over the preset, then `defaults.calendar`, the provider and the library defaults.
 */
export function defineCalendar<P extends Partial<CalendarConfig>>(preset: P = {} as P): DefinedCalendar<P> {
  const Defined = ((props: CalendarPresetProps<P>) =>
    React.createElement(Calendar, mergeConfig<CalendarTagProps>(preset as unknown as Partial<CalendarTagProps>, props as unknown as Partial<CalendarTagProps>))) as DefinedCalendar<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCalendar';
  return Defined;
}
