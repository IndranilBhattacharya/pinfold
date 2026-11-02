import { createLazyComponent } from '../lazy';
import type * as React from 'react';
import type { AnyAccordionConfig } from './types';

/**
 * Code-split entry point. Nothing accordion-related enters the main bundle
 * until the component first renders:
 *
 *   import { Accordion } from '@pinfold/react/accordion/lazy';
 */
export const Accordion = createLazyComponent<AnyAccordionConfig>(
  () => import('./client').then((m) => ({ default: m.Accordion as unknown as (config: AnyAccordionConfig) => React.ReactElement })),
  { displayName: 'LazyAccordion' },
);

export type { AccordionConfig, AccordionMappedConfig } from './types';
export default Accordion;
