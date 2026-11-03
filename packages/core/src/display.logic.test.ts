// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatKeys, inactiveKbdOptions, kbdOs } from './kbd.logic';
import { inactiveSeparatorOptions } from './separator.logic';
import { inactiveSkeletonOptions, skeletonLineWidths } from './skeleton.logic';

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
