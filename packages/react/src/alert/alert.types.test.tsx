/**
 * Compile-time contract of Alert. `npm run typecheck` fails if an `@ts-expect-error` line
 * stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineAlert } from './define';
import { useAlert } from './useAlert';

const Problem = defineAlert({ tone: 'danger', live: 'assertive' });

function Valid() {
  const Saved = useAlert({ title: 'Saved', tone: 'success', dismissible: true, onDismiss: () => {}, actions: [{ label: 'Undo', onClick: async () => {} }] });
  return (
    <>
      <Saved />
      <Problem title="Failed" description={<p>Card declined.</p>} icon={false} className="x" />
    </>
  );
}

defineConfig({ defaults: { alert: { variant: 'accent' } } });

function Invalid() {
  // @ts-expect-error every action needs a label
  useAlert({ actions: [{ onClick: () => {} }] });
  // @ts-expect-error not an alert variant
  useAlert({ variant: 'solid' });
  // @ts-expect-error not a live setting
  useAlert({ live: 'loud' });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { alert: { title: 'x' } } });
  return null;
}

describe('Alert types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-alert').length).toBe(2);
    expect(typeof Invalid).toBe('function');
  });
});
