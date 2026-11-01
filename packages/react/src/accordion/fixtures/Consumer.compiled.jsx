// Compiled by the real React Compiler in tests (see vitest.config.ts,
// `reactCompiler`), exactly as a consumer app with the compiler enabled would be.
import * as React from 'react';
import { useAccordion } from '@pinfold/react/accordion';

const items = [
  { id: 'a', title: 'Alpha', content: 'Alpha body' },
  { id: 'b', title: 'Beta', content: 'Beta body' },
];

export function Consumer() {
  const Faq = useAccordion({ items });
  return <Faq className="consumer" />;
}

export function ControlledConsumer() {
  const [value, setValue] = React.useState([]);
  const Faq = useAccordion({ items, mode: 'multiple', value, onValueChange: setValue });
  return (
    <div>
      <output data-testid="value">{value.join(',')}</output>
      <Faq />
    </div>
  );
}

export function PartsConsumer() {
  const Faq = useAccordion({ items });
  return (
    <section>
      <Faq.Trigger id="a" />
      <Faq.Panel id="a" />
    </section>
  );
}
