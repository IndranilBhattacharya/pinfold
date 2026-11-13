/**
 * Compile-time contract of Separator, Kbd and Skeleton. `npm run typecheck` fails if an
 * `@ts-expect-error` line stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineSeparator } from './define';
import { useSeparator } from './useSeparator';
import { defineKbd } from '../kbd/define';
import { useKbd } from '../kbd/useKbd';
import { defineSkeleton } from '../skeleton/define';
import { useSkeleton } from '../skeleton/useSkeleton';

const Or = defineSeparator({ label: 'or', spacing: 'md' });
const Shortcut = defineKbd({ size: 'sm' });
const Bio = defineSkeleton({ lines: 3 });
const keys = ['mod', 'k'] as const;

function Valid() {
  const Rule = useSeparator({ orientation: 'vertical', variant: 'dashed', dimensions: { thickness: 2 } });
  const Search = useKbd({ keys, display: 'symbols' });
  const Avatar = useSkeleton({ variant: 'circle', size: 'lg', loading: false, content: <img alt="" /> });
  return (
    <>
      <Rule />
      <Or labelPosition="start" />
      <Search />
      <Shortcut keys={['esc']} className="x" />
      <Avatar />
      <Bio loading content={<p>Bio</p>} aria-label="bio" />
    </>
  );
}

defineConfig({ defaults: { separator: { spacing: 'md' }, kbd: { variant: 'solid' }, skeleton: { animation: 'wave' } } });

function Invalid() {
  // @ts-expect-error keys are required: the preset has none
  const missing = <Shortcut />;
  // @ts-expect-error not a separator variant
  useSeparator({ variant: 'double' });
  // @ts-expect-error keys are strings
  useKbd({ keys: [1, 2] });
  // @ts-expect-error not a skeleton shape
  useSkeleton({ variant: 'triangle' });
  // @ts-expect-error lines is a number
  useSkeleton({ lines: '3' });
  // @ts-expect-error a separator has no tone
  useSeparator({ tone: 'danger' });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { kbd: { keys: ['k'] } } });
  return missing;
}

describe('Separator, Kbd and Skeleton types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-separator, .pinfold-kbd, .pinfold-skeleton').length).toBe(6);
    expect(typeof Invalid).toBe('function');
  });
});
