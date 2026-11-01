import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { PinfoldProvider } from '@pinfold/react';
import { defineAccordion, useAccordion } from '@pinfold/react/accordion';

const items = [
  { id: 'a', title: 'Alpha', content: 'Alpha body', description: 'First' },
  { id: 'b', title: 'Beta', content: 'Beta body', badge: 'New' },
  { id: 'c', title: 'Gamma', content: 'Gamma body', disabled: true },
];

function HookFaq() {
  const Faq = useAccordion({ items, defaultValue: ['a'] });
  return <Faq className="faq" />;
}
const DefinedFaq = defineAccordion({ items, variant: 'separated', mountPanels: 'always' });

function App() {
  return (
    <PinfoldProvider>
      <HookFaq />
      <DefinedFaq />
    </PinfoldProvider>
  );
}

/** Server render, then hydrate the same tree into that HTML, collecting every React complaint. */
async function hydrate(element: React.ReactElement) {
  const html = renderToString(element);
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  const errors: unknown[] = [];
  const error = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args));
  await act(async () => {
    hydrateRoot(container, element, { onRecoverableError: (e) => errors.push(e) });
  });
  error.mockRestore();
  return { html, container, errors };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Accordion on the server', () => {
  it('renders complete HTML: every title and every panel body, open or closed', () => {
    const html = renderToString(<App />);
    for (const text of ['Alpha', 'Alpha body', 'Beta body', 'Gamma body', 'First', 'New']) expect(html).toContain(text);
    expect(html.match(/role="region"/g)).toHaveLength(6);
    expect(html).toContain('aria-expanded="true"');
  });

  it('renders deterministic ids', () => {
    expect(renderToString(<App />)).toBe(renderToString(<App />));
  });

  it('hydrates without a single warning, for the hook and the server twin', async () => {
    const { errors, container } = await hydrate(<App />);
    expect(errors).toEqual([]);
    // Interactive after hydration.
    const beta = container.querySelectorAll('button')[1] as HTMLButtonElement;
    await act(async () => beta.click());
    expect(beta).toHaveAttribute('aria-expanded', 'true');
  });

  it('defineAccordion bakes the config in and accepts root props', () => {
    const html = renderToString(<DefinedFaq className="extra" />);
    expect(html).toContain('data-variant="separated"');
    expect(html).toContain('extra');
    expect(DefinedFaq.config.items).toBe(items);
  });
});
