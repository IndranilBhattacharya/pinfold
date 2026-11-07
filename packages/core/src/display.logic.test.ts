// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatKeys, inactiveKbdOptions, kbdOs } from './kbd.logic';
import { inactiveSeparatorOptions } from './separator.logic';
import { inactiveSkeletonOptions, skeletonLineWidths } from './skeleton.logic';
import { badgeCount, badgeDotOnly, inactiveBadgeOptions } from './badge.logic';
import { avatarInitials, avatarOverflow, avatarTone, inactiveAvatarOptions } from './avatar.logic';
import { inactiveProgressOptions, progressPercent, progressValueText } from './progress.logic';

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
    expect(Object.keys(inactiveSkeletonOptions({ variant: 'circle' }))).toEqual(['direction', 'lines']);
    expect(Object.keys(inactiveSkeletonOptions({ items: [] }))).toEqual(['variant', 'lines']);
    expect(Object.keys(inactiveSkeletonOptions({ loading: false })).sort()).toEqual(['animation', 'direction', 'lines']);
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

  it('lists what a missing count, a missing anchor or a lone dot ignores', () => {
    expect(Object.keys(inactiveBadgeOptions({}))).toEqual(['max', 'showZero', 'placement', 'anchorShape']);
    expect(inactiveBadgeOptions({ count: 3, anchor: 'x' })).toEqual({});
    expect(Object.keys(inactiveBadgeOptions({ dot: true, anchor: 'x' }))).toEqual(['max', 'showZero', 'radius', 'variant']);
    expect(Object.keys(inactiveBadgeOptions({ dot: true, label: 'Online', anchor: 'x' }))).toEqual(['max', 'showZero']);
  });

  it('a dot is alone only with nothing beside it', () => {
    expect(badgeDotOnly({ dot: true })).toBe(true);
    expect(badgeDotOnly({ dot: true, label: 'x' })).toBe(false);
    expect(badgeDotOnly({ dot: true, count: 2 })).toBe(false);
    expect(badgeDotOnly({})).toBe(false);
  });
});

describe('avatar logic', () => {
  it('makes initials and a stable tone from a name', () => {
    expect(avatarInitials('Ada Lovelace')).toBe('AL');
    expect(avatarInitials('  grace  brewster murray hopper ')).toBe('GH');
    expect(avatarInitials('Ümit')).toBe('Ü');
    expect(avatarInitials('')).toBe('');
    expect(avatarTone('Ada Lovelace')).toBe(avatarTone('Ada Lovelace'));
    expect(['primary', 'info', 'success', 'warning', 'neutral']).toContain(avatarTone('x'));
  });

  it('folds a group into +N, never +1', () => {
    expect(avatarOverflow(3, 4)).toEqual({ shown: 3, rest: 0 });
    expect(avatarOverflow(5, 4)).toEqual({ shown: 5, rest: 0 });
    expect(avatarOverflow(9, 4)).toEqual({ shown: 4, rest: 5 });
  });

  it('lists per-person options as inactive in a group', () => {
    expect(Object.keys(inactiveAvatarOptions({}))).toEqual(['max', 'label']);
    expect(Object.keys(inactiveAvatarOptions({ items: [] }))).toContain('src');
    expect(Object.keys(inactiveAvatarOptions({ src: '/a.png' }))).toContain('tone');
  });
});

describe('progress logic', () => {
  it('maps a value onto 0-100, clamped; no value is null', () => {
    expect(progressPercent(42)).toBe(42);
    expect(progressPercent(5, 0, 20)).toBe(25);
    expect(progressPercent(150)).toBe(100);
    expect(progressPercent(-1)).toBe(0);
    expect(progressPercent(undefined)).toBeNull();
    expect(progressPercent(3, 5, 5)).toBe(0);
    expect(progressValueText(42.4)).toBe('42%');
  });

  it('lists the value options as inactive while indeterminate', () => {
    expect(Object.keys(inactiveProgressOptions({}))).toEqual(['showValue', 'formatValue']);
    expect(inactiveProgressOptions({ value: 3 })).toEqual({});
  });
});
