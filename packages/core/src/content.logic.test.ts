// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inactiveRatingOptions, inactiveTimelineOptions, ratingFill, ratingFromPointer } from './content.logic';

describe('content logic', () => {
  it('rating from a pointer: whole or half steps, mirrored, never below one step', () => {
    expect(ratingFromPointer(0, 100, 5)).toBe(1);
    expect(ratingFromPointer(41, 100, 5)).toBe(3);
    expect(ratingFromPointer(41, 100, 5, true)).toBe(2.5);
    expect(ratingFromPointer(100, 100, 5)).toBe(5);
    expect(ratingFromPointer(10, 100, 5, false, true)).toBe(5);
    expect(ratingFromPointer(10, 0, 5)).toBe(0);
  });

  it('fills symbols whole and half', () => {
    expect(ratingFill(3.5, 5)).toEqual([1, 1, 1, 0.5, 0]);
    expect(ratingFill(0, 3)).toEqual([0, 0, 0]);
    expect(ratingFill(5, 5)).toEqual([1, 1, 1, 1, 1]);
  });

  it('inactive options', () => {
    expect(Object.keys(inactiveRatingOptions({ readOnly: true }))).toEqual(['clearable', 'onChange']);
    expect(inactiveRatingOptions({})).toEqual({});
    expect(Object.keys(inactiveTimelineOptions({ orientation: 'horizontal' }))).toEqual(['align']);
  });
});
