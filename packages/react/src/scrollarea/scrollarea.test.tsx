import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { scrollareaMeta } from '@pinfold/core/meta';
import { scrollEdges, atScrollEnd, watchScrollEdges } from '@pinfold/core';
import { ScrollArea } from './ScrollArea';
import { useScrollArea } from './useScrollArea';
import { defineScrollArea } from './define';

/** jsdom has no layout: give a viewport the numbers a browser would. */
function size(el: HTMLElement, m: Partial<Record<'scrollTop' | 'scrollHeight' | 'clientHeight' | 'scrollLeft' | 'scrollWidth' | 'clientWidth', number>>) {
  for (const [key, value] of Object.entries(m)) Object.defineProperty(el, key, { configurable: true, writable: true, value });
}
const frame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe('scroll rules', () => {
  const box = { scrollTop: 0, scrollHeight: 100, clientHeight: 100, scrollLeft: 0, scrollWidth: 100, clientWidth: 100 };
  it('reports only the edges that hide content', () => {
    expect(scrollEdges(box)).toEqual({ top: false, bottom: false, start: false, end: false });
    expect(scrollEdges({ ...box, scrollHeight: 400 })).toEqual({ top: false, bottom: true, start: false, end: false });
    expect(scrollEdges({ ...box, scrollHeight: 400, scrollTop: 150 })).toMatchObject({ top: true, bottom: true });
    expect(scrollEdges({ ...box, scrollHeight: 400, scrollTop: 300 })).toMatchObject({ top: true, bottom: false });
  });
  it('reads right-to-left offsets (negative scrollLeft) as distance from the start', () => {
    expect(scrollEdges({ ...box, scrollWidth: 400, scrollLeft: -150 })).toMatchObject({ start: true, end: true });
    expect(scrollEdges({ ...box, scrollWidth: 400, scrollLeft: -300 })).toMatchObject({ start: true, end: false });
  });
  it('absorbs fractional offsets at an end', () => {
    expect(scrollEdges({ ...box, scrollHeight: 400, scrollTop: 299.5 }).bottom).toBe(false);
    expect(atScrollEnd({ scrollTop: 280, scrollHeight: 400, clientHeight: 100 })).toBe(true);
    expect(atScrollEnd({ scrollTop: 200, scrollHeight: 400, clientHeight: 100 })).toBe(false);
  });
  it('watching writes the attributes and removes everything it added on cleanup', () => {
    const el = document.createElement('div');
    size(el, { scrollHeight: 400, clientHeight: 100, scrollTop: 0, scrollWidth: 100, clientWidth: 100, scrollLeft: 0 });
    const add = vi.spyOn(el, 'addEventListener');
    const remove = vi.spyOn(el, 'removeEventListener');
    const onChange = vi.fn();
    const stop = watchScrollEdges(el, { onChange });
    expect(el.hasAttribute('data-overflow-bottom')).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
    expect(el.hasAttribute('data-overflow-bottom')).toBe(false);
    expect(remove).toHaveBeenCalledTimes(add.mock.calls.length);
  });
});

describe('ScrollArea', () => {
  it('marks the edges that hide content and becomes focusable only while it overflows', async () => {
    const onEdgesChange = vi.fn();
    const { container } = render(<ScrollArea label="Log" onEdgesChange={onEdgesChange}>rows</ScrollArea>);
    const root = container.querySelector('.pinfold-scrollarea') as HTMLElement;
    const viewport = screen.getByRole('region', { name: 'Log' });
    expect(viewport.hasAttribute('tabindex')).toBe(false);
    size(viewport, { scrollHeight: 400, clientHeight: 100, scrollTop: 50 });
    fireEvent.scroll(viewport);
    await frame();
    expect(root.hasAttribute('data-overflow-top')).toBe(true);
    expect(root.hasAttribute('data-overflow-bottom')).toBe(true);
    expect(onEdgesChange).toHaveBeenLastCalledWith({ top: true, bottom: true, start: false, end: false });
    expect(viewport.getAttribute('tabindex')).toBe('0');
  });

  it('reports reaching an end once per arrival', () => {
    const onReachEnd = vi.fn();
    const onReachStart = vi.fn();
    render(<ScrollArea label="Feed" onReachEnd={onReachEnd} onReachStart={onReachStart} content="rows" />);
    const viewport = screen.getByRole('region');
    size(viewport, { scrollHeight: 1000, clientHeight: 100, scrollTop: 400 });
    fireEvent.scroll(viewport);
    expect(onReachEnd).not.toHaveBeenCalled();
    size(viewport, { scrollTop: 880 });
    fireEvent.scroll(viewport);
    size(viewport, { scrollTop: 900 });
    fireEvent.scroll(viewport);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
    size(viewport, { scrollTop: 10 });
    fireEvent.scroll(viewport);
    expect(onReachStart).toHaveBeenCalledTimes(1);
  });

  it('draws strips for shadow, glow and line; none for fade', () => {
    const { container, rerender } = render(<ScrollArea indicator="shadow">x</ScrollArea>);
    expect(container.querySelectorAll('.pinfold-scrollarea__indicator')).toHaveLength(4);
    expect(container.querySelector('.pinfold-scrollarea__indicator')!.getAttribute('aria-hidden')).toBe('true');
    rerender(<ScrollArea indicator="fade">x</ScrollArea>);
    expect(container.querySelectorAll('.pinfold-scrollarea__indicator')).toHaveLength(0);
  });

  it('the controller scrolls the viewport, never the page', () => {
    let api: ReturnType<typeof useScrollArea> | undefined;
    function App() {
      api = useScrollArea({ label: 'Chat' });
      const Area = api;
      return <Area>rows</Area>;
    }
    render(<App />);
    const viewport = screen.getByRole('region');
    const scrollTo = vi.fn();
    viewport.scrollTo = scrollTo as any;
    size(viewport, { scrollHeight: 900, clientHeight: 100 });
    act(() => api!.scrollToEnd({ behavior: 'instant' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: 'auto' });
    act(() => api!.scrollToStart());
    expect(scrollTo.mock.calls[1][0]).toMatchObject({ top: 0, left: 0 });
    expect(api!.getViewport()).toBe(viewport);
  });

  it('two uses of one preset keep their own state', async () => {
    const Scroll = defineScrollArea({ indicator: 'line' });
    const { container } = render(
      <>
        <Scroll label="A">a</Scroll>
        <Scroll label="B">b</Scroll>
      </>,
    );
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>('.pinfold-scrollarea'));
    size(screen.getByRole('region', { name: 'A' }), { scrollHeight: 400, clientHeight: 100, scrollTop: 0 });
    fireEvent.scroll(screen.getByRole('region', { name: 'A' }));
    await frame();
    expect(a.hasAttribute('data-overflow-bottom')).toBe(true);
    expect(b.hasAttribute('data-overflow-bottom')).toBe(false);
  });
});

describePinfoldConformance({
  name: 'scrollarea',
  variants: false,
  inherits: ['tone'],
  slots: ['root', 'viewport', 'content'],
  optionalSlots: ['indicator'],
  dimension: { key: 'maxHeight', value: 240 },
  cssFile: 'packages/css/src/scrollarea.css',
  meta: scrollareaMeta,
  preset: { define: defineScrollArea as any, props: { content: 'x' }, probe: { key: 'indicator', values: ['shadow', 'glow', 'line'] } },
  hook: { use: useScrollArea as any, config: { content: 'x' } },
  render: (config) => <ScrollArea content="x" {...config} />,
});
