import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is a named status by default', () => {
    render(<Spinner />);
    const status = screen.getByRole('status', { name: 'Loading' });
    expect(status.getAttribute('data-motion')).toBe('essential');
  });

  it('takes a custom label, and is decorative with an empty one', () => {
    const { container, rerender } = render(<Spinner label="Fetching invoices" />);
    expect(screen.getByRole('status', { name: 'Fetching invoices' })).toBeTruthy();
    rerender(<Spinner label="" />);
    const root = container.firstElementChild!;
    expect(root.hasAttribute('role')).toBe(false);
    expect(root.getAttribute('aria-hidden')).toBe('true');
  });

  it('maps dimensions onto its variables', () => {
    const { container } = render(<Spinner dimensions={{ size: 32, thickness: '3px' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--pinfold-spinner-size')).toBe('32px');
    expect(root.style.getPropertyValue('--pinfold-spinner-thickness')).toBe('3px');
  });

  it('uses no hooks, so it renders in Server Components', () => {
    const element = (Spinner as unknown as { render: (p: object, r: null) => React.ReactElement }).render({}, null);
    expect(renderToString(element)).toContain('role="status"');
  });
});

describePinfoldConformance({
  name: 'spinner',
  kind: 'atom',
  variants: false,
  slots: ['root'],
  dimension: { key: 'size', value: 24 },
  cssFile: 'packages/css/src/spinner.css',
  render: (config) => <Spinner {...config} />,
});
