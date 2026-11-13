import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { skeletonMeta } from '@pinfold/core/meta';
import { SKELETON_PRESETS, inactiveSkeletonOptions, normalizeSkeletonLayout, skeletonLineWidths, skeletonPreset, validateSkeletonLayout } from '@pinfold/core';
import { PinfoldProvider } from '@pinfold/react';
import { Skeleton } from './Skeleton';
import { useSkeleton } from './useSkeleton';
import { defineSkeleton } from './define';

describe('Skeleton', () => {
  it('is aria-busy while loading, with hidden placeholder lines; the last of several is shorter', () => {
    const { container } = render(<Skeleton lines={3} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-busy')).toBe('true');
    const lines = [...container.querySelectorAll<HTMLElement>('.pinfold-skeleton__line')];
    expect(lines).toHaveLength(3);
    expect(lines.every((l) => l.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(lines.map((l) => l.style.inlineSize)).toEqual(['100%', '100%', '62%']);
  });

  it('swaps to the content when loading is false', () => {
    const { container, rerender } = render(<Skeleton loading content={<p>Ready</p>} />);
    expect(screen.queryByText('Ready')).toBeNull();
    rerender(<Skeleton loading={false} content={<p>Ready</p>} />);
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(container.firstElementChild!.hasAttribute('aria-busy')).toBe(false);
    expect(container.querySelector('.pinfold-skeleton__line')).toBeNull();
  });

  it('announces a label only when given one', () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container.textContent).toBe('');
    rerender(<Skeleton label="Loading profile" />);
    expect(screen.getByText('Loading profile')).toBeTruthy();
  });

  it('only animates while loading, and never with disableAnimation', () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container.firstElementChild!.hasAttribute('data-animate')).toBe(true);
    rerender(<Skeleton animation="none" />);
    expect(container.firstElementChild!.hasAttribute('data-animate')).toBe(false);
    rerender(
      <PinfoldProvider disableAnimation>
        <Skeleton />
      </PinfoldProvider>,
    );
    expect(container.querySelector('.pinfold-skeleton')!.hasAttribute('data-animate')).toBe(false);
  });

  it('builds a layout from one config: shapes and nested groups', () => {
    const { container } = render(<Skeleton direction="row" items={[{ variant: 'circle', size: 'lg' }, { items: [{ lines: 2 }, { variant: 'rect', dimensions: { height: 40 } }] }]} />);
    const root = container.querySelector('.pinfold-skeleton')!;
    expect(root.getAttribute('data-direction')).toBe('row');
    expect(root.hasAttribute('data-variant')).toBe(false);
    const shapes = root.querySelectorAll('.pinfold-skeleton__shape');
    expect(shapes[0].getAttribute('data-variant')).toBe('circle');
    expect(shapes[0].getAttribute('data-size')).toBe('lg');
    expect(shapes[1].getAttribute('data-direction')).toBe('column');
    expect((shapes[3] as HTMLElement).style.getPropertyValue('--pinfold-skeleton-height')).toBe('40px');
    expect(root.querySelectorAll('.pinfold-skeleton__line')).toHaveLength(4);
    // Counted across the layout, for `stagger`.
    const last = root.querySelectorAll('.pinfold-skeleton__line')[3] as HTMLElement;
    expect(last.style.getPropertyValue('--pinfold-skel-i')).toBe('3');
  });

  it('draws the new shapes, a last-line width and an aspect ratio', () => {
    const { container, rerender } = render(<Skeleton lines={3} lastLine="40%" />);
    const widths = () => [...container.querySelectorAll<HTMLElement>('.pinfold-skeleton__line')].map((l) => l.style.inlineSize);
    expect(widths()).toEqual(['100%', '100%', '40%']);
    for (const variant of ['pill', 'square'] as const) {
      rerender(<Skeleton variant={variant} />);
      expect(container.firstElementChild!.getAttribute('data-variant')).toBe(variant);
      expect(container.querySelectorAll('.pinfold-skeleton__line')).toHaveLength(1);
    }
    rerender(<Skeleton variant="rect" ratio="16/9" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute('data-ratio')).toBe(true);
    expect(root.style.getPropertyValue('--pinfold-skel-ratio')).toBe('16/9');
    expect(skeletonLineWidths(2, 120)).toEqual(['100%', '120px']);
  });

  it('builds any layout from data: shapes, groups, options, repeats and embedded presets', () => {
    const { container } = render(
      <Skeleton
        layout={[
          { row: [{ circle: 40 }, { stack: [{ line: '60%' }, { line: '40%' }], gap: 6 }, { pill: true, width: 80 }], align: 'start' },
          { rect: true, ratio: '21/9', radius: 12 },
          { text: 3, last: '45%' },
          { grid: [{ square: true }], columns: 3, repeat: 2 },
          { row: [{ space: true }, { pill: 64 }] },
          { preset: 'avatar-text' },
        ]}
      />,
    );
    const root = container.querySelector('.pinfold-skeleton')!;
    expect(root.hasAttribute('data-layout')).toBe(true);
    expect(root.hasAttribute('data-variant')).toBe(false);
    const kinds = [...root.children].map((c) => c.getAttribute('data-kind'));
    expect(kinds).toEqual(['row', 'rect', 'text', 'grid', 'grid', 'row', 'row']);
    const row = root.children[0] as HTMLElement;
    expect([row.getAttribute('data-direction'), row.getAttribute('data-align')]).toEqual(['row', 'start']);
    const circle = row.children[0] as HTMLElement;
    expect([circle.getAttribute('data-variant'), circle.style.getPropertyValue('--pinfold-skel-w')]).toEqual(['circle', '40px']);
    expect((row.children[1] as HTMLElement).style.getPropertyValue('--pinfold-skel-g')).toBe('6px');
    expect(row.children[2].hasAttribute('data-fixed')).toBe(true);
    const rect = root.children[1] as HTMLElement;
    expect([rect.hasAttribute('data-ratio'), rect.style.getPropertyValue('--pinfold-skel-ratio'), rect.style.getPropertyValue('--pinfold-skel-r')]).toEqual([true, '21/9', '12px']);
    expect([...root.children[2].querySelectorAll<HTMLElement>('.pinfold-skeleton__line')].map((l) => l.style.inlineSize)).toEqual(['100%', '100%', '45%']);
    expect((root.children[3] as HTMLElement).style.getPropertyValue('--pinfold-skel-cols')).toBe('3');
    expect(root.children[5].children[0].hasAttribute('data-grow')).toBe(true);
    // Every painted line is hidden; the shapes are plain wrappers.
    expect([...root.querySelectorAll('.pinfold-skeleton__line')].every((l) => l.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('hands each layout node to a shape render override as `item`', () => {
    const seen: unknown[] = [];
    render(<Skeleton layout={[{ circle: 32 }, { line: '50%' }]} render={{ shape: ({ props, item, children }) => (seen.push(item), <div {...props}>{children}</div>) }} />);
    expect(seen).toEqual([{ circle: 32 }, { line: '50%' }]);
  });

  it('renders every preset, tuned by rows, columns and count', () => {
    for (const preset of SKELETON_PRESETS) {
      const { container, unmount } = render(<Skeleton preset={preset} />);
      const root = container.firstElementChild!;
      expect(`${preset}:${root.getAttribute('data-preset')}`).toBe(`${preset}:${preset}`);
      expect(root.querySelectorAll('.pinfold-skeleton__line').length).toBeGreaterThan(0);
      unmount();
    }
    const { container, rerender } = render(<Skeleton preset="list" rows={6} />);
    expect(container.querySelectorAll('[data-variant="circle"]')).toHaveLength(6);
    rerender(<Skeleton preset="table" rows={3} columns={5} />);
    expect(container.querySelector('.pinfold-skeleton')!.children[0].querySelectorAll('[data-kind="grid"]')).toHaveLength(4);
    expect(container.querySelector('[data-kind="grid"]')!.querySelectorAll('[data-kind="line"]')).toHaveLength(5);
    rerender(<Skeleton preset="card" count={3} columns={3} />);
    const grid = container.querySelector('.pinfold-skeleton')!.children[0] as HTMLElement;
    expect([grid.getAttribute('data-kind'), grid.style.getPropertyValue('--pinfold-skel-cols'), grid.children.length]).toEqual(['grid', '3', 3]);
    expect(skeletonPreset('text', { rows: 5 })).toEqual([{ text: 5 }]);
  });

  it('repeats a single shape with count', () => {
    const { container } = render(<Skeleton variant="circle" count={4} columns={4} />);
    expect(container.querySelectorAll('[data-variant="circle"]')).toHaveLength(4);
  });

  it('validates a layout in development and skips what it cannot draw', () => {
    expect(validateSkeletonLayout([{ line: '50%' }, { row: [{ circle: 32 }] }])).toEqual([]);
    const problems = validateSkeletonLayout([{ line: '50%', circle: 3 }, { lnie: true }, { rect: true, width: {} }, { preset: 'nope' }, 'x']);
    expect(problems).toHaveLength(6);
    expect(problems.join('\n')).toMatch(/two shapes/);
    expect(problems.join('\n')).toMatch(/lnie/);
    expect(normalizeSkeletonLayout([{ lnie: true }, { circle: true }]).map((b) => b.kind)).toEqual(['circle']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Skeleton layout={[{ sircle: 4 } as never]} />);
    expect(warn.mock.calls.some((c) => String(c.join(' ')).includes('sircle'))).toBe(true);
    warn.mockRestore();
  });

  it('announces one status for the whole region, never one per shape', () => {
    render(<Skeleton preset="dashboard" label="Loading dashboard" />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('Loading dashboard');
  });

  it('takes children on the tag as the content', () => {
    const { rerender } = render(<Skeleton preset="card">{<p>Card</p>}</Skeleton>);
    expect(screen.queryByText('Card')).toBeNull();
    rerender(<Skeleton preset="card" loading={false}>{<p>Card</p>}</Skeleton>);
    expect(screen.getByText('Card')).toBeTruthy();
  });

  it('lists what a layout or a preset makes inactive', () => {
    expect(inactiveSkeletonOptions({ layout: [] })).toMatchObject({ variant: expect.any(String), preset: expect.any(String), rows: expect.any(String) });
    expect(inactiveSkeletonOptions({ preset: 'card' })).not.toHaveProperty('rows');
    expect(inactiveSkeletonOptions({ ratio: 2 })).toHaveProperty('ratio');
  });

  it('a preset renders on the server', () => {
    const Avatar = defineSkeleton({ variant: 'circle', size: 'lg' });
    const html = renderToString(<Avatar />);
    expect(html).toContain('data-variant="circle"');
    expect(html).toContain('aria-busy="true"');
  });
});

describePinfoldConformance({
  name: 'skeleton',
  inherits: ['size'],
  slots: ['root', 'line', 'shape'],
  optionalSlots: ['shape'],
  dimension: { key: 'width', value: 120 },
  cssFile: 'packages/css/src/skeleton.css',
  meta: skeletonMeta,
  preset: { define: defineSkeleton as any, props: {} },
  hook: { use: useSkeleton as any, config: {} },
  render: (config) => <Skeleton lines={2} {...config} />,
});
