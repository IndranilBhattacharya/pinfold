import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { carouselMeta, resizableMeta } from '@pinfold/core/meta';
import { Carousel } from './Carousel';
import { useCarousel } from './useCarousel';
import { defineCarousel } from './define';
import { Resizable } from '../resizable/Resizable';
import { useResizable } from '../resizable/useResizable';
import { defineResizable } from '../resizable/define';

const slides = ['One', 'Two', 'Three', { label: 'Last one', content: 'Four' }];

describe('Carousel', () => {
  it('a named carousel of named slides; next and dots move it; the ends stop without loop', () => {
    const onIndexChange = vi.fn();
    render(<Carousel label="Offers" slides={slides} onIndexChange={onIndexChange} />);
    const region = screen.getByRole('region', { name: 'Offers' });
    expect(region.getAttribute('aria-roledescription')).toBe('carousel');
    expect(screen.getAllByRole('group').filter((g) => g.getAttribute('aria-roledescription') === 'slide').map((g) => g.getAttribute('aria-label'))).toEqual(['1 of 4', '2 of 4', '3 of 4', 'Last one']);
    expect(screen.getByRole('button', { name: 'Previous slide' }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 4' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('button', { name: 'Go to slide 4' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'Next slide' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('two in view: three positions; loop wraps; autoplay has a pause button that stops it', () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    render(<Carousel label="Offers" slides={slides} slidesPerView={2} loop autoplay={2000} onIndexChange={onIndexChange} />);
    expect(screen.getAllByRole('button', { name: /Go to slide/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    act(() => vi.advanceTimersByTime(2100));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    onIndexChange.mockClear();
    act(() => vi.advanceTimersByTime(5000));
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    vi.useRealTimers();
  });

  it('autoplay keeps its pace while the page around it renders more often than the interval (a clock, live data)', () => {
    vi.useFakeTimers();
    try {
      const onIndexChange = vi.fn();
      function Page() {
        const [, tick] = React.useState(0);
        React.useEffect(() => {
          const t = setInterval(() => tick((n) => n + 1), 500);
          return () => clearInterval(t);
        }, []);
        return <Carousel label="Offers" slides={slides} loop autoplay={2000} onIndexChange={onIndexChange} />;
      }
      render(<Page />);
      // Half a second at a time, so each page render really happens in between.
      const wait = (ms: number) => {
        for (let t = 0; t < ms; t += 500) act(() => vi.advanceTimersByTime(500));
      };
      wait(2500);
      expect(onIndexChange).toHaveBeenLastCalledWith(1);
      wait(2000);
      expect(onIndexChange).toHaveBeenLastCalledWith(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

const panels = [
  { id: 'files', label: 'Files', defaultSize: 30, min: 20, max: 60, content: 'files' },
  { id: 'code', label: 'Code', content: 'code' },
];

describe('Resizable', () => {
  it('a named group; the handle is a separator with its value; arrows, Home and End move it within limits', () => {
    const onResize = vi.fn();
    render(<Resizable label="Editor" panels={panels} onResize={onResize} />);
    screen.getByRole('group', { name: 'Editor' });
    const handle = screen.getByRole('separator', { name: 'Resize Files' });
    expect(handle.getAttribute('aria-valuenow')).toBe('30');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onResize).toHaveBeenLastCalledWith([35, 65]);
    fireEvent.keyDown(handle, { key: 'End' });
    expect(onResize).toHaveBeenLastCalledWith([60, 40]);
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(onResize).toHaveBeenLastCalledWith([20, 80]);
    fireEvent.doubleClick(handle);
    expect(onResize).toHaveBeenLastCalledWith([30, 70]);
  });

  it('nests: a group in a panel content resizes on its own axis, and neither group moves the other', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <Resizable
        label="Workbench"
        onResize={outer}
        panels={[
          { id: 'files', label: 'Files', defaultSize: 25, content: 'tree' },
          {
            id: 'centre',
            label: 'Centre',
            content: (
              <Resizable
                label="Centre"
                orientation="vertical"
                onResize={inner}
                panels={[
                  { id: 'editor', label: 'Editor', content: 'code' },
                  { id: 'terminal', label: 'Terminal', defaultSize: 30, content: 'shell' },
                ]}
              />
            ),
          },
        ]}
      />,
    );
    const outerHandle = screen.getByRole('separator', { name: 'Resize Files' });
    const innerHandle = screen.getByRole('separator', { name: 'Resize Editor' });
    expect(outerHandle.getAttribute('aria-orientation')).toBe('vertical');
    expect(innerHandle.getAttribute('aria-orientation')).toBe('horizontal');
    fireEvent.keyDown(innerHandle, { key: 'ArrowDown' });
    expect(inner).toHaveBeenLastCalledWith([75, 25]);
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(outerHandle, { key: 'ArrowRight' });
    expect(outer).toHaveBeenLastCalledWith([30, 70]);
    expect(inner).toHaveBeenCalledTimes(1);
    const controls = [outerHandle, innerHandle].map((h) => h.getAttribute('aria-controls'));
    expect(new Set(controls).size).toBe(2);
    for (const id of controls) expect(document.getElementById(id!)).not.toBeNull();
  });

  it('autoSaveId keeps the sizes in this browser; renders the defaults on the server', () => {
    localStorage.setItem('pinfold-resizable:test', JSON.stringify([45, 55]));
    render(<Resizable label="Editor" panels={panels} autoSaveId="test" />);
    expect(screen.getByRole('separator').getAttribute('aria-valuenow')).toBe('45');
    localStorage.removeItem('pinfold-resizable:test');
    const html = renderToString(React.createElement(defineResizable({ handle: 'grip' }), { label: 'E', panels }));
    expect(html).toContain('aria-valuenow="30"');
    expect(html).toContain('pinfold-resizable__grip');
  });
});

describePinfoldConformance({
  name: 'carousel',
  variants: false,
  slots: ['root', 'viewport', 'track', 'slide', 'previous', 'next', 'indicators', 'indicator'],
  optionalSlots: ['play'],
  cssFile: 'packages/css/src/carousel.css',
  meta: carouselMeta,
  preset: { define: defineCarousel as any, props: { label: 'C', slides } },
  hook: { use: useCarousel as any, config: { label: 'C', slides } },
  render: (config) => <Carousel label="C" slides={slides} {...config} />,
});

describePinfoldConformance({
  name: 'resizable',
  variants: false,
  slots: ['root', 'panel', 'handle'],
  optionalSlots: ['grip'],
  cssFile: 'packages/css/src/resizable.css',
  meta: resizableMeta,
  preset: { define: defineResizable as any, props: { label: 'R', panels } },
  hook: { use: useResizable as any, config: { label: 'R', panels } },
  render: (config) => <Resizable label="R" panels={panels} {...config} />,
});
