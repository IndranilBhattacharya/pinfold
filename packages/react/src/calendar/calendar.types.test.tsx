import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Calendar } from './Calendar';
import { useCalendar } from './useCalendar';

// Compile-time checks: these lines are type-checked by `npm run typecheck`, and each
// `@ts-expect-error` fails the build if the mistake stops being caught.
export function Checks(): React.ReactElement {
  const Own = useCalendar({ defaultValue: '2026-11-08', onChange: (d) => d satisfies string });
  useCalendar({ mode: 'range', onChange: (r) => r.start satisfies string });
  // @ts-expect-error: a range is { start, end }
  useCalendar({ mode: 'range', defaultValue: '2026-11-08' });
  // @ts-expect-error: several days are an array
  useCalendar({ mode: 'multiple', defaultValue: '2026-11-08' });
  return (
    <>
      <Own />
      <Calendar mode="multiple" months={2} onChange={(days) => days satisfies string[]} />
      {/* @ts-expect-error: one, two or three months */}
      <Calendar months={4} />
    </>
  );
}

describe('calendar types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
