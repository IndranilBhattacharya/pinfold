// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inactiveNumberOptions, inactiveOtpOptions, inactiveSliderOptions, inactiveToggleOptions, otpBreaks, otpSanitize, sliderPercent, sliderValues, stepValue } from './controls.logic';

describe('controls logic', () => {
  it('slider: percent, snapping, order and the gap', () => {
    expect(sliderPercent(25, 0, 100)).toBe(25);
    expect(sliderPercent(150, 0, 100)).toBe(100);
    expect(sliderPercent(5, 5, 5)).toBe(0);
    expect(sliderValues([33], 0, 100, 10)).toEqual([30]);
    expect(sliderValues([0.30000000000000004], 0, 1, 0.1)).toEqual([0.3]);
    expect(sliderValues([80, 20], 0, 100, 1)).toEqual([20, 80]);
    expect(sliderValues([50, 52], 0, 100, 1, 10)).toEqual([50, 60]);
    expect(sliderValues([-5, 500], 0, 100, 1)).toEqual([0, 100]);
  });

  it('number: steps, limits and an empty start', () => {
    expect(stepValue(1, 1, 1)).toBe(2);
    expect(stepValue(0.1, 1, 0.2)).toBe(0.3);
    expect(stepValue(99, 1, 1, 0, 99)).toBe(99);
    expect(stepValue(null, 1, 1, 5)).toBe(5);
    expect(stepValue(null, -1, 1, 0, 10)).toBe(10);
    expect(stepValue(null, 1, 1)).toBe(0);
  });

  it('otp: keeps allowed characters up to the length, and finds group breaks', () => {
    expect(otpSanitize('12-3 4a56789', 'numeric', 6)).toBe('123456');
    expect(otpSanitize('ab-c1!', 'alphanumeric', 4)).toBe('ABC1');
    expect([...otpBreaks(6, [3, 3])]).toEqual([3]);
    expect([...otpBreaks(6, [2, 2, 2])]).toEqual([2, 4]);
    expect([...otpBreaks(6)]).toEqual([]);
  });

  it('inactive options', () => {
    expect(Object.keys(inactiveToggleOptions({}))).toEqual(['selection', 'value', 'defaultValue', 'allowEmpty', 'orientation', 'fullWidth', 'hideLabel']);
    expect(Object.keys(inactiveToggleOptions({ items: [] }))).toEqual(['pressed', 'defaultPressed', 'icon', 'iconOnly']);
    expect(Object.keys(inactiveToggleOptions({ items: [], selection: 'multiple' }))).toContain('allowEmpty');
    expect(Object.keys(inactiveSliderOptions({ defaultValue: [5] }))).toEqual(['minGap']);
    expect(inactiveSliderOptions({ defaultValue: [5, 9] })).toEqual({});
    expect(Object.keys(inactiveSliderOptions({ value: [1, 2], showValue: 'never' }))).toEqual(['formatValue']);
    expect(Object.keys(inactiveNumberOptions({ steppers: 'none' }))).toEqual(['incrementLabel', 'decrementLabel']);
    expect(Object.keys(inactiveOtpOptions({}))).toEqual(['separator']);
    expect(inactiveOtpOptions({ groups: [3, 3] })).toEqual({});
  });
});
