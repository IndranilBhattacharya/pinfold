/* Styles ship separately so SSR and CJS never choke on a CSS import:
     import '@pinfold/css/core.css'; import '@pinfold/css/accordion.css';
   `npx pinfold add accordion` wires this up for you.
   Using Tailwind or your own stylesheet? Pass `unstyled: true` and skip it.

   This barrel is server-safe (no 'use client'): it carries `defineAccordion`
   and re-exports the client module, so one import path works in Server and
   Client Components alike. */

export { Accordion, useAccordion } from './client';
export { Accordion as default } from './client';
export { defineAccordion, type DefinedAccordion } from './define';
export type {
  AccordionConfig,
  AccordionApi,
  AccordionState,
  AccordionParts,
  AccordionPartProps,
  AccordionRootProps,
  AccordionDimensions,
  AccordionItemConfig,
  AccordionItemState,
  AccordionNode,
  AccordionSlot,
  AccordionVariant,
  AccordionIndicator,
  AccordionOverflow,
  AccordionValueDetails,
  AccordionBehaviourConfig,
  AccordionAppearanceConfig,
} from './types';
