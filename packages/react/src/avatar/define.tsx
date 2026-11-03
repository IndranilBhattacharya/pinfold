import * as React from 'react';
import { mergeConfig } from '../preset';
import { Avatar } from './client';
import type { AvatarConfig, AvatarTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type AvatarPresetProps<P> = AvatarTagProps;

/** What `defineAvatar` returns: a component with the preset baked in. */
export type DefinedAvatar<P extends Partial<AvatarConfig> = Partial<AvatarConfig>> = ((props: AvatarPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable avatar, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Team = defineAvatar({ max: 3, label: 'Project members' });
 *
 * Props win over the preset, then `defaults.avatar`, the provider and the library defaults.
 */
export function defineAvatar<P extends Partial<AvatarConfig>>(preset: P = {} as P): DefinedAvatar<P> {
  const Defined = ((props: AvatarPresetProps<P>) =>
    React.createElement(Avatar, mergeConfig<AvatarTagProps>(preset as unknown as Partial<AvatarTagProps>, props as unknown as Partial<AvatarTagProps>))) as DefinedAvatar<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedAvatar';
  return Defined;
}
