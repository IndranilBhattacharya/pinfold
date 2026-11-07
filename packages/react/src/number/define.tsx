import * as React from 'react';
import { mergeConfig } from '../preset';
import { NumberField } from './client';
import type { NumberFieldConfig, NumberFieldTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type NumberFieldPresetProps<P> = NumberFieldTagProps;

/** What `defineNumberField` returns: a component with the preset baked in. */
export type DefinedNumberField<P extends Partial<NumberFieldConfig> = Partial<NumberFieldConfig>> = ((props: NumberFieldPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable number field, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Quantity = defineNumberField({ min: 1, max: 99 });
 *
 * Props win over the preset, then `defaults.number`, the provider and the library defaults.
 */
export function defineNumberField<P extends Partial<NumberFieldConfig>>(preset: P = {} as P): DefinedNumberField<P> {
  const Defined = ((props: NumberFieldPresetProps<P>) =>
    React.createElement(NumberField, mergeConfig<NumberFieldTagProps>(preset as unknown as Partial<NumberFieldTagProps>, props as unknown as Partial<NumberFieldTagProps>))) as DefinedNumberField<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedNumberField';
  return Defined;
}
