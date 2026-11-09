import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from './select/Select';
import { Combobox } from './combobox/Combobox';
import { Tabs } from './tabs/Tabs';
import { Tags } from './tags/Tags';
import { Calendar } from './calendar/Calendar';

// Every part that repeats hands its own item to a `render` override, so your component can draw it.
describe('render overrides get the repeating item', () => {
  it('select options: the row and its live state; the default element keeps no stray prop', () => {
    render(
      <Select
        label="Plan"
        items={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro', description: '$12' }]}
        defaultValue="pro"
        defaultOpen
        render={{ option: ({ props, item, children }) => <div {...props} data-mine={`${item?.value}:${item?.selected}:${item?.index}`}>{children}</div> }}
      />,
    );
    const rows = screen.getAllByRole('option');
    expect(rows.map((r) => r.getAttribute('data-mine'))).toEqual(['free:false:0', 'pro:true:1']);
  });

  it('combobox chips can be drawn by you and still remove their value', () => {
    render(
      <Combobox
        label="Tags"
        multiple
        items={['red', 'green']}
        defaultValue={['red', 'green']}
        render={{ chip: ({ item }) => (item?.remove ? <button type="button" onClick={item.remove}>{`drop ${item.value}`}</button> : null) }}
      />,
    );
    fireEvent.click(screen.getByText('drop red'));
    expect(screen.queryByText('drop red')).toBeNull();
    expect(screen.getByText('drop green')).toBeTruthy();
  });

  it('tabs, tags and calendar days', () => {
    render(<Tabs label="Views" items={['Board', 'List']} render={{ tab: ({ props, item }) => <button {...props}>{`${item?.index}-${item?.selected}`}</button> }} />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['0-true', '1-false']);
    render(<Tags label="Filters" items={['a', 'b']} onRemove={() => {}} render={{ tag: ({ props, item }) => <li {...props}>{`${item?.text}${item?.remove ? '×' : ''}`}</li> }} />);
    expect(screen.getByText('a×')).toBeTruthy();
    render(<Calendar defaultValue="2026-11-09" render={{ day: ({ props, item }) => <button {...props}>{item?.selected ? '★' : item?.date.slice(8)}</button> }} />);
    expect(screen.getByText('★')).toBeTruthy();
  });
});

// Compile-time: `item` is typed per component (checked by `npm run typecheck`).
export function ItemTypes(): React.ReactElement {
  return (
    <>
      <Select label="Plan" items={['a']} render={{ option: ({ item }) => (item?.selected ? item.label : null) }} />
      <Select
        label="Plan"
        items={['a']}
        render={{
          option: ({ item }) =>
            // @ts-expect-error: an option has no `nope`
            item?.nope,
        }}
      />
      <Calendar
        render={{
          day: ({ item }) =>
            // @ts-expect-error: a day's date is a string
            item?.date.toFixed(),
        }}
      />
    </>
  );
}
