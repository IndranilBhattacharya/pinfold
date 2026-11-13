import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { badgeMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Badge } from './Badge';
import { useBadge } from './useBadge';
import { badgeArcOffset, badgeCorner, parseCornerRadius } from '@pinfold/core';
import type { BadgeComponent, BadgeConfig } from './types';
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
    expect(root(container).getAttribute('data-anchor-shape')).toBe('auto');
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

  it('sits on the anchor edge: the corner curve where it crosses the diagonal', () => {
    const k = 1 - Math.SQRT1_2;
    const sq = (v: string) => ({ 'top-left': v, 'top-right': v, 'bottom-right': v, 'bottom-left': v });
    // A sharp corner: the bounding corner itself.
    expect(badgeArcOffset(sq('0px'), 40, 40, 'top-right')).toEqual({ x: 0, y: 0 });
    // A circle: 14.6% in on both axes.
    const circle = badgeArcOffset(sq('50%'), 56, 56, 'top-right');
    expect(circle.x).toBeCloseTo(28 * k);
    expect(circle.y).toBeCloseTo(28 * k);
    // A pill: 9999px is scaled down to half the height, as CSS does.
    const pill = badgeArcOffset(sq('9999px'), 120, 40, 'bottom-left');
    expect(pill.x).toBeCloseTo(20 * k);
    expect(pill.y).toBeCloseTo(20 * k);
    // One rounded corner of 12px.
    expect(badgeArcOffset({ ...sq('0px'), 'top-left': '12px' }, 100, 60, 'top-left').x).toBeCloseTo(12 * k);
    expect(parseCornerRadius('10px 20px', 100, 100)).toEqual([10, 20]);
    expect(parseCornerRadius('50%', 80, 40)).toEqual([40, 20]);
    // Logical placements land on physical corners, flipped in RTL.
    expect(badgeCorner('top-end')).toBe('top-right');
    expect(badgeCorner('top-end', true)).toBe('top-left');
    expect(badgeCorner('bottom-start', true)).toBe('bottom-right');
  });

  it('auto reads the anchor radius onto the corner; rect and circle stay pure CSS', () => {
    const { container, rerender } = render(<Badge dot srLabel="Online" anchor={<span style={{ display: 'block', borderRadius: '50%', width: 40, height: 40 }} />} />);
    const corner = () => container.querySelector('.pinfold-badge__corner') as HTMLElement;
    // jsdom has no layout (sizes are 0), but the variables are written.
    expect(corner().style.getPropertyValue('--pinfold-bdg-off-x')).toMatch(/px$/);
    rerender(<Badge dot srLabel="Online" anchorShape="circle" anchor={<span style={{ borderRadius: '50%' }} />} />);
    expect(corner().style.getPropertyValue('--pinfold-bdg-off-x')).toBe('');
    expect(corner().getAttribute('data-anchor-shape')).toBe('circle');
  });

  it('a dimensions offset reaches the corner as well as the badge', () => {
    const { container } = render(<Badge count={2} anchor={<i />} dimensions={{ offset: 3 }} />);
    expect((container.querySelector('.pinfold-badge__corner') as HTMLElement).style.getPropertyValue('--pinfold-badge-offset')).toBe('3px');
  });

  it('the dot variant draws a dot before the label', () => {
    const { container } = render(<Badge variant="dot" tone="success" label="Online" />);
    expect(root(container).getAttribute('data-variant')).toBe('dot');
    expect(root(container).querySelector('.pinfold-badge__dot')).toBeTruthy();
  });

  it('invisible hides it, animated, out of the tree and the tab order', () => {
    const { container, rerender } = render(<Badge label="Filter" onClick={() => {}} invisible />);
    expect(root(container).hasAttribute('data-invisible')).toBe(true);
    expect(root(container).getAttribute('aria-hidden')).toBe('true');
    expect(root(container).hidden).toBe(false);
    expect(container.querySelector('button')!.getAttribute('tabindex')).toBe('-1');
    rerender(<Badge label="Filter" onClick={() => {}} />);
    expect(root(container).hasAttribute('data-invisible')).toBe(false);
    expect(container.querySelector('button')!.hasAttribute('tabindex')).toBe(false);
  });

  it('a pinned count of zero fades away instead of leaving the layout', () => {
    const { container } = render(<Badge count={0} anchor={<i />} />);
    expect(root(container).hidden).toBe(false);
    expect(root(container).hasAttribute('data-invisible')).toBe(true);
  });

  it('pulse marks the dot, or the whole badge without one', () => {
    const { container, rerender } = render(<Badge dot pulse srLabel="Live" />);
    expect(root(container).getAttribute('data-pulse')).toBe('dot');
    rerender(<Badge count={4} pulse />);
    expect(root(container).getAttribute('data-pulse')).toBe('badge');
  });

  it('formatCount replaces the count text, only when it shows', () => {
    const format = vi.fn((n: number) => `${(n / 1000).toFixed(1)}k`);
    const { container, rerender } = render(<Badge count={1234} formatCount={format} />);
    expect(root(container).querySelector('.pinfold-badge__count')!.textContent).toBe('1.2k');
    rerender(<Badge count={0} formatCount={format} />);
    expect(format).toHaveBeenCalledTimes(1);
  });

  it('label, icon and endIcon take a function of the live state; avatar and endIcon render', () => {
    const { container } = render(<Badge tone="success" label={(s) => `tone ${s.tone}`} icon={() => <svg />} endIcon={<svg />} avatar={<img src="/a.png" alt="" />} />);
    const el = root(container);
    expect(el.querySelector('.pinfold-badge__label')!.textContent).toBe('tone success');
    expect(el.querySelector('.pinfold-badge__icon svg')).toBeTruthy();
    expect(el.querySelector('.pinfold-badge__endIcon')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.pinfold-badge__avatar img')).toBeTruthy();
  });

  it('onClick makes it a button named by what it shows', () => {
    const onClick = vi.fn();
    render(<Badge label="Inbox" count={3} srLabel="unread" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Inbox 3 unread' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('href makes it a link with a safe rel', () => {
    render(<Badge label="Docs" href="https://example.com" target="_blank" />);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.closest('.pinfold-badge')!.hasAttribute('data-interactive')).toBe(true);
  });

  it('dismissible: a named × button hides it after the exit and calls onDismiss; show() brings it back', async () => {
    const onDismiss = vi.fn();
    let ctrl: BadgeComponent | null = null;
    function Host(props: BadgeConfig) {
      const B = useBadge(props);
      ctrl = B;
      return <B />;
    }
    const { container } = render(<Host label="Design" dismissible onDismiss={onDismiss} />);
    const x = screen.getByRole('button', { name: 'Remove Design' });
    fireEvent.click(x);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(root(container).hasAttribute('data-invisible')).toBe(true);
    await vi.waitFor(() => expect(root(container).hidden).toBe(true));
    expect(ctrl!.dismissed).toBe(true);
    act(() => ctrl!.show());
    expect(root(container).hidden).toBe(false);
    expect(root(container).hasAttribute('data-invisible')).toBe(false);
  });

  it('a dismiss with animation off leaves at once', () => {
    const { container } = render(
      <PinfoldProvider disableAnimation>
        <Badge label="Design" dismissible dismissLabel="Delete" />
      </PinfoldProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Design' }));
    expect(root(container).hidden).toBe(true);
  });

  it('a clickable badge and its × are two stops; a pinned interactive badge takes the pointer', () => {
    const { container } = render(<Badge label="Ada" onClick={() => {}} dismissible anchor={<i />} />);
    expect(container.querySelectorAll('button')).toHaveLength(2);
    expect(root(container).hasAttribute('data-interactive')).toBe(true);
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
  slots: ['root', 'action', 'dot', 'avatar', 'icon', 'label', 'count', 'endIcon', 'dismiss', 'anchor', 'corner'],
  dimension: { key: 'height', value: 20 },
  cssFile: 'packages/css/src/badge.css',
  meta: badgeMeta,
  preset: { define: defineBadge as any, props: { label: 'New' } },
  hook: { use: useBadge as any, config: { label: 'New' } },
  render: (config) => <Badge label="New" dot count={2} icon={<svg />} endIcon={<svg />} avatar={<img alt="" />} onClick={() => {}} dismissible anchor={<i />} {...config} />,
});
