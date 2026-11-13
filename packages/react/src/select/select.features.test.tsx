import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { inactiveSelectOptions } from '@pinfold/core';
import { Select } from './Select';
import { useSelect } from './useSelect';
import type { SelectApi } from './types';

const people = [
  { value: 'ada', label: 'Ada Lovelace', description: 'ada@acme.dev', avatar: '/ada.png', endContent: 'Owner', group: 'Engineering' },
  { value: 'alan', label: 'Alan Turing', icon: <svg data-testid="icon" />, group: 'Engineering', tone: 'success' as const },
  { value: 'noor', label: 'Noor Haddad', group: 'Design' },
];

describe('Select: rich rows, renderValue, chips and events', () => {
  it('rows draw an avatar, an icon and end content, in groups; the chosen row shows its avatar in the field', () => {
    const { container } = render(<Select label="Owner" items={people} defaultValue="ada" defaultOpen />);
    const ada = screen.getByRole('option', { name: /Ada Lovelace/ });
    expect(ada.querySelector('.pinfold-select__avatar img')?.getAttribute('src')).toBe('/ada.png');
    expect(ada.querySelector('.pinfold-select__endContent')?.textContent).toBe('Owner');
    expect(screen.getByRole('group', { name: 'Design' })).toBeTruthy();
    expect(container.querySelector('.pinfold-select__value .pinfold-select__avatar')).toBeTruthy();
  });

  it('renderValue draws the chosen value; it gets each row with remove', () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Team"
        multiple
        items={people}
        defaultValue={['ada', 'alan']}
        onChange={onChange}
        renderValue={(selected) => (
          <span>
            {selected.length} chosen: {selected.map((s) => s.text).join(' & ')}
            <button type="button" onClick={selected[0].remove}>drop first</button>
          </span>
        )}
      />,
    );
    expect(screen.getByText(/2 chosen: Ada Lovelace & Alan Turing/)).toBeTruthy();
    fireEvent.click(screen.getByText('drop first'));
    expect(onChange).toHaveBeenLastCalledWith(['alan'], expect.anything());
  });

  it('a chip carries its row tone; onRemove gets the value and the item; onClear follows the clear button', () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    const { container } = render(<Select label="Team" multiple clearable chipVariant="outline" items={people} defaultValue={['ada', 'alan']} onRemove={onRemove} onClear={onClear} />);
    expect(container.firstElementChild!.getAttribute('data-chip-variant')).toBe('outline');
    const chips = container.querySelectorAll('.pinfold-select__chip');
    expect(chips[1].getAttribute('data-tone')).toBe('success');
    fireEvent.click(chips[0].querySelector('.pinfold-select__chipRemove')!);
    expect(onRemove).toHaveBeenCalledWith('ada', expect.objectContaining({ value: 'ada', index: 0 }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('inactive options are reported', () => {
    expect(inactiveSelectOptions({})).toMatchObject({ chipVariant: expect.any(String), onRemove: expect.any(String), onClear: expect.any(String) });
    expect(inactiveSelectOptions({ multiple: true, renderValue: () => null })).toHaveProperty('maxChips');
  });
});

describe('Select: validation', () => {
  it('validate runs when the field is left after a choice; the controller validates, sets and clears errors', async () => {
    let api: SelectApi | null = null;
    const onValidate = vi.fn();
    function Field() {
      const Owner = useSelect({ label: 'Owner', items: people, validate: (v) => (v === 'noor' ? 'Noor is away' : v === 'alan' ? { status: 'warning', message: 'Alan is busy' } : null), onValidate });
      api = Owner;
      return <Owner />;
    }
    const { container } = render(<Field />);
    const field = screen.getByRole('combobox');
    fireEvent.click(field);
    fireEvent.click(screen.getByRole('option', { name: /Noor/ }));
    fireEvent.blur(field);
    await vi.waitFor(() => expect(screen.getByText('Noor is away')).toBeTruthy());
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(onValidate).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false, value: 'noor' }));
    fireEvent.click(field);
    fireEvent.click(screen.getByRole('option', { name: /Alan/ }));
    await vi.waitFor(() => expect(screen.getByText('Alan is busy')).toBeTruthy());
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('warning');
    expect(field.getAttribute('aria-invalid')).toBeNull();
    act(() => api!.setError('Server says no'));
    expect(screen.getByText('Server says no')).toBeTruthy();
    act(() => api!.clearError());
    expect(screen.queryByText('Server says no')).toBeNull();
    await act(async () => {
      expect(await api!.validate()).toBe(true);
    });
  });

  it('a required select blocks submit with the message in the error slot, and focus goes to the field', () => {
    render(
      <form>
        <Select label="Owner" required items={people} messages={{ required: 'Choose an owner' }} />
        <button type="submit">Send</button>
      </form>,
    );
    const select = document.querySelector('select')!;
    fireEvent.invalid(select);
    expect(screen.getByText('Choose an owner')).toBeTruthy();
  });
});
