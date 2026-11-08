import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { comboboxMeta, selectMeta } from '@pinfold/core/meta';
import { Select } from './Select';
import { useSelect } from './useSelect';
import { defineSelect } from './define';
import { Combobox } from '../combobox/Combobox';
import { useCombobox } from '../combobox/useCombobox';
import { defineCombobox } from '../combobox/define';

const plans = [
  { value: 'free', label: 'Free', group: 'Personal' },
  { value: 'pro', label: 'Pro', description: '$12 a month', group: 'Personal' },
  { value: 'legacy', label: 'Legacy', disabled: true, group: 'Personal' },
  { value: 'team', label: 'Team', group: 'Business' },
];
const key = (k: string, extra: object = {}) => fireEvent.keyDown(document.activeElement!, { key: k, ...extra });
const active = () => {
  const id = document.activeElement?.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : undefined;
};

describe('Select', () => {
  it('a combobox named by its label and value; opens on Enter onto the chosen row; Enter chooses and closes', () => {
    const onChange = vi.fn();
    render(<Select label="Plan" items={plans} defaultValue="pro" onChange={onChange} />);
    const field = screen.getByRole('combobox', { name: /Plan/ });
    expect(field.getAttribute('aria-haspopup')).toBe('listbox');
    expect(field.textContent).toContain('Pro');
    field.focus();
    key('Enter');
    expect(field.getAttribute('aria-expanded')).toBe('true');
    expect(active()).toContain('Pro');
    expect(screen.getByRole('listbox', { name: 'Plan' })).toBeTruthy();
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent)).toEqual(['Personal', 'Business']);
    key('ArrowDown');
    // The disabled row is skipped.
    expect(active()).toContain('Team');
    key('Enter');
    expect(onChange).toHaveBeenLastCalledWith('team', expect.anything());
    expect(field.getAttribute('aria-expanded')).toBe('false');
    expect(field.textContent).toContain('Team');
  });

  it('strings are rows; typing jumps; Escape closes; a placeholder while empty', () => {
    render(<Select label="Country" items={['India', 'Japan', 'Kenya']} />);
    const field = screen.getByRole('combobox');
    expect(field.textContent).toContain('Select…');
    field.focus();
    key('k');
    expect(field.getAttribute('aria-expanded')).toBe('true');
    expect(active()).toBe('Kenya');
    key('Escape');
    expect(field.getAttribute('aria-expanded')).toBe('false');
  });

  it('multiple: the list stays open, rows toggle, chips show with "+n"; clear empties', () => {
    const onChange = vi.fn();
    const { container } = render(<Select label="Labels" multiple clearable maxChips={1} items={['bug', 'docs', 'feature']} defaultValue={['bug']} onChange={onChange} />);
    const field = screen.getByRole('combobox');
    field.focus();
    key('ArrowDown');
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
    fireEvent.click(screen.getByRole('option', { name: 'docs' }));
    expect(onChange).toHaveBeenLastCalledWith(['bug', 'docs'], expect.anything());
    expect(field.getAttribute('aria-expanded')).toBe('true');
    expect([...container.querySelectorAll('.pinfold-select__chip')].map((c) => c.textContent)).toEqual(['bug', '+1']);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith([], expect.anything());
  });

  it('a hidden native select carries the value for forms; required validates natively', () => {
    const { container } = render(
      <form>
        <Select label="Size" name="size" required items={['S', 'M']} defaultValue="M" />
      </form>,
    );
    const native = container.querySelector('select[name="size"]') as HTMLSelectElement;
    expect(native.value).toBe('M');
    expect(native.required).toBe(true);
    expect(new FormData(container.querySelector('form')!).get('size')).toBe('M');
  });

  it('renders on the server without the list', () => {
    const Field = defineSelect({ variant: 'filled' });
    const html = renderToString(<Field label="Size" items={['S', 'M']} defaultOpen />);
    expect(html).toContain('data-variant="filled"');
    expect(html).not.toContain('role="listbox"');
  });
});

