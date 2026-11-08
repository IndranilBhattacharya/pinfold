import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';
import { useTabs } from './useTabs';
import { Breadcrumb } from '../breadcrumb/Breadcrumb';
import { Pagination } from '../pagination/Pagination';
import { Stepper } from '../stepper/Stepper';

const items = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing' },
] as const;

// Compile-time checks: these lines are type-checked by `npm run typecheck`, and each
// `@ts-expect-error` fails the build if the mistake stops being caught.
export function Checks(): React.ReactElement {
  const Own = useTabs({ label: 'S', items, defaultValue: 'billing' });
  // @ts-expect-error: not one of the tab ids
  useTabs({ label: 'S', items, defaultValue: 'biling' });
  // @ts-expect-error: the tab list needs a name
  useTabs({ items });
  return (
    <>
      <Own />
      <Tabs label="S" items={items} value="profile" onChange={(id) => id satisfies 'profile' | 'billing'} />
      {/* @ts-expect-error: not one of the tab ids */}
      <Tabs label="S" items={items} value="team" />
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Here' }]} separator="slash" />
      {/* @ts-expect-error: no such separator */}
      <Breadcrumb items={[{ label: 'Home' }]} separator="arrow" />
      <Pagination count={10} />
      {/* @ts-expect-error: count is required */}
      <Pagination page={2} />
      <Stepper items={[{ label: 'Cart' }]} variant="dot" />
      {/* @ts-expect-error: no such variant */}
      <Stepper items={[{ label: 'Cart' }]} variant="line" />
    </>
  );
}

describe('navigation types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
