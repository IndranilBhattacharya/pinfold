import * as React from 'react';
import { mergeConfig } from '../preset';
import { Cursor } from './client';
import type { CursorConfig, CursorTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type CursorPresetProps<P> = CursorTagProps;

/** What `defineCursor` returns: a component with the preset baked in. */
export type DefinedCursor<P extends Partial<CursorConfig> = Partial<CursorConfig>> = ((props: CursorPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable cursor, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.cursor`, the provider and the library defaults.
 */
export function defineCursor<P extends Partial<CursorConfig>>(preset: P = {} as P): DefinedCursor<P> {
  const Defined = ((props: CursorPresetProps<P>) =>
    React.createElement(Cursor, mergeConfig<CursorTagProps>(preset as unknown as Partial<CursorTagProps>, props as unknown as Partial<CursorTagProps>))) as DefinedCursor<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCursor';
  return Defined;
}
