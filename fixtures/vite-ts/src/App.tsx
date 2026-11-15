// Uses the files `npx pinfold add table button` writes into src/components/ui.
import { defineButton } from './components/ui/button';
import { Table } from './components/ui/table';

type Order = { id: string; customer: string; total: number };
const orders: Order[] = [
  { id: 'A-1', customer: 'Harbor Freight', total: 120 },
  { id: 'A-2', customer: 'North Dock', total: 80 },
];

const Save = defineButton({ label: 'Save orders' });

export default function App() {
  return (
    <main>
      <Table label="Orders" rows={orders} rowKey="id" pageSize={10} />
      <Save />
    </main>
  );
}
