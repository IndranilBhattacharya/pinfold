import type * as React from 'react';
import { useAccordion } from './useAccordion';
import type { AccordionConfig } from './types';

/**
 * Thin JSX wrapper over `useAccordion().render()`, for people who prefer a tag.
 * It adds nothing the hook does not already do.
 */
export function Accordion(config: AccordionConfig): React.ReactElement {
  return useAccordion(config).render();
}

Accordion.displayName = 'Accordion';
