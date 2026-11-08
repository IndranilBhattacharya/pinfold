// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inactiveCarouselOptions, initialSizes, resizePanels, slideFromScroll, stepIndex } from './layout.logic';

describe('layout logic', () => {
  it('carousel: the slide in view, steps that wrap or hold', () => {
    expect(slideFromScroll(0, 300, 16, 5)).toBe(0);
    expect(slideFromScroll(320, 300, 16, 5)).toBe(1);
    expect(slideFromScroll(-640, 300, 16, 5)).toBe(2);
    expect(slideFromScroll(99999, 300, 16, 5)).toBe(4);
    expect(stepIndex(4, 1, 5, true)).toBe(0);
    expect(stepIndex(0, -1, 5, true)).toBe(4);
    expect(stepIndex(4, 1, 5, false)).toBe(4);
    expect(Object.keys(inactiveCarouselOptions({ slides: [1, 2], slidesPerView: 2 }))).toEqual(['controls', 'loop']);
    expect(inactiveCarouselOptions({ slides: [1, 2, 3] })).toEqual({});
  });

  it('resizable: space moves between the two neighbours, held by min and max', () => {
    expect(resizePanels([50, 50], 0, 10, [20, 20], [80, 80])).toEqual([60, 40]);
    expect(resizePanels([50, 50], 0, 40, [20, 20], [80, 80])).toEqual([80, 20]);
    expect(resizePanels([30, 40, 30], 1, -50, [10, 10, 10], [100, 100, 100])).toEqual([30, 10, 60]);
    expect(resizePanels([50, 50], 0, -45, [0, 0], [100, 70])).toEqual([30, 70]);
    expect(initialSizes([25, undefined, undefined])).toEqual([25, 37.5, 37.5]);
    expect(initialSizes([60, 60])).toEqual([50, 50]);
  });
});
