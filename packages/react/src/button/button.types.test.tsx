/**
 * Compile-time contract of the Button and Spinner types. `npm run typecheck` fails if an
 * `@ts-expect-error` line stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';
import { Spinner } from '../spinner/Spinner';

function Valid() {
  // Everyday patterns must compile with no friction.
  const ref = React.useRef<HTMLButtonElement>(null);
  const anchorRef = React.useRef<HTMLAnchorElement>(null);
  return (
    <>
      <Button ref={ref} onClick={(e) => e.currentTarget.blur()} form="f" aria-pressed>Save</Button>
      <Button ref={anchorRef} href="/docs" target="_blank" download>Docs</Button>
      <Button radius={12} dimensions={{ height: '3rem', paddingX: 20 }} tone="neutral" size="lg" variant="soft">A</Button>
      <Button icon="🚀" aria-label="Launch" />
      <Spinner size="sm" tone="info" label="" className="x" />
    </>
  );
}

function Invalid() {
  return (
    <>
      {/* @ts-expect-error not a variant */}
      <Button variant="primary">A</Button>
      {/* @ts-expect-error not a size */}
      <Button size="xl">A</Button>
      {/* @ts-expect-error not a tone */}
      <Button tone="red">A</Button>
      {/* @ts-expect-error not a button type */}
      <Button type="link">A</Button>
      {/* @ts-expect-error loading is a boolean */}
      <Button loading="yes">A</Button>
      {/* @ts-expect-error unknown dimension */}
      <Button dimensions={{ width: 10 }}>A</Button>
      {/* @ts-expect-error unknown slot */}
      <Button classNames={{ trigger: 'x' }}>A</Button>
      {/* @ts-expect-error label is a string */}
      <Spinner label={3} />
    </>
  );
}

describe('Button and Spinner types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-button')).toHaveLength(4);
    expect(typeof Invalid).toBe('function');
  });
});
