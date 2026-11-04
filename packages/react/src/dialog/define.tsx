import * as React from 'react';
import { mergeConfig } from '../preset';
import { Dialog } from './client';
import type { DialogConfig, DialogTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type DialogPresetProps<P> = DialogTagProps;

/** What `defineDialog` returns: a component with the preset baked in. */
export type DefinedDialog<P extends Partial<DialogConfig> = Partial<DialogConfig>> = ((props: DialogPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable dialog, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Confirm = defineDialog({ role: 'alertdialog', size: 'sm' });
 *
 * Props win over the preset, then `defaults.dialog`, the provider and the library defaults.
 */
export function defineDialog<P extends Partial<DialogConfig>>(preset: P = {} as P): DefinedDialog<P> {
  const Defined = ((props: DialogPresetProps<P>) =>
    React.createElement(Dialog, mergeConfig<DialogTagProps>(preset as unknown as Partial<DialogTagProps>, props as unknown as Partial<DialogTagProps>))) as DefinedDialog<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedDialog';
  return Defined;
}
