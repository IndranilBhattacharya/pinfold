import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { cardMeta } from '@pinfold/core/meta';
import { Card } from './Card';
import { useCard } from './useCard';
import { defineCard } from './define';

const root = (c: HTMLElement) => c.querySelector('.pinfold-card') as HTMLElement;

describe('Card', () => {
  it('has a real heading at the chosen level', () => {
    const { rerender } = render(<Card title="Pro" description="For teams" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Pro' })).toBeTruthy();
    rerender(<Card title="Pro" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Pro' })).toBeTruthy();
  });

  it('a linked card is read as its title alone, with safe rel', () => {
    render(<Card title="Release notes" description="What changed in 2.0" href="https://example.com" target="_blank" actions={[{ label: 'Share' }]} />);
    const link = screen.getByRole('link');
    expect(link.textContent).toBe('Release notes');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  it('needs a title to be a link', () => {
    const { container } = render(<Card description="x" href="/x" />);
    expect(container.querySelector('a')).toBeNull();
    expect(root(container).hasAttribute('data-link')).toBe(false);
  });

  it('renders actions: first solid, the rest outline; an action config wins', () => {
    const go = vi.fn();
    const { container } = render(<Card title="x" actions={[{ label: 'Upgrade', onClick: go }, { label: 'Compare' }, { label: 'Later', variant: 'ghost' }]} />);
    expect(Array.from(container.querySelectorAll('.pinfold-button')).map((b) => b.getAttribute('data-variant'))).toEqual(['solid', 'outline', 'ghost']);
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('renders an image with its alt, and the chosen root element', () => {
    const { container } = render(
      <ul>
        <Card as="li" title="x" image={{ src: '/a.png', alt: 'A mountain' }} orientation="horizontal" />
      </ul>,
    );
    expect(root(container).tagName).toBe('LI');
    expect(screen.getByRole('img', { name: 'A mountain' })).toBeTruthy();
    expect(root(container).getAttribute('data-orientation')).toBe('horizontal');
  });

  it('a preset renders on the server', () => {
    const Plan = defineCard({ variant: 'elevated', as: 'article' });
    const html = renderToString(<Plan title="Pro" content={<b>$29</b>} />);
    expect(html).toContain('<article');
    expect(html).toContain('data-variant="elevated"');
  });
});

describePinfoldConformance({
  name: 'card',
  inherits: [],
  slots: ['root', 'media', 'body', 'title', 'description', 'content', 'actions'],
  dimension: { key: 'padding', value: 12 },
  cssFile: 'packages/css/src/card.css',
  meta: cardMeta,
  preset: { define: defineCard as any, props: { title: 'Pro' } },
  hook: { use: useCard as any, config: { title: 'Pro' } },
  render: (config) => <Card title="Pro" description="For teams" content="$29" image={{ src: '/a.png', alt: '' }} actions={[{ label: 'Upgrade' }]} {...config} />,
});
