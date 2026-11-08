import type * as React from 'react';
import { splitProps } from '../preset';
import { CALENDAR_KEYS } from './keys';
import { useCalendar } from './useCalendar';
import type { CalendarConfig, CalendarTagProps } from './types';

/** The calendar as a tag: the config as props, plus any attribute of the element. */
export function Calendar(props: CalendarTagProps): React.ReactElement {
  const [config, root] = splitProps<CalendarConfig>(props as unknown as Record<string, unknown>, CALENDAR_KEYS);
  return useCalendar(config).render(root);
}
