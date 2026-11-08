/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/datepicker.css'.
   Server-safe barrel: `defineDatePicker` here, the client module re-exported. */

export { DatePicker, useDatePicker } from './client';
export { DatePicker as default } from './client';
export { defineDatePicker, type DefinedDatePicker, type DatePickerPresetProps } from './define';
export type { DatePickerApi, DatePickerComponent, DatePickerConfig, DatePickerSingleConfig, DatePickerRangeConfig, DatePickerRootProps, DatePickerTagProps, DatePickerSlot, DatePickerState, DatePickerLabels, DatePickerDimensions } from './types';
