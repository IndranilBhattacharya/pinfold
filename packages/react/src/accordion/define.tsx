import * as React from 'react';
import type { AccordionFieldMap } from '@pinfold/core';
import { mergeConfig } from '../preset';
import { Accordion } from './client';
import type {
  AccordionConfig,
  AccordionItemConfig,
  AccordionMappedConfig,
  AccordionOptions,
  AccordionRootProps,
  AnyAccordionConfig,
} from './types';

/** Use-site props of a preset: any option, the rows, and root attributes. Props win over the preset. */
/** Every option and root attribute, without the rows. */
type AccordionPresetBase = Partial<AccordionOptions> & AccordionRootProps;

export type AccordionPresetProps<Rows = ReadonlyArray<AccordionItemConfig>> = AccordionPresetBase & { items?: Rows; fields?: AccordionFieldMap };

/** What `defineAccordion` returns: a component with the preset baked in, taking any part of the config as props. */
export type DefinedAccordion<Config = AnyAccordionConfig, Props = AccordionPresetProps> = ((props: Props) => React.ReactElement) & {
  config: Config;
  displayName?: string;
};

/**
 * The non-hook twin of `useAccordion`, and the way to make presets. Define once, at module
 * scope, and use it anywhere, in loops and in Server Components:
 *
 *   const Faq = defineAccordion({ variant: 'separated', mode: 'multiple' });   // a preset
 *   {categories.map((c) => <Faq key={c.id} items={c.questions} />)}
 *
 *   const Shipping = defineAccordion({ items: await getFaq() });               // complete config
 *   return <Shipping />;
 *
 * Props win over the preset, then `defaults.accordion`, the provider and the library defaults.
 * From a Server Component the config must be serialisable: plain data and server-rendered JSX,
 * no functions. For a controller (`Faq.toggle`) use `useAccordion` in a client component.
 */
export function defineAccordion<Id extends string = string>(config: AccordionConfig<Id>): DefinedAccordion<AccordionConfig<Id>>;
export function defineAccordion<Row extends object>(config: AccordionMappedConfig<Row>): DefinedAccordion<AccordionMappedConfig<Row>, AccordionPresetProps<ReadonlyArray<Row>>>;
/** A preset without rows: `items` is then required where it is used. */
export function defineAccordion(
  preset: AccordionOptions,
): DefinedAccordion<AccordionOptions, AccordionPresetBase & ({ items: ReadonlyArray<AccordionItemConfig>; fields?: undefined } | { items: ReadonlyArray<object>; fields: AccordionFieldMap })>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the overloads above carry the types
export function defineAccordion(preset: object): DefinedAccordion<any, any> {
  const Tag = Accordion as unknown as (props: object) => React.ReactElement;
  const Defined = ((props: object) => React.createElement(Tag, mergeConfig(preset as object, props))) as DefinedAccordion<any, any>;
  Defined.config = preset;
  Defined.displayName = 'DefinedAccordion';
  return Defined;
}
