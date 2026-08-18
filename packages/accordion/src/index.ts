/* Styles ship separately so SSR and CJS never choke on a CSS import:
     import '@knotui/accordion/styles.css';
   `npx knotui add accordion` wires this up for you. */

export { Accordion } from './Accordion';
export { useAccordion } from './useAccordion';
export type {
  AccordionConfig,
  AccordionDimensions,
  AccordionApi,
  AccordionItemConfig,
  AccordionItemState,
  AccordionSlot,
  AccordionVariant,
  AccordionIndicator,
  AccordionBehaviourConfig,
  AccordionAppearanceConfig,
} from './types';

export { Accordion as default } from './Accordion';
