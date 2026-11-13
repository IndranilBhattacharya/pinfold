import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { progressMeta } from '@pinfold/core/meta';
import { inactiveProgressOptions, progressSegmentFills, progressToneAt, progressValuePosition } from '@pinfold/core';
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

  it('draws a buffer behind the indicator, on a bar and on a ring', () => {
    const { container, rerender } = render(<Progress label="Play" value={30} buffer={70} />);
    expect((container.querySelector('.pinfold-progress__buffer') as HTMLElement).style.inlineSize).toBe('70%');
    rerender(<Progress label="Play" shape="circle" value={30} buffer={70} />);
    expect(container.querySelector('circle.pinfold-progress__buffer')!.getAttribute('stroke-dashoffset')).toBe('30');
    // Nothing to buffer ahead of while indeterminate, or on a meter.
    rerender(<Progress label="Play" buffer={70} />);
    expect(container.querySelector('.pinfold-progress__buffer')).toBeNull();
    rerender(<Progress label="Disk" kind="meter" value={3} buffer={70} />);
    expect(container.querySelector('.pinfold-progress__buffer')).toBeNull();
  });

  it('places the value text: top by default on a bar, inside a ring, and where asked', () => {
    const { container, rerender } = render(<Progress label="Up" value={50} />);
    const root = () => container.firstElementChild!;
    expect(root().getAttribute('data-value-position')).toBe('top');
    expect(container.querySelector('.pinfold-progress__header .pinfold-progress__value')).toBeTruthy();
    rerender(<Progress label="Up" value={50} valuePosition="end" />);
    expect(container.querySelector('.pinfold-progress__body .pinfold-progress__value')).toBeTruthy();
    rerender(<Progress label="Up" value={50} valuePosition="bottom" />);
    expect(container.querySelector('.pinfold-progress__footer .pinfold-progress__value')).toBeTruthy();
    rerender(<Progress label="Up" value={50} valuePosition="inside" />);
    expect(container.querySelector('.pinfold-progress__track > .pinfold-progress__value')!.getAttribute('data-fit')).toBe('fill');
    rerender(<Progress label="Up" value={5} valuePosition="inside" />);
    expect(container.querySelector('.pinfold-progress__track > .pinfold-progress__value')!.getAttribute('data-fit')).toBe('track');
    rerender(<Progress label="Up" value={50} shape="circle" />);
    expect(root().getAttribute('data-value-position')).toBe('inside');
    expect(container.querySelector('.pinfold-progress__figure .pinfold-progress__value')).toBeTruthy();
    rerender(<Progress label="Up" value={50} shape="circle" valuePosition="end" />);
    expect(container.querySelector('.pinfold-progress__caption .pinfold-progress__value')).toBeTruthy();
  });

  it('shows a custom valueLabel and label from the state, while the value text stays what is read', () => {
    render(<Progress value={30} max={60} label={(s) => (s.complete ? 'Done' : 'Copying')} valueLabel={(s) => <b>{s.value} of {s.max}</b>} />);
    const bar = screen.getByRole('progressbar', { name: 'Copying' });
    expect(bar.getAttribute('aria-valuetext')).toBe('50%');
    expect(bar.querySelector('.pinfold-progress__value b')!.textContent).toBe('30 of 60');
  });

  it('links a description and renders start and end content', () => {
    render(<Progress label="Import" value={3} description={(s) => `${s.text} of the rows`} startContent={<i data-start="" />} endContent={<button type="button">Cancel</button>} />);
    const bar = screen.getByRole('progressbar', { name: 'Import' });
    expect(bar.getAttribute('aria-describedby')).toBe(bar.querySelector('.pinfold-progress__description')!.id);
    expect(screen.getByRole('progressbar', { description: '3% of the rows' })).toBe(bar);
    expect(bar.querySelector('.pinfold-progress__start [data-start]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('picks the tone from `tones` by value, whatever their order', () => {
    const tones = [{ at: 90, tone: 'danger' }, { at: 70, tone: 'warning' }] as const;
    const { container, rerender } = render(<Progress label="Disk" kind="meter" value={50} tones={tones} tone="success" />);
    const tone = () => container.firstElementChild!.getAttribute('data-tone');
    expect(tone()).toBe('success');
    rerender(<Progress label="Disk" kind="meter" value={75} tones={tones} />);
    expect(tone()).toBe('warning');
    rerender(<Progress label="Disk" kind="meter" value={95} tones={tones} />);
    expect(tone()).toBe('danger');
    expect(progressToneAt(undefined, tones)).toBeUndefined();
  });

  it('cuts a segmented bar and ring into steps, each filled in turn', () => {
    const { container, rerender } = render(<Progress label="Setup" variant="segmented" segments={4} value={60} />);
    const segments = [...container.querySelectorAll<HTMLElement>('.pinfold-progress__segment')];
    expect(segments).toHaveLength(4);
    expect(segments.map((s) => (s.querySelector('.pinfold-progress__indicator') as HTMLElement).style.inlineSize)).toEqual(['100%', '100%', '40%', '0%']);
    rerender(<Progress label="Setup" variant="segmented" segments={4} value={60} shape="semicircle" />);
    expect(container.querySelectorAll('path.pinfold-progress__segment')).toHaveLength(4);
    expect(container.querySelectorAll('path.pinfold-progress__indicator')).toHaveLength(4);
    // A render override gets each segment as `item`.
    const seen: number[] = [];
    rerender(<Progress label="Setup" variant="segmented" segments={3} value={50} render={{ segment: ({ props, item, children }) => (seen.push(item!.fill), <span {...props}>{children}</span>) }} />);
    expect(seen.map(Math.round)).toEqual([100, 50, 0]);
    expect(progressSegmentFills(50, 4)).toEqual([100, 100, 0, 0]);
  });

  it('is indeterminate in every shape and variety', () => {
    for (const shape of ['bar', 'circle', 'semicircle'] as const) {
      for (const variant of ['solid', 'striped', 'segmented'] as const) {
        const { container, unmount } = render(<Progress label="Busy" shape={shape} variant={variant} />);
        const root = container.firstElementChild!;
        expect(`${shape}/${variant}:${root.hasAttribute('data-indeterminate')}:${root.hasAttribute('aria-valuenow')}`).toBe(`${shape}/${variant}:true:false`);
        expect(root.getAttribute('data-variant')).toBe(variant);
        unmount();
      }
    }
  });

  it('calls onComplete once each time the value reaches max from below', () => {
    const onComplete = vi.fn();
    const { rerender } = render(<Progress label="Up" value={100} onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled(); // started there
    rerender(<Progress label="Up" value={40} onComplete={onComplete} />);
    act(() => rerender(<Progress label="Up" value={100} onComplete={onComplete} />));
    expect(onComplete).toHaveBeenCalledTimes(1);
    rerender(<Progress label="Up" value={100} onComplete={onComplete} />);
    rerender(<Progress label="Up" value={120} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
    rerender(<Progress label="Up" onComplete={onComplete} />);
    rerender(<Progress label="Up" value={100} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('progressbar').hasAttribute('data-complete')).toBe(true);
  });

  it('lists what has no effect for the shape, variety or kind', () => {
    expect(Object.keys(inactiveProgressOptions({ value: 1 }))).toEqual(['segments']);
    expect(inactiveProgressOptions({ value: 1, shape: 'semicircle', variant: 'striped' })).toHaveProperty('variant');
    expect(inactiveProgressOptions({ kind: 'meter', buffer: 3, variant: 'segmented' })).toMatchObject({ buffer: expect.any(String), onComplete: expect.any(String) });
    expect(inactiveProgressOptions({ value: 1, showValue: false })).toHaveProperty('valuePosition');
    expect(progressValuePosition('inside', 'bar', 'segmented')).toBe('end');
    expect(progressValuePosition(undefined, 'semicircle')).toBe('inside');
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
  slots: ['root', 'label', 'value', 'track', 'indicator', 'buffer', 'description', 'start', 'end'],
  variants: false,
  dimension: { key: 'thickness', value: 6 },
  cssFile: 'packages/css/src/progress.css',
  meta: progressMeta,
  preset: { define: defineProgress as any, props: { label: 'Upload' } },
  hook: { use: useProgress as any, config: { label: 'Upload' } },
  render: (config) => <Progress label="Upload" value={40} buffer={60} showValue description="Two files" startContent="S" endContent="E" {...config} />,
});
