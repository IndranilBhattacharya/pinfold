/**
 * Compile-time contract of Card. `npm run typecheck` fails if an `@ts-expect-error` line
 * stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineCard } from './define';
import { useCard } from './useCard';

const Post = defineCard({ orientation: 'horizontal', headingLevel: 2 });

function Valid() {
  const Pro = useCard({ title: 'Pro', content: <b>$29</b>, actions: [{ label: 'Upgrade', onClick: () => {} }], variant: 'elevated', padding: 'lg' });
  return (
    <>
      <Pro />
      <Post title="Hello" href="/hello" image={{ src: '/c.png', alt: '' }} className="x" />
    </>
  );
}

defineConfig({ defaults: { card: { variant: 'filled', headingLevel: 4 } } });

function Invalid() {
  // @ts-expect-error an image needs alt text (use '' for decoration)
  useCard({ image: { src: '/c.png' } });
  // @ts-expect-error not a media position
  useCard({ mediaPosition: 'left' });
  // @ts-expect-error not a selection kind
  useCard({ selectable: 'switch' });
  // @ts-expect-error headings go from 2 to 6
  useCard({ headingLevel: 1 });
  // @ts-expect-error not a card variant
  useCard({ variant: 'neon' });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { card: { title: 'x' } } });
  return null;
}

describe('Card types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-card').length).toBe(2);
    expect(typeof Invalid).toBe('function');
  });
});
