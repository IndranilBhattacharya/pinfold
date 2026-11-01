import { useAccordion } from '@pinfold/react/accordion';

// Pages Router with ISR (getStaticProps + revalidate).
export async function getStaticProps() {
  return {
    props: { items: [{ id: 'p1', title: 'Pages question', content: 'Pages answer' }] },
    revalidate: 60,
  };
}

export default function Legacy({ items }) {
  const Faq = useAccordion({ id: 'legacy', items });
  return (
    <main>
      <h1>Pages Router</h1>
      <Faq />
    </main>
  );
}
