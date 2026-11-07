import * as React from 'react';
import { mergeConfig } from '../preset';
import { Otp } from './client';
import type { OtpConfig, OtpTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type OtpPresetProps<P> = OtpTagProps;

/** What `defineOtp` returns: a component with the preset baked in. */
export type DefinedOtp<P extends Partial<OtpConfig> = Partial<OtpConfig>> = ((props: OtpPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable one-time code field, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Code = defineOtp({ groups: [3, 3] });
 *
 * Props win over the preset, then `defaults.otp`, the provider and the library defaults.
 */
export function defineOtp<P extends Partial<OtpConfig>>(preset: P = {} as P): DefinedOtp<P> {
  const Defined = ((props: OtpPresetProps<P>) =>
    React.createElement(Otp, mergeConfig<OtpTagProps>(preset as unknown as Partial<OtpTagProps>, props as unknown as Partial<OtpTagProps>))) as DefinedOtp<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedOtp';
  return Defined;
}
