/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/calendar.css'.
   Server-safe barrel: `defineCalendar` here, the client module re-exported. */

export { Calendar, useCalendar } from './client';
export { Calendar as default } from './client';
export { defineCalendar, type DefinedCalendar, type CalendarPresetProps } from './define';
export type { CalendarApi, CalendarComponent, CalendarConfig, CalendarSingleConfig, CalendarRangeConfig, CalendarMultipleConfig, CalendarRootProps, CalendarTagProps, CalendarSlot, CalendarState, CalendarRange, CalendarLabels } from './types';
