/**
 * Compile-time contract of the accordion's types. `npm run typecheck` fails if any
 * `@ts-expect-error` line stops being an error, so a regression in the typing is caught
 * like a failing test. The runtime part only renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Accordion } from './Accordion';
import { defineAccordion } from './define';
import { useAccordion } from './useAccordion';
import type { AccordionItemConfig, AccordionItemId } from './types';

const items = [
  { id: 'billing', title: 'Billing', content: 'Monthly or yearly.' },
  { id: 'refunds', title: 'Refunds', content: 'Within 30 days.' },
] as const;

const rows = [{ slug: 'q1', question: 'Why?', answer: 'Because.' }];

function TypedIds() {
  const Faq = useAccordion({ items, defaultValue: ['billing'], disabledIds: ['refunds'] });
  // Typed controller: the ids come from `items`.
  Faq.open('refunds');
  // @ts-expect-error not an id of these rows
  Faq.open('shipping');
  // @ts-expect-error not an id of these rows
  useAccordion({ items, defaultValue: ['biling'] });
  // @ts-expect-error not an id of these rows
  useAccordion({ items, disabledIds: ['refund'] });
  // Callbacks receive the typed ids.
  useAccordion({ items, onValueChange: (ids) => ids.map((id): 'billing' | 'refunds' => id) });
  // Everyday controlled state: plain string[] works with typed rows.
  const [plain, setPlain] = React.useState<string[]>([]);
  useAccordion({ items, value: plain, onValueChange: setPlain });
  // Controlled state typed from the rows.
  const [value, setValue] = React.useState<AccordionItemId<typeof items>[]>(['billing']);
  useAccordion({ items, value, onValueChange: setValue });
  return <Faq />;
}

function DataIds() {
  // Rows from data have `string` ids: nothing gets stricter for them.
  const fromApi: AccordionItemConfig[] = [{ id: 'x', title: 'X' }];
  const Faq = useAccordion({ items: fromApi, defaultValue: ['anything'] });
  Faq.open('whatever');
  return <Faq />;
}

function MappedRows() {
  const Faq = useAccordion({ items: rows, fields: { id: 'slug', title: 'question', content: 'answer' } });
  // @ts-expect-error `questoin` is not a key of the records
  useAccordion({ items: rows, fields: { title: 'questoin' } });
  // @ts-expect-error raw records need a `fields` map
  useAccordion({ items: rows });
  return <Faq />;
}

// The tag and the server twin infer the same way.
// @ts-expect-error not an id of these rows
const badTag = <Accordion items={items} defaultValue={['nope']} />;
// @ts-expect-error not an id of these rows
defineAccordion({ items, defaultValue: ['nope'] });
const Defined = defineAccordion({ items: rows, fields: { title: 'question', content: 'answer' } });
void badTag;

describe('accordion types', () => {
  it('renders the valid cases', () => {
    render(
      <>
        <TypedIds />
        <DataIds />
        <MappedRows />
        <Defined />
      </>,
    );
    expect(document.querySelectorAll('[data-pinfold="accordion"]').length).toBeGreaterThan(3);
  });
});
