// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatKeys, inactiveKbdOptions, kbdOs } from './kbd.logic';
import { inactiveSeparatorOptions } from './separator.logic';
import { inactiveSkeletonOptions, skeletonLineWidths } from './skeleton.logic';
import { badgeCount, inactiveBadgeOptions } from './badge.logic';

describe('kbd logic', () => {
  it('maps mod to Command on Apple platforms and Ctrl elsewhere, with spoken names', () => {
    expect(formatKeys(['mod', 'shift', 'k'], 'apple')).toEqual([
      { display: '⌘', spoken: 'Command' },
      { display: '⇧', spoken: 'Shift' },
      { display: 'K', spoken: 'K' },
    ]);
    expect(formatKeys(['mod', 'k'], 'other').map((k) => k.display)).toEqual(['Ctrl', 'K']);
    expect(formatKeys(['mod', 'k'], 'other', 'symbols').map((k) => k.display)).toEqual(['⌃', 'K']);
    expect(formatKeys(['Option', 'Return', 'F5'], 'apple', 'text').map((k) => k.display)).toEqual(['Alt', 'Enter', 'F5']);
  });

  it('detects Apple platforms; unknown is other (the server)', () => {
    expect(kbdOs('MacIntel')).toBe('apple');
    expect(kbdOs('iPhone')).toBe('apple');
    expect(kbdOs('Win32')).toBe('other');
    expect(kbdOs(undefined)).toBe('other');
  });

  it('names the separator inactive when symbols sit side by side', () => {
    expect(Object.keys(inactiveKbdOptions({ os: 'apple' }))).toEqual(['separator']);
    expect(inactiveKbdOptions({ os: 'other' })).toEqual({});
    expect(inactiveKbdOptions({ os: 'apple', display: 'text' })).toEqual({});
  });
});

describe('separator and skeleton logic', () => {
  it('separator: labelPosition needs a label; vertical separators take none', () => {
    expect(Object.keys(inactiveSeparatorOptions({}))).toEqual(['labelPosition']);
    expect(Object.keys(inactiveSeparatorOptions({ label: 'or' }))).toEqual(['decorative']);
    expect(Object.keys(inactiveSeparatorOptions({ label: 'or', orientation: 'vertical' }))).toEqual(['label']);
  });

  it('skeleton: lines only for text, nothing animates once loaded; the last line is shorter', () => {
    expect(Object.keys(inactiveSkeletonOptions({ variant: 'circle' }))).toEqual(['lines']);
    expect(Object.keys(inactiveSkeletonOptions({ loading: false })).sort()).toEqual(['animation', 'lines']);
    expect(skeletonLineWidths(3)).toEqual(['100%', '100%', '62%']);
    expect(skeletonLineWidths(1)).toEqual(['100%']);
  });
});

describe('badge logic', () => {
  it('caps counts, hides zero and junk', () => {
    expect(badgeCount(5)).toBe('5');
    expect(badgeCount(120)).toBe('99+');
    expect(badgeCount(1000, 999)).toBe('999+');
    expect(badgeCount(0)).toBeNull();
    expect(badgeCount(0, 99, true)).toBe('0');
    expect(badgeCount(-3, 99, true)).toBe('0');
    expect(badgeCount(Number.NaN)).toBeNull();
    expect(badgeCount(2.7)).toBe('2');
  });

  it('lists what a dot or a missing count ignores', () => {
    expect(Object.keys(inactiveBadgeOptions({}))).toEqual(['max', 'showZero']);
    expect(inactiveBadgeOptions({ count: 3 })).toEqual({});
    expect(Object.keys(inactiveBadgeOptions({ dot: true, count: 3 }))).toEqual(['max', 'showZero', 'icon', 'radius']);
  });
});
