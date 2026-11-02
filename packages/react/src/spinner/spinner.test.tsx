import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { spinnerMeta } from '@pinfold/core/meta';
import { Spinner } from './Spinner';
import { useSpinner } from './useSpinner';
import { defineSpinner } from './define';

describe('Spinner', () => {
  it('is a named status by default', () => {
    function Demo() {
      const Loading = useSpinner();
      return <Loading />;
    }
    render(<Demo />);
    const status = screen.getByRole('status', { name: 'Loading' });
    expect(status.getAttribute('data-motion')).toBe('essential');
    expect(status.getAttribute('data-tone')).toBe('primary');
  });

  it('takes a custom label, and is decorative with an empty one', () => {
    const { container, rerender } = render(<Spinner label="Fetching invoices" />);
    expect(screen.getByRole('status', { name: 'Fetching invoices' })).toBeTruthy();
    rerender(<Spinner label="" tone="current" />);
    const root = container.firstElementChild!;
    expect(root.hasAttribute('role')).toBe(false);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('data-tone')).toBe('current');
  });

  it('renders the moving parts each variant needs', () => {
    const parts = (variant: string) => render(<Spinner variant={variant as never} />).container.querySelectorAll('.pinfold-spinner__part').length;
    expect([parts('ring'), parts('arc'), parts('dots'), parts('bars'), parts('pulse'), parts('orbit')]).toEqual([0, 0, 3, 4, 2, 1]);
  });

  it('maps dimensions onto its variables', () => {
    const { container } = render(<Spinner dimensions={{ size: 32, thickness: '3px', duration: '2s' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--pinfold-spinner-size')).toBe('32px');
    expect(root.style.getPropertyValue('--pinfold-spinner-thickness')).toBe('3px');
    expect(root.style.getPropertyValue('--pinfold-spinner-duration')).toBe('2s');
  });

  it('defineSpinner renders on the server', () => {
    const Loading = defineSpinner({ label: 'Loading' });
    expect(renderToString(<Loading />)).toContain('role="status"');
  });
});

describePinfoldConformance({
  name: 'spinner',
  slots: ['root'],
  dimension: { key: 'size', value: 24 },
  cssFile: 'packages/css/src/spinner.css',
  meta: spinnerMeta,
  preset: { define: defineSpinner as any, props: {} },
  hook: { use: useSpinner as any, config: {} },
  render: (config) => <Spinner {...config} />,
});
