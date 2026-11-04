/**
 * Compile-time contract of Input, Checkbox, Radio and Switch. `npm run typecheck` fails if an
 * `@ts-expect-error` line stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineInput } from './define';
import { useInput } from './useInput';
import { defineCheckbox } from '../checkbox/define';
import { useCheckbox } from '../checkbox/useCheckbox';
import { defineRadio } from '../radio/define';
import { useRadio } from '../radio/useRadio';
import { defineSwitch } from '../switch/define';
import { useSwitch } from '../switch/useSwitch';

const Email = defineInput({ type: 'email', required: true });
const Terms = defineCheckbox({ required: true });
const Plan = defineRadio({ variant: 'card' });
const Setting = defineSwitch({ labelPosition: 'start' });
const rows = [{ value: 'a', label: 'A' }] as const;

function Valid() {
  const Name = useInput({ label: 'Name', onChange: (value: string) => void value, dimensions: { width: 200 } });
  const Notes = useInput({ label: 'Notes', multiline: true, autosize: true, rows: 2 });
  const Topics = useCheckbox({ label: 'Topics', items: rows, defaultValue: ['a'], onChange: (values: string[]) => void values });
  const One = useRadio({ label: 'One', items: rows, value: 'a', onChange: (value) => void value.length });
  const On = useSwitch({ label: 'On', tone: 'success', onChange: (checked) => void !checked });
  return (
    <>
      <Name />
      <Notes />
      <Topics />
      <One />
      <On />
      <Email label="Email" className="x" />
      <Terms label="Terms" indeterminate />
      <Plan label="Plan" items={rows} />
      <Setting label="Alerts" description="Daily" />
    </>
  );
}

defineConfig({ defaults: { input: { variant: 'filled' }, checkbox: { size: 'sm' }, radio: { variant: 'card' }, switch: { tone: 'success' } } });

function Invalid() {
  // @ts-expect-error a field needs a label
  useInput({});
  // @ts-expect-error not an input type: a number field is its own component
  useInput({ label: 'x', type: 'date' });
  // @ts-expect-error the value is a string
  useInput({ label: 'x', value: 3 });
  // @ts-expect-error radios need items
  useRadio({ label: 'x' });
  // @ts-expect-error a row needs a value
  useRadio({ label: 'x', items: [{ label: 'A' }] });
  // @ts-expect-error a group value is a list
  useCheckbox({ label: 'x', items: rows, value: 'a' });
  // @ts-expect-error a switch has no indeterminate state
  useSwitch({ label: 'x', indeterminate: true });
  return null;
}

describe('Form control types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('.pinfold-field').length).toBe(9);
    expect(typeof Invalid).toBe('function');
  });
});
