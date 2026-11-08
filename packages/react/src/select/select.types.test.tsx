import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Select } from './Select';
import { useSelect } from './useSelect';
import { Combobox } from '../combobox/Combobox';

const sizes = [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }] as const;

// Compile-time checks: these lines are type-checked by `npm run typecheck`, and each
// `@ts-expect-error` fails the build if the mistake stops being caught.
export function Checks(): React.ReactElement {
  const Own = useSelect({ label: 'Size', items: sizes, defaultValue: 'm' });
  // @ts-expect-error: not one of the values
  useSelect({ label: 'Size', items: sizes, defaultValue: 'xl' });
  // @ts-expect-error: a field needs a label
  useSelect({ items: sizes });
  useSelect({ label: 'Size', items: ['S', 'M'], multiple: true, defaultValue: ['S'] });
  // @ts-expect-error: one value without `multiple`
  useSelect({ label: 'Size', items: ['S', 'M'], defaultValue: ['S'] });
  // @ts-expect-error: an array with `multiple`
  useSelect({ label: 'Size', items: ['S', 'M'], multiple: true, defaultValue: 'S' });
  return (
    <>
      <Own />
      <Select label="Size" items={sizes} onChange={(v) => v satisfies 's' | 'm' | null} />
      <Select label="Size" multiple items={sizes} onChange={(v) => v satisfies Array<'s' | 'm'>} />
      {/* @ts-expect-error: no such variant */}
      <Select label="Size" items={sizes} variant="ghost" />
      <Combobox label="City" items={['Oslo', 'Osaka']} filter="startsWith" onInputChange={(t) => t satisfies string} />
      <Combobox label="Tags" multiple allowCustom items={['a']} onChange={(v) => v satisfies string[]} />
      {/* @ts-expect-error: no such filter */}
      <Combobox label="City" items={['Oslo']} filter="fuzzy" />
    </>
  );
}

describe('select types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
