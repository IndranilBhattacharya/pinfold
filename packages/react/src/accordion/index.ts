/* Styles ship separately so SSR and CJS never choke on a CSS import:
     import '@pinfold/css/core.css'; import '@pinfold/css/accordion.css';
   `npx pinfold add accordion` wires this up for you.
   Using Tailwind or your own stylesheet? Pass `unstyled: true` and skip it. */

export { Accordion } from './Accordion';
export { useAccordion } from './useAccordion';
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
  AccordionBehaviourConfig,
  AccordionAppearanceConfig,
} from './types';

export { Accordion as default } from './Accordion';
