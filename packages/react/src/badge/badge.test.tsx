import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  });

  it('a count never overrides the label: both show', () => {
    const { container } = render(<Badge label="Inbox" count={3} />);
    const el = root(container);
    expect(el.querySelector('.pinfold-badge__label')!.textContent).toBe('Inbox');
    expect(el.querySelector('.pinfold-badge__count')!.textContent).toBe('3');
  });

  it('caps a count; srLabel is read, never shown', () => {
    const { container } = render(<Badge count={120} srLabel="unread messages" />);
    const el = root(container);
    expect(el.querySelector('.pinfold-badge__count')!.textContent).toBe('99+');
    expect(el.textContent).toBe('99+ unread messages');
    expect(el.querySelector('.pinfold-badge__label')).toBeNull();
    expect((el.lastElementChild as HTMLElement).style.position).toBe('absolute');
    expect(el.hasAttribute('data-count-only')).toBe(true);
  });

  it('a zero count does not show: the label stays, and with nothing else the badge hides', () => {
    const { container, rerender } = render(<Badge label="Inbox" count={0} />);
    expect(root(container).hidden).toBe(false);
    expect(root(container).querySelector('.pinfold-badge__count')).toBeNull();
    rerender(<Badge count={0} />);
    expect(root(container).hidden).toBe(true);
    rerender(<Badge count={0} showZero />);
    expect(root(container).hidden).toBe(false);
    expect(root(container).textContent).toBe('0');
  });

  it('a dot sits beside a label, or is the badge on its own', () => {
    const { container, rerender } = render(<Badge dot label="Online" />);
    expect(root(container).hasAttribute('data-dot-only')).toBe(false);
    expect(root(container).querySelector('.pinfold-badge__dot')!.getAttribute('aria-hidden')).toBe('true');
    expect(root(container).textContent).toBe('Online');
    rerender(<Badge dot srLabel="Online" radius="none" />);
    expect(root(container).hasAttribute('data-dot-only')).toBe(true);
    expect(root(container).querySelector('.pinfold-badge__dot')).toBeNull();
    expect(root(container).hasAttribute('data-radius')).toBe(false);
    expect(root(container).textContent).toBe(' Online');
  });

  it('pins itself to an anchor, which stays in the page', () => {
    const { container, rerender } = render(<Badge count={3} anchor={<button>Inbox</button>} />);
    const wrap = container.querySelector('.pinfold-badge__anchor')!;
    expect(wrap.contains(screen.getByRole('button', { name: 'Inbox' }))).toBe(true);
    expect(wrap.contains(root(container))).toBe(true);
    expect(root(container).getAttribute('data-placement')).toBe('top-end');
    expect(root(container).getAttribute('data-anchor-shape')).toBe('rect');
    // A zero-size box on the corner holds the badge, so any width centres on the corner itself.
    const corner = root(container).parentElement!;
    expect(corner.classList.contains('pinfold-badge__corner')).toBe(true);
    expect(corner.getAttribute('data-placement')).toBe('top-end');
    expect(corner.parentElement).toBe(wrap);
    rerender(<Badge count={3} anchor={<button>Inbox</button>} placement="bottom-start" anchorShape="circle" />);
    expect(root(container).parentElement!.getAttribute('data-anchor-shape')).toBe('circle');
    expect(root(container).getAttribute('data-placement')).toBe('bottom-start');
    expect(root(container).getAttribute('data-anchor-shape')).toBe('circle');
    rerender(<Badge count={3} />);
    expect(container.querySelector('.pinfold-badge__anchor')).toBeNull();
    expect(root(container).hasAttribute('data-placement')).toBe(false);
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
    const Unread = defineBadge({ tone: 'danger', srLabel: 'unread' });
    const html = renderToString(<Unread count={3} anchor={<i />} />);
    expect(html).toContain('data-placement="top-end"');
    expect(html).toContain('>3<');
  });
});

describePinfoldConformance({
  name: 'badge',
  slots: ['root', 'dot', 'icon', 'label', 'count', 'anchor'],
  dimension: { key: 'height', value: 20 },
  cssFile: 'packages/css/src/badge.css',
  meta: badgeMeta,
  preset: { define: defineBadge as any, props: { label: 'New' } },
  hook: { use: useBadge as any, config: { label: 'New' } },
  render: (config) => <Badge label="New" dot count={2} icon={<svg />} anchor={<i />} {...config} />,
});
