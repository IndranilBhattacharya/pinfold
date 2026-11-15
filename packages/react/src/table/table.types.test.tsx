import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Table } from './Table';
import { useTable } from './useTable';

interface Invoice {
  id: string;
  amount: number;
  customer: string;
}
const rows: Invoice[] = [{ id: 'a', amount: 1, customer: 'Acme' }];

// Compile-time checks: these lines are type-checked by `npm run typecheck`, and each
// `@ts-expect-error` fails the build if the mistake stops being caught.
export function Checks(): React.ReactElement {
  const Own = useTable({ label: 'Invoices', rows, columns: ['id', { key: 'amount', cell: ({ row }) => row.amount.toFixed(2), align: 'end' }] });
  // @ts-expect-error: not a key of the rows
  useTable({ label: 'Invoices', rows, columns: ['total'] });
  // @ts-expect-error: a table needs a label
  useTable({ rows });
  // A toolbar of your own gets typed tools.
  useTable({ label: 'Invoices', rows, toolbar: { render: (t) => <button {...t.columnsButtonProps}>{t.search.length + t.selectedCount}</button> } });
  // @ts-expect-error: the tools have no `query` (it is `search`)
  useTable({ label: 'Invoices', rows, toolbar: { render: (t) => t.query } });
  return (
    <>
      <Own />
      <Table label="Invoices" rows={rows} rowKey="id" onRowAction={(r) => r.customer satisfies string} />
      {/* @ts-expect-error: no such density */}
      <Table label="Invoices" rows={rows} density="tight" />
    </>
  );
}

describe('table types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
