import type * as React from 'react';
import { splitProps } from '../preset';
import { ACCORDION_KEYS } from './keys';
import { useAccordion } from './useAccordion';
import type { AccordionConfig, AccordionMappedConfig, AccordionRootProps, AnyAccordionConfig } from './types';

/**
 * The accordion as a tag: the same config as props, plus `data-*` for the root. For one-off
 * accordions that never need the controller; works in loops (`cats.map(c => <Accordion items={c.faq} />)`).
 */
export function Accordion<Id extends string = string>(props: AccordionConfig<Id> & AccordionRootProps): React.ReactElement;
export function Accordion<Row extends object>(props: AccordionMappedConfig<Row> & AccordionRootProps): React.ReactElement;
export function Accordion(props: AnyAccordionConfig & AccordionRootProps): React.ReactElement {
  const [config, root] = splitProps<AccordionConfig>(props as unknown as Record<string, unknown>, ACCORDION_KEYS);
  return useAccordion(config).render(root as AccordionRootProps);
}

