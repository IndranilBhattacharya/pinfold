import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { tourMeta } from '@pinfold/core/meta';
import { spotlightPath, spotlightRect } from '@pinfold/core';
import { Tour } from './Tour';
import { useTour } from './useTour';
import { defineTour } from './define';
import type { TourStep } from './types';

const steps: TourStep[] = [
  { target: '#search', title: 'Search', content: 'Find anything.' },
  { target: '#create', title: 'Create', content: 'Start here.' },
  { title: 'All set', content: 'Enjoy.' },
];
function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <button id="opener">Open</button>
      <input id="search" aria-label="Search box" />
      <button id="create">New</button>
      {children}
    </>
  );
}
const dialog = () => screen.getByRole('dialog');

describe('Tour', () => {
  it('opens on a step as a modal dialog named by its title, with a counter and dots; focus moves in and returns on close', () => {
    const { rerender } = render(<Page><Tour steps={steps} open={false} /></Page>);
    const opener = screen.getByRole('button', { name: 'Open' });
    act(() => opener.focus());
    rerender(<Page><Tour steps={steps} open /></Page>);
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(dialog().getAttribute('aria-labelledby')).toBe(screen.getByRole('heading', { name: 'Search' }).id);
    expect(document.getElementById(dialog().getAttribute('aria-describedby')!)!.textContent).toBe('Find anything.');
    expect(dialog().textContent).toContain('1 of 3');
    expect(document.querySelectorAll('.pinfold-tour__dot')).toHaveLength(3);
    expect(document.activeElement).toBe(dialog());
    expect(document.querySelector('.pinfold-tour__spotlight')).toBeTruthy();
    rerender(<Page><Tour steps={steps} open={false} /></Page>);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('Next, Back, arrows and Enter move between steps; Done completes; a step without a target is centred', () => {
    const onStepChange = vi.fn();
    const onComplete = vi.fn();
    const onOpenChange = vi.fn();
    render(<Page><Tour steps={steps} defaultOpen onStepChange={onStepChange} onComplete={onComplete} onOpenChange={onOpenChange} /></Page>);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onStepChange).toHaveBeenLastCalledWith(1, steps[1]);
    expect(dialog().textContent).toContain('2 of 3');
    fireEvent.keyDown(dialog(), { key: 'ArrowLeft' });
    expect(onStepChange).toHaveBeenLastCalledWith(0, steps[0]);
    fireEvent.keyDown(dialog(), { key: 'ArrowRight' });
    fireEvent.keyDown(dialog(), { key: 'Enter' });
    expect(onStepChange).toHaveBeenLastCalledWith(2, steps[2]);
    expect(dialog().hasAttribute('data-centered')).toBe(true);
    expect(document.querySelector('.pinfold-tour')!.hasAttribute('data-centered')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Skip and Escape skip; Escape can be turned off', () => {
    const onSkip = vi.fn();
    const { rerender } = render(<Page><Tour steps={steps} defaultOpen onSkip={onSkip} /></Page>);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(onSkip).toHaveBeenLastCalledWith(0, steps[0]);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Page><Tour steps={steps} open closeOnEscape={false} onSkip={onSkip} /></Page>);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it('beforeStep can hold a step, synchronously or after a promise', async () => {
    let allow = false;
    let release: (ok: boolean) => void = () => {};
    const beforeStep = vi.fn((from: number, to: number) => (to === 1 ? allow : new Promise<boolean>((r) => (release = r))));
    render(<Page><Tour steps={steps} defaultOpen beforeStep={beforeStep} /></Page>);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(beforeStep).toHaveBeenLastCalledWith(0, 1);
    expect(dialog().textContent).toContain('1 of 3');
    allow = true;
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(dialog().textContent).toContain('2 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(document.querySelector('.pinfold-tour')!.hasAttribute('data-pending')).toBe(true);
    await act(async () => release(true));
    expect(dialog().textContent).toContain('3 of 3');
    expect(document.querySelector('.pinfold-tour')!.hasAttribute('data-pending')).toBe(false);
  });

  it('a missing target is centred by default, or skipped with missingTarget: skip', () => {
    const missing: TourStep[] = [{ title: 'One' }, { target: '#nowhere', title: 'Gone' }, { title: 'Three' }];
    const { unmount } = render(<Page><Tour steps={missing} defaultOpen defaultStep={1} /></Page>);
    expect(dialog().hasAttribute('data-centered')).toBe(true);
    expect(dialog().textContent).toContain('Gone');
    unmount();
    render(<Page><Tour steps={missing} defaultOpen missingTarget="skip" /></Page>);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(dialog().textContent).toContain('Three');
  });

  it('accepts a ref or a function as a target; the controller starts, moves and closes', () => {
    let api: ReturnType<typeof useTour> | undefined;
    function App() {
      const ref = React.useRef<HTMLButtonElement>(null);
      api = useTour({ steps: [{ target: ref, title: 'By ref' }, { target: () => document.getElementById('fn'), title: 'By function' }], mask: 'none' });
      const Walk = api;
      return (
        <>
          <button ref={ref}>R</button>
          <button id="fn">F</button>
          <Walk />
        </>
      );
    }
    render(<App />);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => api!.start());
    expect(dialog().hasAttribute('data-centered')).toBe(false);
    expect(dialog().getAttribute('aria-modal')).toBeNull();
    expect(document.querySelector('.pinfold-tour__overlay')).toBeNull();
    act(() => api!.next());
    expect(api!.step).toBe(1);
    expect(dialog().hasAttribute('data-centered')).toBe(false);
    act(() => api!.close());
    expect(api!.open).toBe(false);
  });

  it('cuts the hole with one even-odd path that keeps its commands', () => {
    const hole = spotlightRect({ x: 100, y: 50, width: 80, height: 30 }, 8, { width: 800, height: 600 });
    expect(hole).toEqual({ x: 92, y: 42, width: 96, height: 46 });
    const a = spotlightPath({ width: 800, height: 600 }, hole, 12);
    const b = spotlightPath({ width: 800, height: 600 }, null, 12);
    expect(a.startsWith("path(evenodd, 'M0 0H800V600H0Z")).toBe(true);
    expect(a.replace(/[\d.]+/g, '#')).toBe(b.replace(/[\d.]+/g, '#'));
  });
});

describePinfoldConformance({
  name: 'tour',
  variants: false,
  slots: ['root', 'card', 'header', 'counter', 'title', 'content', 'footer', 'progress', 'dot', 'actions', 'overlay'],
  optionalSlots: ['spotlight', 'arrow'],
  dimension: { key: 'width', value: 360 },
  cssFile: 'packages/css/src/tour.css',
  meta: tourMeta,
  preset: { define: defineTour as any, props: { steps, defaultOpen: true }, probe: { key: 'size', values: ['sm', 'lg', 'md'] } },
  hook: { use: useTour as any, config: { steps, defaultOpen: true } },
  render: (config) => <Tour steps={steps} defaultOpen {...config} />,
});
