import type * as React from 'react';
import { splitProps } from '../preset';
import { CARD_KEYS } from './keys';
import { useCard } from './useCard';
import type { CardConfig, CardTagProps } from './types';

/** The card as a tag: the config as props, plus any attribute of the element. */
export function Card(props: CardTagProps): React.ReactElement {
  const [config, root] = splitProps<CardConfig>(props as unknown as Record<string, unknown>, CARD_KEYS);
  return useCard(config).render(root);
}
