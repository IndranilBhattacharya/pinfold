import type * as React from 'react';
import { useAccordion } from './useAccordion';
import type { AccordionConfig, AccordionMappedConfig, AnyAccordionConfig } from './types';

/**
 * Thin JSX wrapper over `useAccordion()`, for one-off accordions that never
 * need the controller. It adds nothing the hook does not already do.
 */
export function Accordion<Id extends string = string>(config: AccordionConfig<Id>): React.ReactElement;
export function Accordion<Row extends object>(config: AccordionMappedConfig<Row>): React.ReactElement;
export function Accordion(config: AnyAccordionConfig): React.ReactElement {
  return useAccordion(config as AccordionConfig).render();
}

Accordion.displayName = 'Accordion';
