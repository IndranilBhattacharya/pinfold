/**
 * Compile-time contract of the Button and Spinner types. `npm run typecheck` fails if an
 * `@ts-expect-error` line stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';
import { useButton } from './useButton';
import { useSpinner } from '../spinner/useSpinner';
import { defineConfig } from '../config';

function Valid() {
  // Everyday patterns must compile with no friction.
  const ref = React.useRef<HTMLButtonElement>(null);
  const Focusable = useButton({ label: 'Focus me', slotProps: { root: { ref } } });
  const Save = useButton({ label: 'Save', tone: 'success', onClick: async () => {} });
  const Docs = useButton({ label: 'Docs', href: '/docs', target: '_blank', variant: 'link' });
  const Remove = useButton({ label: 'Delete', icon: '🗑', iconOnly: true, radius: 12, dimensions: { height: '3rem' } });
  const Loading = useSpinner({ size: 'sm', tone: 'current', label: '' });
  const start = (): void => Save.setLoading(true); // typed controller
  void start;
  return (
    <>
      <Save form="f" className="mt-2" data-track="save" />
      <Docs />
      <Focusable />
      <Remove />
      <Loading />
      <Button label={(s) => (s.loading ? 'Saving' : 'Save')} />
    </>
  );
}

defineConfig({ size: 'sm', defaults: { button: { variant: 'soft', radius: 'full' }, spinner: { tone: 'current' } } });

function Invalid() {
  // @ts-expect-error label is required: every button has a name
  useButton({ variant: 'soft' });
  // @ts-expect-error not a variant
  useButton({ label: 'A', variant: 'primary' });
  // @ts-expect-error not a size
  useButton({ label: 'A', size: 'xl' });
  // @ts-expect-error not a tone
  useButton({ label: 'A', tone: 'red' });
  // @ts-expect-error not a button type
  useButton({ label: 'A', type: 'link' });
  // @ts-expect-error loading is a boolean
  useButton({ label: 'A', loading: 'yes' });
  // @ts-expect-error unknown dimension
  useButton({ label: 'A', dimensions: { width: 10 } });
  // @ts-expect-error unknown slot
  useButton({ label: 'A', classNames: { trigger: 'x' } });
  // @ts-expect-error label is a string
  useSpinner({ label: 3 });
  // @ts-expect-error per-instance data does not belong in app-wide defaults
  defineConfig({ defaults: { button: { label: 'Save' } } });
  return null;
}

describe('Button and Spinner types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-button')).toHaveLength(5);
    expect(typeof Invalid).toBe('function');
  });
});
