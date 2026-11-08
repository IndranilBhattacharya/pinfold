import type * as React from 'react';
import { splitProps } from '../preset';
import { DATEPICKER_KEYS } from './keys';
import { useDatePicker } from './useDatePicker';
import type { DatePickerConfig, DatePickerTagProps } from './types';

/** The date picker as a tag: the config as props, plus any attribute of the element. */
export function DatePicker(props: DatePickerTagProps): React.ReactElement {
  const [config, root] = splitProps<DatePickerConfig>(props as unknown as Record<string, unknown>, DATEPICKER_KEYS);
  return useDatePicker(config).render(root);
}
