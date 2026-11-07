import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { alertMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Alert } from './Alert';
import { useAlert } from './useAlert';
import { defineAlert } from './define';
import type { AlertComponent, AlertConfig } from './types';

const root = (c: HTMLElement) => c.querySelector('.pinfold-alert') as HTMLElement;

describe('Alert', () => {
  it('is plain content by default; live settings map to status and alert', () => {
    const { container, rerender } = render(<Alert title="Saved" />);
    expect(root(container).getAttribute('role')).toBeNull();
    rerender(<Alert title="Saved" live="polite" />);
    expect(screen.getByRole('status').textContent).toContain('Saved');
    rerender(<Alert title="Failed" live="assertive" />);
    expect(screen.getByRole('alert').textContent).toContain('Failed');
  });

  it('shows a decorative tone icon, replaceable or removable', () => {
    const { container, rerender } = render(<Alert title="x" tone="warning" />);
    expect(root(container).querySelector('.pinfold-alert__icon')!.getAttribute('aria-hidden')).toBe('true');
    rerender(<Alert title="x" icon={false} />);
    expect(root(container).querySelector('.pinfold-alert__icon')).toBeNull();
  });

  it('renders actions: the first tinted in its tone, the rest quiet; an action config wins', () => {
    const retry = vi.fn();
    const { container } = render(<Alert title="x" tone="danger" actions={[{ label: 'Retry', onClick: retry }, { label: 'Details', variant: 'outline' }]} />);
    const [first, second] = Array.from(root(container).querySelectorAll('.pinfold-button'));
    expect(first.getAttribute('data-tone')).toBe('danger');
    expect(first.getAttribute('data-variant')).toBe('soft');
    expect(first.getAttribute('data-size')).toBe('sm');
    expect(second.getAttribute('data-variant')).toBe('outline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('dismisses, calls onDismiss, and shows again from the controller', () => {
    const onDismiss = vi.fn();
    let ctrl: AlertComponent | null = null;
    function Host(props: AlertConfig) {
      const A = useAlert(props);
      ctrl = A;
      return <A />;
    }
    const { container } = render(<Host title="x" dismissible onDismiss={onDismiss} dismissLabel="Close notice" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close notice' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(root(container).hidden).toBe(true);
    expect(ctrl!.dismissed).toBe(true);
    act(() => ctrl!.show());
    expect(root(container).hidden).toBe(false);
  });

  it('never takes the provider tone', () => {
    const { container } = render(
      <PinfoldProvider tone="danger">
        <Alert title="x" />
      </PinfoldProvider>,
    );
    expect(root(container).getAttribute('data-tone')).toBe('info');
  });

  it('a preset renders on the server', () => {
    const Problem = defineAlert({ tone: 'danger', live: 'assertive' });
    const html = renderToString(<Problem title="Payment failed" actions={[{ label: 'Retry' }]} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Retry');
  });
});

describePinfoldConformance({
  name: 'alert',
  inherits: [],
  slots: ['root', 'icon', 'content', 'title', 'description', 'actions', 'dismiss'],
  dimension: { key: 'padding', value: 12 },
  cssFile: 'packages/css/src/alert.css',
  meta: alertMeta,
  preset: { define: defineAlert as any, props: { title: 'Saved' } },
  hook: { use: useAlert as any, config: { title: 'Saved' } },
  render: (config) => <Alert title="Saved" description="Live now." actions={[{ label: 'Undo' }]} dismissible {...config} />,
});
