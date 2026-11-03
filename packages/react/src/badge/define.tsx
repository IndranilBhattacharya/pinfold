import * as React from 'react';
import { mergeConfig } from '../preset';
import { Badge } from './client';
import type { BadgeConfig, BadgeTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type BadgePresetProps<P> = BadgeTagProps;

/** What `defineBadge` returns: a component with the preset baked in. */
export type DefinedBadge<P extends Partial<BadgeConfig> = Partial<BadgeConfig>> = ((props: BadgePresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable badge, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Unread = defineBadge({ tone: 'danger', label: 'unread messages' });
 *
 * Props win over the preset, then `defaults.badge`, the provider and the library defaults.
 */
export function defineBadge<P extends Partial<BadgeConfig>>(preset: P = {} as P): DefinedBadge<P> {
  const Defined = ((props: BadgePresetProps<P>) =>
    React.createElement(Badge, mergeConfig<BadgeTagProps>(preset as unknown as Partial<BadgeTagProps>, props as unknown as Partial<BadgeTagProps>))) as DefinedBadge<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedBadge';
  return Defined;
}
