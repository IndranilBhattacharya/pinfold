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

  it('dismisses, calls onDismiss, and shows again from the controller', async () => {
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
    // The exit plays first, then it is hidden.
    expect(root(container).getAttribute('data-state')).toBe('closing');
    await vi.waitFor(() => expect(root(container).hidden).toBe(true));
    expect(root(container).getAttribute('data-state')).toBe('closed');
    expect(ctrl!.dismissed).toBe(true);
    act(() => ctrl!.show());
    expect(root(container).hidden).toBe(false);
  });

  it('hides at once with animation off', () => {
    const { container } = render(
      <PinfoldProvider disableAnimation>
        <Alert title="x" dismissible />
      </PinfoldProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(root(container).hidden).toBe(true);
  });

  it('icon placement, alignment and look reach the root; a per-tone icon and a function icon work', () => {
    const { container, rerender } = render(<Alert title="x" tone="danger" iconPlacement="top" iconAlign="center" iconVariant="solid" icons={{ danger: <b>!</b> }} />);
    const el = root(container);
    expect(el.getAttribute('data-icon-placement')).toBe('top');
    expect(el.getAttribute('data-icon-align')).toBe('center');
    expect(el.getAttribute('data-icon-variant')).toBe('solid');
    expect(el.querySelector('.pinfold-alert__icon')!.textContent).toBe('!');
    rerender(<Alert title="x" tone="success" icons={{ danger: <b>!</b> }} icon={(s) => <i>{s.tone}</i>} />);
    expect(root(container).querySelector('.pinfold-alert__icon')!.textContent).toBe('success');
  });

  it('title and description take a function of the live state', () => {
    const { container } = render(<Alert tone="warning" title={(s) => `tone ${s.tone}`} description={(s) => (s.dismissed ? 'gone' : 'here')} />);
    expect(root(container).querySelector('.pinfold-alert__title')!.textContent).toBe('tone warning');
    expect(root(container).querySelector('.pinfold-alert__description')!.textContent).toBe('here');
  });

  it('actions can sit at the end, outside the text', () => {
    const { container } = render(<Alert title="x" actions={[{ label: 'Open' }]} actionsPlacement="end" />);
    const actions = root(container).querySelector('.pinfold-alert__actions')!;
    expect(actions.parentElement).toBe(root(container));
    expect(root(container).getAttribute('data-actions-placement')).toBe('end');
  });

  it('a solid alert gives its buttons solid neutral defaults', () => {
    const { container } = render(<Alert title="x" variant="solid" tone="danger" actions={[{ label: 'A' }, { label: 'B' }]} />);
    const buttons = Array.from(root(container).querySelectorAll('.pinfold-button'));
    expect(buttons.map((b) => `${b.getAttribute('data-variant')}/${b.getAttribute('data-tone')}`)).toEqual(['solid/neutral', 'solid/neutral']);
  });

  it('compact density is reflected; live roles stay whatever the variant', () => {
    render(<Alert title="x" density="compact" variant="banner" live="assertive" />);
    expect(screen.getByRole('alert').getAttribute('data-density')).toBe('compact');
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
