// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { edgeEnabled, foldText, inactiveComboboxOptions, inactiveSelectOptions, matchRanges, matchesQuery, nextEnabled, toggleValue } from './listbox.logic';

describe('listbox logic', () => {
  it('matches without case or accents; startsWith also matches a word start', () => {
    expect(foldText('Zürich Café')).toBe('zurich cafe');
    expect(matchesQuery('Zürich', 'zur')).toBe(true);
    expect(matchesQuery('New Zealand', 'zea', 'startsWith')).toBe(true);
    expect(matchesQuery('New Zealand', 'eal', 'startsWith')).toBe(false);
    expect(matchesQuery('Anything', 'xyz', 'none')).toBe(true);
    expect(matchesQuery('Anything', '  ')).toBe(true);
  });

  it('marks every match in the original text', () => {
    expect(matchRanges('Banana', 'an')).toEqual([[1, 3], [3, 5]]);
    expect(matchRanges('Café', 'fe')).toEqual([[2, 4]]);
    expect(matchRanges('Banana', '')).toEqual([]);
  });

  it('moves past disabled rows, wraps or stops', () => {
    const off = [false, true, false, true];
    expect(nextEnabled(off, 0, 1)).toBe(2);
    expect(nextEnabled(off, 2, 1)).toBe(0);
    expect(nextEnabled(off, 2, 1, false)).toBe(2);
    expect(nextEnabled(off, -1, 1)).toBe(0);
    expect(nextEnabled(off, 0, -1)).toBe(2);
    expect(nextEnabled([true, true], 0, 1)).toBe(0);
    expect(edgeEnabled(off)).toBe(0);
    expect(edgeEnabled(off, true)).toBe(2);
    expect(edgeEnabled([true])).toBe(-1);
  });

  it('toggles values; a single selection replaces', () => {
    expect(toggleValue(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a', true)).toEqual(['b']);
    expect(toggleValue(['a'], 'b', false)).toEqual(['b']);
    expect(toggleValue(['a'], 'a', false)).toEqual(['a']);
  });

  it('inactive options', () => {
    expect(Object.keys(inactiveSelectOptions({}))).toEqual(['display', 'maxChips']);
    expect(inactiveSelectOptions({ multiple: true })).toEqual({});
    expect(Object.keys(inactiveComboboxOptions({}))).toEqual(['maxChips']);
  });
});
