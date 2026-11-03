import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { skeletonMeta } from '@pinfold/core/meta';
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
  slots: ['root', 'line'],
  dimension: { key: 'width', value: 120 },
  cssFile: 'packages/css/src/skeleton.css',
  meta: skeletonMeta,
  preset: { define: defineSkeleton as any, props: {} },
  hook: { use: useSkeleton as any, config: {} },
  render: (config) => <Skeleton lines={2} {...config} />,
});
