'use client';

import { useState } from 'react';
import { useAccordion } from '@pinfold/react/accordion';

// A Client Component: the hook, functions in config, and the controller.
export default function ClientPage() {
  const [last, setLast] = useState('none');
  const Faq = useAccordion({
    id: 'client-faq',
    items: [
      { id: 'one', title: 'Client question one', content: 'Client answer one' },
      { id: 'two', title: 'Client question two', content: (s) => (s.open ? 'Client answer two' : 'Client answer two') },
    ],
    onValueChange: (ids) => setLast(ids.join(',')),
  });
  return (
    <main>
      <h1>Client Component</h1>
      <Faq />
      <button type="button" onClick={() => Faq.openAll()}>
        Open all ({last})
      </button>
    </main>
  );
}
