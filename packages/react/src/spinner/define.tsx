import * as React from 'react';
import { mergeConfig } from '../preset';
import { Spinner } from './client';
import type { SpinnerConfig, SpinnerTagProps } from './types';

export type DefinedSpinner<P extends SpinnerConfig = SpinnerConfig> = ((props: SpinnerTagProps) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable spinner, defined once and used in one line: `const Inline = defineSpinner({ label: '', tone: 'current' })`,
 * then `<Inline />`. Props win over the preset, then `defaults.spinner`, the provider and the library defaults.
 */
export function defineSpinner<P extends SpinnerConfig>(preset: P = {} as P): DefinedSpinner<P> {
  const Defined = ((props: SpinnerTagProps) => React.createElement(Spinner, mergeConfig<SpinnerTagProps>(preset as unknown as Partial<SpinnerTagProps>, props))) as DefinedSpinner<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSpinner';
  return Defined;
}
