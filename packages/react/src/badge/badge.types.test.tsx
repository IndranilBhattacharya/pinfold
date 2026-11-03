/**
 * Compile-time contract of Badge. `npm run typecheck` fails if an `@ts-expect-error` line
 * stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineBadge } from './define';
import { useBadge } from './useBadge';

const Unread = defineBadge({ tone: 'danger', label: 'unread messages' });
const Online = defineBadge({ dot: true, placement: 'bottom-end', label: 'Online' });

function Valid() {
  const Beta = useBadge({ label: 'Beta', variant: 'soft', tone: 'info', radius: 'md', dimensions: { height: 20 } });
  return (
    <>
      <Beta />
      <Unread count={5} max={9} className="x" />
      <Online aria-describedby="status" />
    </>
  );
}

defineConfig({ defaults: { badge: { variant: 'soft', size: 'sm' } } });

function Invalid() {
  // @ts-expect-error count is a number
  useBadge({ count: '3' });
  // @ts-expect-error not a badge variant
  useBadge({ variant: 'ghost' });
  // @ts-expect-error not a placement
  useBadge({ placement: 'top' });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { badge: { count: 3 } } });
  return null;
}

describe('Badge types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-badge').length).toBe(3);
    expect(typeof Invalid).toBe('function');
  });
});
