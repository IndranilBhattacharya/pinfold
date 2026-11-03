import * as React from 'react';
import { mergeConfig } from '../preset';
import { Card } from './client';
import type { CardConfig, CardTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type CardPresetProps<P> = CardTagProps;

/** What `defineCard` returns: a component with the preset baked in. */
export type DefinedCard<P extends Partial<CardConfig> = Partial<CardConfig>> = ((props: CardPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable card, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Plan = defineCard({ variant: 'elevated', as: 'article' });
 *
 * Props win over the preset, then `defaults.card`, the provider and the library defaults.
 */
export function defineCard<P extends Partial<CardConfig>>(preset: P = {} as P): DefinedCard<P> {
  const Defined = ((props: CardPresetProps<P>) =>
    React.createElement(Card, mergeConfig<CardTagProps>(preset as unknown as Partial<CardTagProps>, props as unknown as Partial<CardTagProps>))) as DefinedCard<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedCard';
  return Defined;
}
