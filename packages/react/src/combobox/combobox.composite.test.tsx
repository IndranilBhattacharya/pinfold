import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Combobox } from './Combobox';
import { useCombobox } from './useCombobox';
import { Tags } from '../tags/Tags';
import type { ComboboxApi } from './types';

const people = Array.from({ length: 23 }, (_, i) => ({ value: `p${i + 1}`, label: `Person ${i + 1}`, description: `p${i + 1}@acme.dev` }));

/** Scroll a list element to its end in jsdom, which has no layout. */
function scrollToEnd(el: HTMLElement) {
  Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: 300, configurable: true });
  el.scrollTop = 690;
  fireEvent.scroll(el);
}

describe('Combobox: paged results', () => {
  it('loadItems pages: the next page loads near the end of the scroll, with its cursor, under a loading row', async () => {
    vi.useFakeTimers();
    const calls: Array<{ q: string; cursor: unknown; page: number }> = [];
    let release: (() => void) | null = null;
    const loadItems = vi.fn((q: string, { cursor, page, signal }: { cursor?: unknown; page: number; signal: AbortSignal }) => {
      calls.push({ q, cursor, page });
      const start = (cursor as number | undefined) ?? 0;
      const out = { items: people.slice(start, start + 10), hasMore: start + 10 < people.length, cursor: start + 10 };
      if (page === 0) return out;
      return new Promise<typeof out>((resolve, reject) => {
        release = () => resolve(out);
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });
    render(<Combobox label="People" defaultOpen loadItems={loadItems} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    const list = screen.getByRole('listbox');
    expect(within(list).getAllByRole('option')).toHaveLength(10);
    act(() => scrollToEnd(list));
    expect(calls[1]).toEqual({ q: '', cursor: 10, page: 1 });
    expect(screen.getByText('Loading more…')).toBeTruthy();
    // A second scroll while the page is on its way asks for nothing more.
    act(() => scrollToEnd(list));
    expect(calls).toHaveLength(2);
    await act(async () => {
      release!();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(within(list).getAllByRole('option')).toHaveLength(20);
    expect(screen.queryByText('Loading more…')).toBeNull();
    act(() => scrollToEnd(list));
    await act(async () => {
      release!();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(within(list).getAllByRole('option')).toHaveLength(23);
    // The last page said there is no more.
    act(() => scrollToEnd(list));
    expect(calls).toHaveLength(3);
    vi.useRealTimers();
  });

  it('a page on its way is aborted when the query moves on', async () => {
    vi.useFakeTimers();
    const aborted: number[] = [];
    const loadItems = (q: string, { page, signal }: { page: number; signal: AbortSignal }) => {
      signal.addEventListener('abort', () => aborted.push(page));
      if (page === 0) return { items: people.slice(0, 10).filter((p) => p.label.includes(q)), hasMore: true };
      return new Promise<never>(() => undefined);
    };
    render(<Combobox label="People" defaultOpen loadItems={loadItems} debounce={100} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    act(() => scrollToEnd(screen.getByRole('listbox')));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Person 1' } });
    expect(aborted).toContain(1);
    vi.useRealTimers();
  });

  it('your own items: onLoadMore once per row count while hasMore, a loading row while loading', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Combobox label="People" defaultOpen items={people.slice(0, 10)} hasMore onLoadMore={onLoadMore} />);
    const list = screen.getByRole('listbox');
    act(() => scrollToEnd(list));
    act(() => scrollToEnd(list));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Combobox label="People" defaultOpen items={people.slice(0, 10)} hasMore loading onLoadMore={onLoadMore} />);
    expect(screen.getByText('Loading more…')).toBeTruthy();
    rerender(<Combobox label="People" defaultOpen items={people.slice(0, 20)} hasMore onLoadMore={onLoadMore} />);
    act(() => scrollToEnd(screen.getByRole('listbox')));
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    rerender(<Combobox label="People" defaultOpen items={people} hasMore={false} onLoadMore={onLoadMore} />);
    act(() => scrollToEnd(screen.getByRole('listbox')));
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});

describe('Combobox: a custom list body', () => {
  const table = ({ items, getRowProps, select }: Parameters<NonNullable<React.ComponentProps<typeof Combobox>['renderList']>>[0]) => (
    <table>
      <tbody>
        {items.map((it) => (
          <tr key={it.value} {...getRowProps(it.value)}>
            <td>{it.label}</td>
            <td>{String((it.data as { description: string }).description)}</td>
          </tr>
        ))}
        <tr>
          <td>
            <button type="button" onClick={(e) => select('p9', e)}>
              Pick nine
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );

  it('owns the popup body: a click on a row chooses it, select() chooses any value, roles follow popupRole', () => {
    const onChange = vi.fn();
    render(<Combobox label="People" multiple defaultOpen items={people.slice(0, 5)} renderList={table} popupRole="grid" onChange={onChange} />);
    const input = screen.getByRole('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('grid');
    const grid = screen.getByRole('grid', { name: 'People' });
    expect(grid.getAttribute('aria-multiselectable')).toBe('true');
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(screen.getByRole('row', { name: /Person 2/ }));
    expect(onChange).toHaveBeenLastCalledWith(['p2'], expect.anything());
    expect(screen.getByRole('row', { name: /Person 2/ }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Pick nine' }));
    expect(onChange).toHaveBeenLastCalledWith(['p2', 'p9'], expect.anything());
  });

  it('the arrow keys move the active row (aria-activedescendant) and Enter chooses it; typing filters the rows it gets', () => {
    const onChange = vi.fn();
    render(<Combobox label="People" items={people.slice(0, 5)} renderList={table} popupRole="grid" onChange={onChange} />);
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const active = document.getElementById(input.getAttribute('aria-activedescendant')!)!;
    expect(active.textContent).toContain('Person 2');
    expect(active.hasAttribute('data-active')).toBe(true);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('p2', expect.anything());
    fireEvent.change(input, { target: { value: 'Person 4' } });
    expect(screen.getAllByRole('row')).toHaveLength(2); // the match and the button row
  });

  it('a dialog popup (the default) has no active descendant', () => {
    render(<Combobox label="People" defaultOpen items={people.slice(0, 3)} renderList={() => <p>Anything</p>} />);
    expect(screen.getByRole('dialog', { name: 'People' }).textContent).toContain('Anything');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(screen.getByRole('combobox').getAttribute('aria-activedescendant')).toBeNull();
  });
});

describe('Combobox: chips and events', () => {
  const few = people.slice(0, 6);

  it('chips above the field: a group before the control, every chip, real remove buttons; onRemove gets the item', () => {
    const onRemove = vi.fn();
    const { container } = render(<Combobox label="People" multiple items={few} defaultValue={['p1', 'p2', 'p3', 'p4']} chipsPlacement="above" onRemove={onRemove} />);
    const group = screen.getByRole('group', { name: 'People: 4' });
    expect(group.compareDocumentPosition(container.querySelector('.pinfold-select__control')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Person 3' }));
    expect(onRemove).toHaveBeenCalledWith('p3', expect.objectContaining({ value: 'p3', label: 'Person 3', index: 2, selected: false }));
  });

  it('chipsPlacement none: no chips, Backspace keeps the values; a Tag group bound to the value draws them', () => {
    function Composite() {
      const [ids, setIds] = React.useState<string[]>(['p1', 'p2']);
      return (
        <>
          <Tags label="Chosen" items={ids.map((v) => ({ value: v, label: few.find((p) => p.value === v)!.label }))} onRemove={(v) => setIds((x) => x.filter((y) => y !== v))} />
          <Combobox label="People" multiple items={few} value={ids} onChange={setIds} chipsPlacement="none" />
        </>
      );
    }
    const { container } = render(<Composite />);
    expect(container.querySelector('.pinfold-select__chip')).toBeNull();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Backspace' });
    expect(screen.getByRole('button', { name: 'Remove Person 2' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Person 2' }));
    expect(screen.queryByText('Person 2')).toBeNull();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Person 5' } });
    fireEvent.click(screen.getByRole('option', { name: /Person 5/ }));
    expect(screen.getByRole('button', { name: 'Remove Person 5' })).toBeTruthy();
  });

  it('"+N" shows the rest, and "Show less" folds them again', () => {
    render(<Combobox label="People" multiple items={few} defaultValue={['p1', 'p2', 'p3', 'p4', 'p5']} maxChips={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more' }));
    expect(screen.getByText('Person 5')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText('Person 5')).toBeNull();
  });

  it('render.chip gets the item, with its tone, avatar and remove; rows draw avatar and end content', () => {
    const items = [{ value: 'a', label: 'Ada', tone: 'success' as const, avatar: '/ada.png', endContent: 'Owner' }, 'Bob'];
    const { container } = render(
      <Combobox label="People" multiple items={items} defaultValue={['a']} defaultOpen render={{ chip: ({ props, item }) => <span {...props}>{`${item?.label}:${item?.tone}`}<button type="button" onClick={item?.remove}>x</button></span> }} />,
    );
    expect(screen.getByText('Ada:success')).toBeTruthy();
    const row = screen.getByRole('option', { name: /Ada/ });
    expect(row.querySelector('.pinfold-select__avatar img')?.getAttribute('src')).toBe('/ada.png');
    expect(row.querySelector('.pinfold-select__endContent')?.textContent).toBe('Owner');
    fireEvent.click(screen.getByRole('button', { name: 'x' }));
    expect(container.querySelector('.pinfold-select__chip')).toBeNull();
  });

  it('onCreate: false refuses, a row from your server is added with its label, a promise waits', async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn((text: string) => (text === 'no' ? false : text === 'later' ? Promise.resolve({ value: 'id-9', label: 'Later (new)' }) : { value: `id-${text}`, label: `${text} (new)` }));
    render(<Combobox label="Tags" multiple allowCustom items={['a']} onCreate={onCreate} onChange={onChange} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'no' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'zed' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(['id-zed'], expect.anything());
    expect(screen.getByText('zed (new)')).toBeTruthy();
    fireEvent.change(input, { target: { value: 'later' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Later (new)')).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith(['id-zed', 'id-9'], expect.anything());
  });

  it('onSearch waits for typing to pause; onClear follows the clear button', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    render(<Combobox label="City" items={['Oslo']} onSearch={onSearch} onClear={onClear} clearable debounce={200} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'o' } });
    fireEvent.change(input, { target: { value: 'os' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('os');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('Combobox: validation', () => {
  it('validate shows on blur after an edit, with the status; the controller validates, sets and clears errors', async () => {
    const onValidate = vi.fn();
    let api: ComboboxApi | null = null;
    function Field() {
      const City = useCombobox({ label: 'City', items: ['Oslo', 'Rome'], validate: (v) => (v === 'Rome' ? 'Not Rome' : null), onValidate });
      api = City;
      return <City />;
    }
    const { container } = render(<Field />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ro' } });
    fireEvent.click(screen.getByRole('option', { name: 'Rome' }));
    expect(screen.queryByText('Not Rome')).toBeNull();
    fireEvent.blur(input);
    expect(screen.getByText('Not Rome')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('error');
    expect(onValidate).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false, value: 'Rome' }));
    act(() => api!.clearError());
    expect(screen.queryByText('Not Rome')).toBeNull();
    act(() => api!.setError('Taken'));
    expect(screen.getByText('Taken')).toBeTruthy();
    await act(async () => {
      expect(await api!.validate()).toBe(false);
    });
  });

  it('multiple + required: an empty choice is an error', async () => {
    let api: ComboboxApi | null = null;
    function Field() {
      const Tags_ = useCombobox({ label: 'Tags', multiple: true, required: true, items: ['a', 'b'] });
      api = Tags_;
      return <Tags_ />;
    }
    render(<Field />);
    await act(async () => {
      expect(await api!.validate()).toBe(false);
    });
    expect(screen.getByText('Choose at least one.')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
    fireEvent.click(screen.getByRole('option', { name: 'a' }));
    expect(screen.queryByText('Choose at least one.')).toBeNull();
  });
});
