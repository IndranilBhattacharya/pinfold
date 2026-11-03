import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { progressMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Progress } from './Progress';
import { useProgress } from './useProgress';
import { defineProgress } from './define';

describe('Progress', () => {
  it('is a named progressbar with its value and value text', () => {
    render(<Progress label="Uploading" value={42} showValue />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuetext')).toBe('42%');
    expect(bar.querySelector('.pinfold-progress__value')!.getAttribute('aria-hidden')).toBe('true');
    expect((bar.querySelector('.pinfold-progress__indicator') as HTMLElement).style.inlineSize).toBe('42%');
  });

  it('is busy, not 0%, without a value', () => {
    render(<Progress label="Loading" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(bar.hasAttribute('aria-valuetext')).toBe(false);
    expect(bar.hasAttribute('data-indeterminate')).toBe(true);
  });

  it('a meter formats its own value text over a custom range', () => {
    render(<Progress kind="meter" label="Storage" value={16} max={64} formatValue={(v, { max }) => `${v} of ${max} GB`} />);
    const meter = screen.getByRole('meter', { name: 'Storage' });
    expect(meter.getAttribute('aria-valuetext')).toBe('16 of 64 GB');
    expect((meter.querySelector('.pinfold-progress__indicator') as HTMLElement).style.inlineSize).toBe('25%');
  });

  it('keeps a hidden label as the name; a ring draws its value as a dash offset', () => {
    const { container } = render(<Progress label="Sync" hideLabel shape="circle" value={30} />);
    expect(screen.getByRole('progressbar', { name: 'Sync' })).toBeTruthy();
    expect(container.querySelector('.pinfold-progress__label')!.getAttribute('style')).toContain('position: absolute');
    expect(container.querySelector('circle.pinfold-progress__indicator')!.getAttribute('stroke-dashoffset')).toBe('70');
  });

  it('stops moving under disableAnimation', () => {
    const { container } = render(
      <PinfoldProvider disableAnimation>
        <Progress label="x" />
      </PinfoldProvider>,
    );
    expect(container.querySelector('.pinfold-progress')!.hasAttribute('data-animate')).toBe(false);
  });

  it('a preset renders on the server', () => {
    const Upload = defineProgress({ showValue: true, tone: 'success' });
    const html = renderToString(<Upload label="Uploading" value={10} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('>10%<');
  });
});

describePinfoldConformance({
  name: 'progress',
  slots: ['root', 'label', 'value', 'track', 'indicator'],
  variants: false,
  dimension: { key: 'thickness', value: 6 },
  cssFile: 'packages/css/src/progress.css',
  meta: progressMeta,
  preset: { define: defineProgress as any, props: { label: 'Upload' } },
  hook: { use: useProgress as any, config: { label: 'Upload' } },
  render: (config) => <Progress label="Upload" value={40} showValue {...config} />,
});
