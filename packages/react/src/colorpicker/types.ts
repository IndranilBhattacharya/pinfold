import type * as React from 'react';
import type { ColorFormat, PinfoldSize, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { FieldStatus, FieldValidationApi, FieldValidationConfig } from '../field';

export type ColorPickerSlot = 'root' | 'area' | 'thumb' | 'controls' | 'hue' | 'alpha' | 'preview' | 'eyedropper' | 'field' | 'input' | 'swatches' | 'swatchGroup' | 'swatchLabel' | 'swatch' | 'description' | 'error' | 'statusIcon' | 'validating';
export type ColorPickerFormat = ColorFormat;

/** The colour in every form, passed to `onChange`. */
export interface ColorPickerValue {
  /** `#rrggbb`, or `#rrggbbaa` below full opacity. */
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
  /** 0–1. */
  alpha: number;
}

/** Passed to slot `render` overrides. */
export interface ColorPickerState {
  size: PinfoldSize;
  /** The colour as text in `format`. */
  value: string;
  disabled: boolean;
  invalid: boolean;
  /** The resolved status: an error, or a warning or success from `status` or `validate`. */
  status: FieldStatus | null;
  /** An async `validate` is running. */
  validating: boolean;
}

/** A swatch: a colour, or a colour with its own name ("Brand blue"). */
export type ColorPickerSwatch = string | { value: string; label?: string };

/** A named row of swatches: `{ label: 'Brand', colors: ['#4f46e5', '#0ea5e9'] }`. */
export interface ColorPickerSwatchGroup {
  label: string;
  colors: readonly ColorPickerSwatch[];
}

/**
 *   const BrandColor = defineColorPicker({ format: 'oklch', alpha: true });
 *   <BrandColor label="Brand colour" value={color} onChange={setColor} swatches={['#4f46e5', '#0ea5e9']} />
 */
export interface ColorPickerConfig extends Pick<FieldValidationConfig<string>, 'error' | 'validate' | 'validateOn' | 'onValidate' | 'status'>, SlotOverrides<ColorPickerSlot, ColorPickerState, ColorPickerSwatchContext> {
  /** Names the picker, e.g. "Brand colour". */
  label: string;
  /** Any CSS colour in hex, rgb(), hsl() or oklch(), controlled. */
  value?: string;
  /** @default '#6366f1' */
  defaultValue?: string;
  /** `(value, color)`: the value in `format`, and the colour in every form. */
  onChange?: (value: string, color: ColorPickerValue) => void;
  /** How the value is written, in the text field and to `onChange`. @default 'hex' */
  format?: ColorPickerFormat;
  /** An opacity slider. @default false */
  alpha?: boolean;
  /**
   * Colours one press away: colours, named colours `{ value, label }`, or named rows of them
   * `{ label: 'Brand', colors: [...] }` (presets).
   */
  swatches?: ReadonlyArray<ColorPickerSwatch | ColorPickerSwatchGroup>;
  /** Help text under the picker, linked with `aria-describedby`. */
  description?: React.ReactNode;
  /** Marks the picker invalid without a message. @default false */
  invalid?: boolean;
  /** The text field for typing or pasting a colour. @default true */
  showInput?: boolean;
  /** A button that picks a colour from the screen, where the browser can (EyeDropper API). @default true */
  eyeDropper?: boolean;
  /** Submits the value with a form. */
  name?: string;
  /** @default false */
  disabled?: boolean;
  /** Text read and shown, for translation. */
  labels?: { area?: string; hue?: string; alpha?: string; input?: string; eyeDropper?: string; swatches?: string };
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ColorPickerRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type ColorPickerTagProps = ColorPickerConfig & Omit<ColorPickerRootProps, keyof ColorPickerConfig>;

/** One swatch, as a `render.swatch` override gets it. */
export interface ColorPickerSwatchContext {
  /** The colour as written. */
  value: string;
  /** Its name: its `label`, else the colour. */
  label: string;
  /** The colour is the current one. */
  selected: boolean;
  /** Its row's label, for a swatch in a group. */
  group?: string;
  index: number;
}

export interface ColorPickerApi extends FieldValidationApi {
  /** The colour as text in `format`. */
  value: string;
  /** Set it from any CSS colour; ignored when it does not parse. */
  setValue: (color: string) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ColorPickerRootProps) => React.ReactElement;
}
export type ColorPickerComponent = PinfoldComponent<ColorPickerApi, ColorPickerRootProps>;
