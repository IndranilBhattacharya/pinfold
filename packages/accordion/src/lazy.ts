import { createLazyComponent } from '@lumae/core';
import type { AccordionConfig } from './types';

/**
 * Code-split entry point. Nothing accordion-related enters the main bundle
 * until the component first renders:
 *
 *   import { Accordion } from '@lumae/accordion/lazy';
 */
export const Accordion = createLazyComponent<AccordionConfig>(
  () => import('./index').then((m) => ({ default: m.Accordion })),
  { displayName: 'LazyAccordion' },
);

export type { AccordionConfig } from './types';
export default Accordion;
