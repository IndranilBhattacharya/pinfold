import * as React from 'react';
import { mergeConfig } from '../preset';
import { Cursor } from './client';
import type { CursorBuiltInState, CursorConfig, CursorStateStyle, CursorTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type CursorPresetProps<S extends string = string, P = CursorConfig<S>> = CursorTagProps<S>;

/** What `defineCursor` returns: a component with the preset baked in, and an attrs helper for typed state attributes. */
export type DefinedCursor<S extends string = string, P extends Partial<CursorConfig<S>> = Partial<CursorConfig<S>>> = ((props: CursorPresetProps<S, P>) => React.ReactElement) & {
  config: P;
  displayName?: string;
  attrs: (state: S | CursorBuiltInState) => Record<string, string>;
};

/**
 * A reusable cursor, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.cursor`, the provider and the library defaults.
 */
export function defineCursor<S extends string = never, P extends Partial<CursorConfig<S>> = Partial<CursorConfig<S>>>(
  preset: P & { states?: { readonly [K in S]?: CursorStateStyle } & { readonly [K in CursorBuiltInState]?: CursorStateStyle } } = {} as P,
): DefinedCursor<S, P> {
  const attribute = (preset as CursorConfig<S>).attribute ?? 'data-cursor';
  const Defined = ((props: CursorPresetProps<S, P>) =>
    React.createElement(Cursor, mergeConfig<CursorTagProps>(preset as unknown as Partial<CursorTagProps>, props as unknown as Partial<CursorTagProps>))) as DefinedCursor<S, P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCursor';
  Defined.attrs = (state: S | CursorBuiltInState) => ({ [attribute]: state });
  return Defined;
}
