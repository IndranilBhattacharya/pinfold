import { defineAccordion } from '@pinfold/react/accordion';

// ISR: the page is static and regenerated at most once a minute.
export const revalidate = 60;

async function getFaq() {
  return [
    { slug: 'shipping', question: 'Server question one', answer: 'Server answer one' },
    { slug: 'returns', question: 'Server question two', answer: 'Server answer two' },
  ];
}

// A Server Component: no hooks, data straight from an async source, raw records via `fields`.
export default async function Page() {
  const Faq = defineAccordion({
    id: 'faq',
    items: await getFaq(),
    fields: { id: 'slug', title: 'question', content: 'answer' },
  });
  return (
    <main>
      <h1>App Router</h1>
      <Faq />
    </main>
  );
}
