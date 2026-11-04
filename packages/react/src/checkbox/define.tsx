import * as React from 'react';
import { mergeConfig } from '../preset';
import { Checkbox } from './client';
import type { CheckboxConfig, CheckboxTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type CheckboxPresetProps<P> = CheckboxTagProps;

/** What `defineCheckbox` returns: a component with the preset baked in. */
export type DefinedCheckbox<P extends Partial<CheckboxConfig> = Partial<CheckboxConfig>> = ((props: CheckboxPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable checkbox, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Terms = defineCheckbox({ required: true });
 *
 * Props win over the preset, then `defaults.checkbox`, the provider and the library defaults.
 */
export function defineCheckbox<P extends Partial<CheckboxConfig>>(preset: P = {} as P): DefinedCheckbox<P> {
  const Defined = ((props: CheckboxPresetProps<P>) =>
    React.createElement(Checkbox, mergeConfig<CheckboxTagProps>(preset as unknown as Partial<CheckboxTagProps>, props as unknown as Partial<CheckboxTagProps>))) as DefinedCheckbox<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCheckbox';
  return Defined;
}
