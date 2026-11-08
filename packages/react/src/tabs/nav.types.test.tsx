import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';
import { useTabs } from './useTabs';
import { Breadcrumb } from '../breadcrumb/Breadcrumb';
import { Pagination } from '../pagination/Pagination';
import { usePagination } from '../pagination/usePagination';
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
  // Strings are tabs too, and their ids are typed.
  useTabs({ label: 'View', items: ['Board', 'List'], defaultValue: 'List' });
  // @ts-expect-error: not one of the string tabs
  useTabs({ label: 'View', items: ['Board', 'List'], defaultValue: 'Grid' });
  const Pages = usePagination({ total: 120, pageSizes: [10, 25] });
  const rows: string[] = Pages.slice(['a', 'b']);
  return (
    <>
      <Own />
      <Pages />
      {rows.length}
      <Tabs label="S" items={items} value="profile" onChange={(id) => id satisfies 'profile' | 'billing'} onClose={(id) => id satisfies 'profile' | 'billing'} />
      {/* @ts-expect-error: not one of the tab ids */}
      <Tabs label="S" items={items} value="team" />
      {/* @ts-expect-error: no such placement */}
      <Tabs label="S" items={items} placement="left" />
      <Breadcrumb items={[{ label: 'Home', href: '/', menu: [{ label: 'Docs', href: '/docs' }] }, 'Here']} separator="arrow" onNavigate={(href) => href satisfies string} />
      <Breadcrumb path="/projects/pinfold" pathLabels={{ pinfold: 'Pinfold' }} />
      {/* @ts-expect-error: no such separator */}
      <Breadcrumb items={[{ label: 'Home' }]} separator="pipe" />
      <Pagination count={10} />
      <Pagination total={532} pageSizes={[10, 25]} onChange={(page, { pageSize, offset }) => [page, pageSize, offset]} />
      <Pagination hasNext />
      {/* @ts-expect-error: no such variant */}
      <Pagination count={3} variant="solid" />
      <Stepper items={['Cart', { label: 'Pay', content: 'x', optional: true }]} variant="dot" onNext={async () => true} />
      {/* @ts-expect-error: no such variant */}
      <Stepper items={[{ label: 'Cart' }]} variant="line" />
      {/* @ts-expect-error: onNext returns a boolean or nothing */}
      <Stepper items={['Cart']} onNext={() => 'yes'} />
    </>
  );
}

describe('navigation types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
