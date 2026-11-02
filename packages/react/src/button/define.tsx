import * as React from 'react';
import { mergeConfig } from '../preset';
import { Button } from './client';
import type { ButtonConfig, ButtonPresetProps, ButtonTagProps } from './types';

/** What `defineButton` returns: a button with the preset baked in, taking any part of the config as props. */
export type DefinedButton<P extends Partial<ButtonConfig> = Partial<ButtonConfig>> = ((props: ButtonPresetProps<P>) => React.ReactElement) & {
  /** The preset, e.g. to spread into `useButton({ ...Danger.config, label })` when you need the controller. */
  config: P;
  displayName?: string;
};

/**
 * A reusable button, defined once (at module scope, outside components) and used in one line:
 *
 *   // ui/buttons.ts
 *   export const Danger = defineButton({ variant: 'soft', tone: 'danger' });
 *
 *   // any component, in a loop, in a Server Component (no functions there)
 *   <Danger label="Delete" onClick={() => remove(row.id)} />
 *
 * Props win over the preset, which wins over `defaults.button`, the provider and the library
 * defaults. It is a plain function, not a hook, so it is free to call anywhere.
 */
export function defineButton<P extends Partial<ButtonConfig>>(preset: P): DefinedButton<P> {
  const Defined = ((props: ButtonPresetProps<P>) =>
    React.createElement(Button, mergeConfig<ButtonTagProps>(preset as Partial<ButtonTagProps>, props as Partial<ButtonTagProps>))) as DefinedButton<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedButton';
  return Defined;
}
