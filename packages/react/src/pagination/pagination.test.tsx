import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination layouts and events', () => {
  it('siblings and boundaries shape the page list', () => {
    const { container } = render(<Pagination count={40} defaultPage={18} siblings={2} boundaries={2} />);
    const pages = [...container.querySelectorAll('.pinfold-pagination__item')].map((b) => b.textContent);
    expect(pages).toEqual(['1', '2', '16', '17', '18', '19', '20', '39', '40']);
  });

  it('showPages false: a simple pager with previous and next only, words beside the chevrons', () => {
    const onChange = vi.fn();
    const { container } = render(<Pagination count={10} showPages={false} showControlLabels showInfo onChange={onChange} labels={{ nextText: 'Onward' }} />);
    expect(container.querySelectorAll('.pinfold-pagination__item')).toHaveLength(0);
    expect(container.querySelector('.pinfold-pagination__status')).toBeNull();
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(next.textContent).toBe('Onward');
    expect(screen.getByRole('button', { name: 'Previous page' }).textContent).toBe('Previous');
    expect(container.firstElementChild!.hasAttribute('data-control-labels')).toBe(true);
    fireEvent.click(next);
    expect(onChange).toHaveBeenLastCalledWith(2, expect.objectContaining({ reason: 'page' }));
    expect(container.querySelector('.pinfold-pagination__info')!.textContent).toBe('Page 2 of 10');
  });

  it('cursor mode: hasPrevious and hasNext decide what is available', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Pagination hasNext hasPrevious={false} page={3} onChange={onChange} />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(previous);
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Pagination hasNext={false} hasPrevious page={3} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onChange).toHaveBeenLastCalledWith(2, expect.anything());
    expect(screen.getByRole('button', { name: 'Next page' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('onPageSizeChange reports the new size; onChange still does', () => {
    const onPageSizeChange = vi.fn();
    const onChange = vi.fn();
    render(<Pagination total={240} pageSizes={[25, 50]} onPageSizeChange={onPageSizeChange} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Rows per page' }), { target: { value: '50' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50, expect.anything());
    expect(onChange).toHaveBeenLastCalledWith(1, expect.objectContaining({ pageSize: 50, reason: 'pageSize' }));
  });

  it('renderItem draws inside each page button, which keeps its name and current state; render.item gets the page', () => {
    const { container } = render(
      <Pagination count={5} defaultPage={2} renderItem={({ page, current }) => <b>{current ? `[${page}]` : page}</b>} />,
    );
    const current = screen.getByRole('button', { name: 'Page 2' });
    expect(current.textContent).toBe('[2]');
    expect(current.getAttribute('aria-current')).toBe('page');
    render(<Pagination count={3} render={{ item: ({ props, item }) => <button {...props}>{`p${item?.page}${item?.current ? '!' : ''}`}</button> }} />);
    expect(screen.getByRole('button', { name: 'Page 1', current: 'page' }).textContent).toBe('p1!');
    expect(container).toBeTruthy();
  });

  it('the table\'s usage keeps working: count, page, size, ghost, tone, loading, label, onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<Pagination count={8} page={2} size="sm" variant="ghost" tone="neutral" label="Table pages" onChange={onChange} />);
    const root = screen.getByRole('navigation', { name: 'Table pages' });
    expect(root.getAttribute('data-variant')).toBe('ghost');
    expect(root.getAttribute('data-size')).toBe('sm');
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onChange).toHaveBeenCalledWith(3, expect.anything());
    expect(container.querySelector('[data-control-labels]')).toBeNull();
  });
});
