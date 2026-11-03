import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { badgeMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Badge } from './Badge';
import { useBadge } from './useBadge';
import { defineBadge } from './define';

const root = (c: HTMLElement) => c.querySelector('.pinfold-badge') as HTMLElement;

describe('Badge', () => {
  it('shows its label as plain text, with a decorative icon', () => {
    const { container } = render(<Badge label="Beta" icon={<svg />} />);
    const el = root(container);
    expect(el.tagName).toBe('SPAN');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.textContent).toBe('Beta');
    expect(el.querySelector('.pinfold-badge__icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-kind')).toBe('label');
  });

  it('caps a count and reads its label after the number', () => {
    const { container } = render(<Badge count={120} label="unread messages" />);
    const el = root(container);
    expect(el.querySelector('.pinfold-badge__label')!.textContent).toBe('99+');
    expect(el.textContent).toBe('99+ unread messages');
    expect(el.getAttribute('data-kind')).toBe('count');
  });

  it('hides a zero count unless showZero', () => {
    const { container, rerender } = render(<Badge count={0} />);
    expect(root(container).hidden).toBe(true);
    rerender(<Badge count={0} showZero />);
    expect(root(container).hidden).toBe(false);
    expect(root(container).textContent).toBe('0');
  });

  it('a dot shows nothing but reads its label', () => {
    const { container } = render(<Badge dot label="Online" icon={<svg />} radius="none" />);
    const el = root(container);
    expect(el.getAttribute('data-kind')).toBe('dot');
    expect(el.textContent).toBe('Online');
    expect(el.querySelector('.pinfold-badge__icon')).toBeNull();
    expect(el.hasAttribute('data-radius')).toBe(false);
  });

  it('follows the provider size and tone; its own config wins', () => {
    const { container, rerender } = render(
      <PinfoldProvider size="sm" tone="danger">
        <Badge label="x" />
      </PinfoldProvider>,
    );
    expect(root(container).getAttribute('data-size')).toBe('sm');
    expect(root(container).getAttribute('data-tone')).toBe('danger');
    rerender(
      <PinfoldProvider size="sm" tone="danger">
        <Badge label="x" tone="success" />
      </PinfoldProvider>,
    );
    expect(root(container).getAttribute('data-tone')).toBe('success');
  });

  it('a preset renders on the server', () => {
    const Unread = defineBadge({ tone: 'danger', label: 'unread' });
    const html = renderToString(<Unread count={3} placement="top-end" />);
    expect(html).toContain('data-placement="top-end"');
    expect(html).toContain('>3<');
  });
});

describePinfoldConformance({
  name: 'badge',
  slots: ['root', 'icon', 'label'],
  optionalSlots: ['icon'],
  dimension: { key: 'height', value: 20 },
  cssFile: 'packages/css/src/badge.css',
  meta: badgeMeta,
  preset: { define: defineBadge as any, props: { label: 'New' } },
  hook: { use: useBadge as any, config: { label: 'New' } },
  render: (config) => <Badge label="New" icon={<svg />} {...config} />,
});
