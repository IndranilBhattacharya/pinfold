import * as React from 'react';
import { mergeConfig } from '../preset';
import { ColorPicker } from './client';
import type { ColorPickerConfig, ColorPickerTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type ColorPickerPresetProps<P> = ColorPickerTagProps;

/** What `defineColorPicker` returns: a component with the preset baked in. */
export type DefinedColorPicker<P extends Partial<ColorPickerConfig> = Partial<ColorPickerConfig>> = ((props: ColorPickerPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable colorpicker, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const BrandColor = defineColorPicker({ format: 'oklch', alpha: true });
 *
 * Props win over the preset, then `defaults.colorpicker`, the provider and the library defaults.
 */
export function defineColorPicker<P extends Partial<ColorPickerConfig>>(preset: P = {} as P): DefinedColorPicker<P> {
  const Defined = ((props: ColorPickerPresetProps<P>) =>
    React.createElement(ColorPicker, mergeConfig<ColorPickerTagProps>(preset as unknown as Partial<ColorPickerTagProps>, props as unknown as Partial<ColorPickerTagProps>))) as DefinedColorPicker<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedColorPicker';
  return Defined;
}
