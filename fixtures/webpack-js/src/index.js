// A plain-JS app (no JSX, no TypeScript) bundled by webpack in production mode.
const React = require('react');
const { createRoot } = require('react-dom/client');
const { useAccordion } = require('@pinfold/react/accordion');

/** @type {import('@pinfold/react/accordion').AccordionConfig} */
const config = { items: [{ id: 'a', title: 'Webpack question', content: 'Webpack answer' }] };

function App() {
  const Faq = useAccordion(config);
  return React.createElement(Faq, null);
}

createRoot(document.getElementById('root')).render(React.createElement(App));
