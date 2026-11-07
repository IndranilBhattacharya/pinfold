/**
 * Compile-time contract of Toggle, Toolbar, Slider, NumberField and Otp. `npm run typecheck` fails
 * if an `@ts-expect-error` line stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineToggle } from './define';
import { useToggle } from './useToggle';
import { defineToolbar } from '../toolbar/define';
import { useToolbar } from '../toolbar/useToolbar';
import { defineSlider } from '../slider/define';
import { useSlider } from '../slider/useSlider';
import { defineNumberField } from '../number/define';
import { useNumberField } from '../number/useNumberField';
import { defineOtp } from '../otp/define';
import { useOtp } from '../otp/useOtp';

const View = defineToggle({ fullWidth: true });
const Pager = defineToolbar({ attached: true });
const Price = defineSlider({ min: 0, max: 500, formatValue: (v) => `$${v}` });
const Quantity = defineNumberField({ min: 1, steppers: 'end' });
const Code = defineOtp({ groups: [3, 3] });
const rows = [{ value: 'a', label: 'A' }];

function Valid() {
  const Pin = useToggle({ label: 'Pin', onChange: (pressed) => void pressed });
  // A handler typed for its mode is accepted.
  const Style = useToggle({ label: 'Style', selection: 'multiple', items: rows, onChange: (values: string[]) => void values.length });
  const Edit = useToolbar({ label: 'Edit', items: [{ label: 'Cut', onClick: () => {} }], variant: 'ghost' });
  const Volume = useSlider({ label: 'Volume', defaultValue: [40], onChangeEnd: (values: number[]) => void values });
  const N = useNumberField({ label: 'N', onChange: (value: number | null) => void value });
  const C = useOtp({ label: 'C', length: 4, onComplete: (code: string) => void code });
  return (
    <>
      <Pin />
      <Style />
      <Edit />
      <Volume />
      <N />
      <C />
      <View label="View" items={rows} className="x" />
      <Pager label="Pages" items={[{ label: 'Next' }]} />
      <Price label="Price" defaultValue={[50, 300]} />
      <Quantity label="Qty" defaultValue={1} />
      <Code label="Code" />
    </>
  );
}

function Invalid() {
  // @ts-expect-error a toggle needs a label
  useToggle({ items: rows });
  // @ts-expect-error unknown variant
  useToggle({ label: 'x', variant: 'pill' });
  // @ts-expect-error a toolbar needs items
  useToolbar({ label: 'x' });
  // @ts-expect-error toolbar items are button configs, with a label
  useToolbar({ label: 'x', items: [{ onClick: () => {} }] });
  // @ts-expect-error slider values are an array
  useSlider({ label: 'x', defaultValue: 40 });
  // @ts-expect-error a slider has no required
  useSlider({ label: 'x', required: true });
  // @ts-expect-error a number field value is a number
  useNumberField({ label: 'x', defaultValue: '1' });
  // @ts-expect-error unknown stepper layout
  useNumberField({ label: 'x', steppers: 'side' });
  // @ts-expect-error otp type is numeric or alphanumeric
  useOtp({ label: 'x', type: 'hex' });
  return null;
}

defineConfig({ defaults: { toggle: { variant: 'outline' }, toolbar: { attached: false }, slider: { showValue: 'tooltip' }, number: { steppers: 'none' }, otp: { variant: 'underline' } } });
// @ts-expect-error a default cannot carry per-use data
defineConfig({ defaults: { toggle: { items: rows } } });

describe('controls types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold').length).toBeGreaterThan(5);
    expect(Invalid).toBeTypeOf('function');
  });
});
