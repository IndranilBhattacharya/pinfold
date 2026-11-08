import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';
import { useTabs } from './useTabs';
import { Breadcrumb } from '../breadcrumb/Breadcrumb';
import { Pagination } from '../pagination/Pagination';
import { usePagination } from '../pagination/usePagination';
import { Stepper } from '../stepper/Stepper';
import { Sidebar } from '../sidebar/Sidebar';
import { defineSidebar } from '../sidebar/define';
import { NavMenu } from '../navmenu/NavMenu';

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
      <Sidebar label="Main" items={['Home', { label: 'Projects', items: ['A', { label: 'B', href: '/b' }] }]} value="/b" onChange={(key, item) => [key satisfies string, item.label]} />
      {(() => {
        const AppNav = defineSidebar({ collapsible: true, variant: 'plain' });
        return <AppNav label="Main" items={['Home']} defaultCollapsed />;
      })()}
      {/* @ts-expect-error: label is required */}
      <Sidebar items={['Home']} />
      {/* @ts-expect-error: no such variant */}
      <Sidebar label="Main" items={['Home']} variant="pills" />
      {/* @ts-expect-error: an entry needs a label */}
      <Sidebar label="Main" items={[{ href: '/x' }]} />
      <NavMenu label="Main" items={[{ label: 'Products', columns: 2, items: ['A', { label: 'B', href: '/b', description: 'x' }] }, 'Docs']} open={null} openOn="click" onOpenChange={(key) => key satisfies string | null} />
      {/* @ts-expect-error: three columns at most */}
      <NavMenu label="Main" items={[{ label: 'P', columns: 4, items: ['A'] }]} />
      {/* @ts-expect-error: no such trigger */}
      <NavMenu label="Main" items={['Docs']} openOn="focus" />
    </>
  );
}

describe('navigation types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
