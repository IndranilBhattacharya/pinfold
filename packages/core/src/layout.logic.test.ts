// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inactiveAppShellOptions, inactiveCarouselOptions, initialSizes, resizePanels, slideFromScroll, stepIndex } from './layout.logic';

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

  it('app shell: options listed inactive only when the config or the measured width rules them out', () => {
    const keys = (config: Parameters<typeof inactiveAppShellOptions>[0], drawer?: boolean) => Object.keys(inactiveAppShellOptions(config, drawer)).sort();
    const full = { navbar: 'bar', sidebar: 'nav' };
    // auto, width unknown: nothing can be ruled out.
    expect(keys(full)).toEqual([]);
    // auto, measured as a drawer: everything applies.
    expect(keys(full, true)).toEqual([]);
    // auto, measured wide: the drawer options wait for a narrow shell.
    expect(keys(full, false)).toEqual(['backdrop', 'closeOnNavigate', 'sidebarTrigger']);
    expect(inactiveAppShellOptions(full, false).backdrop).toMatch(/wider than `breakpoint`/);
    // inline: never a drawer, and the breakpoint is not used.
    expect(keys({ ...full, sidebarBehavior: 'inline' })).toEqual(['backdrop', 'breakpoint', 'closeOnNavigate', 'sidebarTrigger']);
    // drawer: always a drawer; only the breakpoint is unused.
    expect(keys({ ...full, sidebarBehavior: 'drawer' }, false)).toEqual(['breakpoint']);
    // No sidebar at all.
    expect(keys({ navbar: 'bar' })).toEqual(['backdrop', 'breakpoint', 'closeOnNavigate', 'sidebarBehavior', 'sidebarTrigger']);
    expect(keys({ navbar: 'bar', sidebar: false })).toEqual(['backdrop', 'breakpoint', 'closeOnNavigate', 'sidebarBehavior', 'sidebarTrigger']);
    // No bar: nowhere for the menu button, and nothing to position.
    expect(keys({ sidebar: 'nav' })).toEqual(['navbarPosition', 'sidebarTrigger']);
    expect(inactiveAppShellOptions({ sidebar: 'nav' }).sidebarTrigger).toMatch(/Shell\.SidebarTrigger/);
    // Neither: no layout to choose.
    expect(keys({})).toEqual(['backdrop', 'breakpoint', 'closeOnNavigate', 'layout', 'navbarPosition', 'sidebarBehavior', 'sidebarTrigger']);
    // scroll: content keeps the bar at the top.
    expect(keys({ ...full, scroll: 'content' })).toEqual(['navbarPosition']);
    expect(keys({ ...full, scroll: 'page' })).toEqual([]);
  });
});
