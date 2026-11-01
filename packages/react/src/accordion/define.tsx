import * as React from 'react';
import { Accordion } from './client';
import type { AccordionConfig, AccordionMappedConfig, AccordionRootProps, AnyAccordionConfig } from './types';

/** What `defineAccordion` returns: a component with the config baked in. */
export type DefinedAccordion<Config = AnyAccordionConfig> = ((props: AccordionRootProps) => React.ReactElement) & {
  config: Config;
  displayName?: string;
};

/**
 * The non-hook twin of `useAccordion`, for Server Components (and anywhere a
 * hook can't run). Same config, same tag:
 *
 *   const Faq = defineAccordion({ items: await getFaq() });
 *   return <Faq />;
 *
 * The server renders the full HTML (every title and panel) and the client
 * hydrates it. From a Server Component the config must be serialisable: plain
 * data and server-rendered JSX, no functions. For a controller (`Faq.toggle`)
 * use `useAccordion` in a client component.
 */
export function defineAccordion<Id extends string = string>(config: AccordionConfig<Id>): DefinedAccordion<AccordionConfig<Id>>;
export function defineAccordion<Row extends object>(config: AccordionMappedConfig<Row>): DefinedAccordion<AccordionMappedConfig<Row>>;
export function defineAccordion(config: AnyAccordionConfig): DefinedAccordion {
  const Tag = Accordion as (config: AnyAccordionConfig) => React.ReactElement;
  const Defined = ((props: AccordionRootProps) => React.createElement(Tag, { ...config, ...props })) as unknown as DefinedAccordion;
  Defined.config = config;
  Defined.displayName = 'DefinedAccordion';
  return Defined;
}
