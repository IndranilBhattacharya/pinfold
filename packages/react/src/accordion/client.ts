/**
 * The accordion's client module. The build prefixes it with 'use client', so a
 * Server Component that imports `@pinfold/react/accordion` gets client
 * references to these, while `defineAccordion` (in the barrel) runs on the server.
 */
export { Accordion } from './Accordion';
export { useAccordion } from './useAccordion';
export type { AccordionApi, AccordionConfig, AccordionMappedConfig, AccordionRootProps } from './types';
