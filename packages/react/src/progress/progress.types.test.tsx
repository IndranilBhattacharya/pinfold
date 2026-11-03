/**
 * Compile-time contract of Progress. `npm run typecheck` fails if an `@ts-expect-error` line
 * stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineProgress } from './define';
import { useProgress } from './useProgress';

const Disk = defineProgress({ kind: 'meter', formatValue: (v, { max }) => `${v} of ${max} GB` });

function Valid() {
  const Upload = useProgress({ label: 'Uploading', value: 40, showValue: true, shape: 'circle', tone: 'success', dimensions: { size: 56 } });
  return (
    <>
      <Upload />
      <Disk label="Storage" value={12} max={64} className="x" />
    </>
  );
}

defineConfig({ defaults: { progress: { showValue: true, size: 'sm' } } });

function Invalid() {
  // @ts-expect-error value is a number
  useProgress({ value: '40' });
  // @ts-expect-error not a shape
  useProgress({ shape: 'ring' });
  // @ts-expect-error formatValue returns a string
  useProgress({ formatValue: (v: number) => v });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { progress: { value: 3 } } });
  return null;
}

describe('Progress types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-progress').length).toBe(2);
    expect(typeof Invalid).toBe('function');
  });
});