describe('Combobox', () => {
  const cities = ['Zürich', 'Zagreb', 'Oslo', 'Osaka'];

  it('typing filters without case or accents, marks the match, and makes the first row active', () => {
    const onInputChange = vi.fn();
    const { container } = render(<Combobox label="City" items={cities} onInputChange={onInputChange} />);
    const input = screen.getByRole('combobox', { name: 'City' });
    input.focus();
    fireEvent.change(input, { target: { value: 'zu' } });
    expect(onInputChange).toHaveBeenLastCalledWith('zu');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Zürich']);
    expect(container.querySelector('mark')!.textContent).toBe('Zü');
    expect(active()).toBe('Zürich');
  });

  it('Enter chooses; leaving with unknown text goes back to the choice; Escape twice clears the text', () => {
    const onChange = vi.fn();
    render(<Combobox label="City" items={cities} onChange={onChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'os' } });
    key('ArrowDown');
    key('Enter');
    expect(onChange).toHaveBeenLastCalledWith('Osaka', expect.anything());
    expect(input.value).toBe('Osaka');
    fireEvent.change(input, { target: { value: 'nowhere' } });
    expect(screen.getByRole('listbox').textContent).toBe('No results');
    fireEvent.blur(input);
    expect(input.value).toBe('Osaka');
    input.focus();
    key('Escape');
    key('Escape');
    expect(input.value).toBe('');
  });

  it('multiple with allowCustom: a tag input; Backspace removes the last chip', () => {
    const onChange = vi.fn();
    const { container } = render(<Combobox label="Tags" multiple allowCustom items={['react', 'vue']} onChange={onChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 're' } });
    key('Enter');
    expect(onChange).toHaveBeenLastCalledWith(['react'], expect.anything());
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: 'svelte' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Add "svelte"']);
    key('Enter');
    expect(onChange).toHaveBeenLastCalledWith(['react', 'svelte'], expect.anything());
    expect([...container.querySelectorAll('.pinfold-select__chip')].map((c) => c.textContent)).toEqual(['react', 'svelte']);
    key('Backspace');
    expect(onChange).toHaveBeenLastCalledWith(['react'], expect.anything());
  });

  it('a server search: filter none keeps your rows, loading shows a row and marks the list busy', () => {
    const { rerender } = render(<Combobox label="Repo" filter="none" items={[]} loading defaultOpen />);
    const list = screen.getByRole('listbox');
    expect(list.getAttribute('aria-busy')).toBe('true');
    expect(list.textContent).toBe('Loading…');
    rerender(<Combobox label="Repo" filter="none" items={['pinfold', 'react']} defaultOpen defaultInputValue="xyz" />);
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('the controller sets the value and the text follows', () => {
    let api: ReturnType<typeof useCombobox> | null = null;
    function Probe() {
      const C = useCombobox({ label: 'City', items: cities });
      api = C;
      return <C />;
    }
    render(<Probe />);
    act(() => api!.setValue(['Oslo']));
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('Oslo');
    expect(renderToString(React.createElement(defineCombobox(), { label: 'City', items: cities }))).toContain('role="combobox"');
  });
});

describePinfoldConformance({
  name: 'select',
  slots: ['root', 'label', 'control', 'value', 'chevron'],
  optionalSlots: ['placeholder', 'chip', 'clear', 'popup', 'group', 'groupLabel', 'option', 'check', 'icon', 'detail', 'description', 'empty', 'error'],
  cssFile: 'packages/css/src/select.css',
  meta: selectMeta,
  preset: { define: defineSelect as any, props: { label: 'Size', items: ['S', 'M'] } },
  hook: { use: useSelect as any, config: { label: 'Size', items: ['S', 'M'] } },
  render: (config) => <Select label="Size" items={['S', 'M']} {...config} />,
});

describePinfoldConformance({
  name: 'combobox',
  block: 'select',
  slots: ['root', 'label', 'control', 'input', 'chevron'],
  optionalSlots: ['chip', 'clear', 'popup', 'group', 'groupLabel', 'option', 'check', 'icon', 'detail', 'empty', 'description', 'error'],
  cssFile: 'packages/css/src/select.css',
  meta: comboboxMeta,
  preset: { define: defineCombobox as any, props: { label: 'City', items: ['Oslo'] } },
  hook: { use: useCombobox as any, config: { label: 'City', items: ['Oslo'] } },
  render: (config) => <Combobox label="City" items={['Oslo']} {...config} />,
});
