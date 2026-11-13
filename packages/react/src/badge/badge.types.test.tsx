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

const Unread = defineBadge({ tone: 'danger', srLabel: 'unread messages' });
const Online = defineBadge({ dot: true, anchorShape: 'circle', placement: 'bottom-end', srLabel: 'Online' });

function Valid() {
  const Beta = useBadge({ label: 'Beta', variant: 'soft', tone: 'info', radius: 'md', dimensions: { height: 20 } });
  return (
    <>
      <Beta />
      <Unread label="Inbox" count={5} max={9} className="x" />
      <Online anchor={<i />} aria-describedby="status" />
    </>
  );
}

defineConfig({ defaults: { badge: { variant: 'soft', size: 'sm', anchorShape: 'circle' } } });

function Invalid() {
  // @ts-expect-error not an anchor shape
  useBadge({ anchorShape: 'oval' });
  // @ts-expect-error formatCount takes a function
  useBadge({ formatCount: 'k' });
  // @ts-expect-error count is a number
  useBadge({ count: '3' });
  // @ts-expect-error not a badge variant
  useBadge({ variant: 'ghost' });
  // @ts-expect-error the corners are logical; there is no inline placement
  useBadge({ placement: 'inline' });
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
