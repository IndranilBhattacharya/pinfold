import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';
import { useColorPicker } from './useColorPicker';
import type { ColorPickerApi } from './types';

describe('Color picker: preset rows and validation', () => {
  it('swatches: loose colours, named colours and named rows; render.swatch gets the swatch', () => {
    const onChange = vi.fn();
    render(
      <ColorPicker
        label="Accent"
        defaultValue="#0ea5e9"
        onChange={onChange}
        swatches={['#000000', { label: 'Brand', colors: [{ value: '#4f46e5', label: 'Indigo' }, '#0ea5e9'] }, { label: 'Neutrals', colors: ['#64748b'] }]}
      />,
    );
    const brand = screen.getByRole('group', { name: 'Brand' });
    const indigo = within(brand).getByRole('button', { name: 'Indigo' });
    expect(indigo.getAttribute('title')).toBe('Indigo (#4f46e5)');
    expect(within(brand).getByRole('button', { name: '#0ea5e9' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(screen.getByRole('group', { name: 'Swatches' })).getByRole('button', { name: '#000000' })).toBeTruthy();
    fireEvent.click(indigo);
    expect(onChange).toHaveBeenLastCalledWith('#4f46e5', expect.objectContaining({ hex: '#4f46e5' }));
    const { container } = render(<ColorPicker label="B" swatches={[{ value: '#ff0000', label: 'Red' }]} render={{ swatch: ({ props, item }) => <button {...props}>{`${item?.label}:${item?.index}`}</button> }} />);
    expect(within(container).getByText('Red:0')).toBeTruthy();
  });

  it('validate: results show when the picker is left after a change, linked to the group and the field; warnings do not mark it invalid', () => {
    const onValidate = vi.fn();
    const { container } = render(
      <ColorPicker label="Accent" description="Used for links." defaultValue="#4f46e5" swatches={['#ffff00', '#000000']} onValidate={onValidate} validate={(c) => (c === '#ffff00' ? 'Too light on white' : c === '#000000' ? { status: 'warning', message: 'Very dark' } : null)} />,
    );
    const group = screen.getByRole('group', { name: 'Accent' });
    const field = screen.getByRole('textbox', { name: 'Hex' });
    fireEvent.click(screen.getByRole('button', { name: '#ffff00' }));
    expect(screen.queryByText('Too light on white')).toBeNull();
    fireEvent.blur(screen.getByRole('button', { name: '#ffff00' }), { relatedTarget: document.body });
    expect(screen.getByText('Too light on white')).toBeTruthy();
    expect(group.getAttribute('aria-describedby')).toContain(field.getAttribute('aria-describedby')!.split(' ')[0]);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect((field as HTMLInputElement).validationMessage).toBe('Too light on white');
    expect(onValidate).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false, value: '#ffff00' }));
    // Live while an error shows.
    fireEvent.click(screen.getByRole('button', { name: '#000000' }));
    expect(screen.getByText('Very dark')).toBeTruthy();
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('warning');
    expect(field.getAttribute('aria-invalid')).toBeNull();
  });

  it('the controller validates, sets and clears errors', async () => {
    let api: ColorPickerApi | null = null;
    function Picker() {
      const P = useColorPicker({ label: 'Accent', defaultValue: '#ffffff', validate: (c) => (c === '#ffffff' ? 'Pick a colour' : null) });
      api = P;
      return <P />;
    }
    render(<Picker />);
    await act(async () => {
      expect(await api!.validate()).toBe(false);
    });
    expect(screen.getByText('Pick a colour')).toBeTruthy();
    act(() => api!.clearError());
    expect(screen.queryByText('Pick a colour')).toBeNull();
    act(() => api!.setError('Taken by another team'));
    expect(screen.getByText('Taken by another team')).toBeTruthy();
  });
});
