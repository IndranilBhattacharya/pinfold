import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { checkboxMeta, radioMeta, switchMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Checkbox } from './Checkbox';
import { useCheckbox } from './useCheckbox';
import { defineCheckbox } from './define';
import { Radio } from '../radio/Radio';
import { useRadio } from '../radio/useRadio';
import { defineRadio } from '../radio/define';
import { Switch } from '../switch/Switch';
import { useSwitch } from '../switch/useSwitch';
import { defineSwitch } from '../switch/define';

const rows = [
  { value: 'a', label: 'Alpha', description: 'First' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
];

describe('Checkbox', () => {
  it('is named by its label alone; the description is linked, not part of the name', () => {
    render(<Checkbox label="Terms" description="Read them" error="Required" />);
    const box = screen.getByRole('checkbox', { name: 'Terms' });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent)).toEqual(['Read them', 'Required']);
  });

  it('toggles natively, reports the state, and the whole row is the target', () => {
    const onChange = vi.fn();
    const { container } = render(<Checkbox label="Terms" onChange={onChange} />);
    fireEvent.click(container.querySelector('label')!);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('sets the native indeterminate property', () => {
    render(<Checkbox label="All" indeterminate />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
  });

  it('a group is a named fieldset that reports the checked values', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Topics" name="t" items={rows} defaultValue={['a']} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Topics' }).tagName).toBe('FIELDSET');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b'], expect.anything());
    expect((screen.getByRole('checkbox', { name: 'Gamma' }) as HTMLInputElement).disabled).toBe(true);
  });

  it('a controlled group follows its value', () => {
    const { rerender } = render(<Checkbox label="T" items={rows} value={['a']} onChange={() => {}} />);
    expect((screen.getByRole('checkbox', { name: 'Alpha' }) as HTMLInputElement).checked).toBe(true);
    rerender(<Checkbox label="T" items={rows} value={['b']} onChange={() => {}} />);
    expect((screen.getByRole('checkbox', { name: 'Alpha' }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('checkbox', { name: 'Beta' }) as HTMLInputElement).checked).toBe(true);
  });

  it('`required` on a group means at least one', () => {
    render(<Checkbox label="T" items={rows.slice(0, 2)} required />);
    const a = screen.getByRole('checkbox', { name: 'Alpha' }) as HTMLInputElement;
    const b = screen.getByRole('checkbox', { name: 'Beta' }) as HTMLInputElement;
    expect(a.required && b.required).toBe(true);
    fireEvent.click(a);
    expect(a.required || b.required).toBe(false);
    fireEvent.click(a);
    expect(a.required && b.required).toBe(true);
  });

  it('a form reset restores it and clears native messages', () => {
    const { container } = render(
      <form>
        <Checkbox label="Terms" required defaultChecked />
      </form>,
    );
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(box);
    expect(box.checked).toBe(false);
    act(() => void box.dispatchEvent(new Event('invalid', { cancelable: true })));
    expect(box.getAttribute('aria-invalid')).toBe('true');
    act(() => container.querySelector('form')!.reset());
    expect(box.checked).toBe(true);
    expect(box.getAttribute('aria-invalid')).toBeNull();
  });
});

describe('Radio', () => {
  it('is a named radiogroup; every row shares a name, generated when absent', () => {
    render(<Radio label="Plan" items={rows} defaultValue="b" />);
    screen.getByRole('radiogroup', { name: 'Plan' });
    const names = new Set(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).name));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
    expect((screen.getByRole('radio', { name: 'Beta' }) as HTMLInputElement).checked).toBe(true);
  });

  it('reports the value, controlled or not', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Radio label="P" items={rows} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith('a', expect.anything());
    rerender(<Radio label="P" items={rows} value="b" onChange={onChange} />);
    expect((screen.getByRole('radio', { name: 'Beta' }) as HTMLInputElement).checked).toBe(true);
  });

  it('links the group error and a row description', () => {
    render(<Radio label="P" items={rows} error="Pick one" />);
    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(group.getAttribute('aria-describedby')!)!.textContent).toBe('Pick one');
    const a = screen.getByRole('radio', { name: 'Alpha' });
    expect(document.getElementById(a.getAttribute('aria-describedby')!)!.textContent).toBe('First');
  });

  it('a disabled group disables natively through the fieldset', () => {
    render(<Radio label="P" items={rows} disabled />);
    expect((screen.getByRole('radiogroup') as HTMLFieldSetElement).disabled).toBe(true);
  });
});

describe('Switch', () => {
  it('is a native checkbox with the switch role', () => {
    const onChange = vi.fn();
    render(<Switch label="Alerts" onChange={onChange} />);
    const el = screen.getByRole('switch', { name: 'Alerts' }) as HTMLInputElement;
    expect(el.type).toBe('checkbox');
    fireEvent.click(el);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('submits its form value', () => {
    const { container } = render(
      <form>
        <Switch label="Alerts" name="alerts" formValue="yes" defaultChecked />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('alerts')).toBe('yes');
  });

  it('variants: the icon thumb carries both marks; others draw none', () => {
    const { container, rerender } = render(<Switch label="Wi-Fi" />);
    expect(container.firstElementChild!.getAttribute('data-variant')).toBe('solid');
    expect(container.querySelector('.pinfold-switch__thumb svg')).toBeNull();
    rerender(<Switch label="Wi-Fi" variant="icon" />);
    expect(container.querySelectorAll('.pinfold-switch__thumb path')).toHaveLength(2);
    expect(container.querySelector('.pinfold-switch__box')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a preset renders on the server, checked', () => {
    const Setting = defineSwitch({ labelPosition: 'start' });
    const html = renderToString(<Setting label="Alerts" defaultChecked />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('checked');
  });
});

describe('Choice motion', () => {
  it('names the animation on the root, and none or the provider turns it off', () => {
    const root = (el: React.ReactElement) => render(el).container.firstElementChild!.getAttribute('data-animate');
    expect(root(<Checkbox label="A" />)).toBe('draw');
    expect(root(<Checkbox label="A" animation="pop" />)).toBe('pop');
    expect(root(<Checkbox label="A" animation="none" />)).toBeNull();
    expect(root(<Radio label="R" items={rows} />)).toBe('spring');
    expect(root(<Radio label="R" items={rows} animation="ripple" />)).toBe('ripple');
    expect(root(<Switch label="S" />)).toBe('spring');
    expect(root(<Switch label="S" animation="slide" />)).toBe('slide');
    expect(root(<PinfoldProvider disableAnimation><Switch label="S" /></PinfoldProvider>)).toBeNull();
  });

  it('the tick has a path length of 1, so it can be traced at any size', () => {
    const { container } = render(<Checkbox label="A" />);
    expect(container.querySelector('.pinfold-checkbox__check')!.getAttribute('pathLength')).toBe('1');
  });

  it('a card row draws its selection frame beside the input, decorative', () => {
    const { container } = render(<Radio label="R" items={rows} variant="card" />);
    const frames = container.querySelectorAll('.pinfold-choice__frame');
    expect(frames).toHaveLength(3);
    expect(frames[0].getAttribute('aria-hidden')).toBe('true');
    expect(frames[0].previousElementSibling!.classList.contains('pinfold-choice__box')).toBe(true);
  });
});

describePinfoldConformance({
  name: 'checkbox',
  slots: ['root', 'label', 'items', 'item', 'input', 'box', 'itemLabel', 'itemDescription', 'description', 'error'],
  dimension: { key: 'size', value: 20 },
  cssFile: 'packages/css/src/checkbox.css',
  meta: checkboxMeta,
  preset: { define: defineCheckbox as any, props: { label: 'A' } },
  hook: { use: useCheckbox as any, config: { label: 'A' } },
  render: (config) => <Checkbox label="Topics" items={rows} description="Help" error="Bad" {...config} />,
});

describePinfoldConformance({
  name: 'radio',
  slots: ['root', 'label', 'items', 'item', 'input', 'box', 'itemLabel', 'itemDescription', 'description', 'error'],
  dimension: { key: 'size', value: 20 },
  cssFile: 'packages/css/src/radio.css',
  meta: radioMeta,
  preset: { define: defineRadio as any, props: { label: 'A', items: rows } },
  hook: { use: useRadio as any, config: { label: 'A', items: rows } },
  render: (config) => <Radio label="Plan" items={rows} description="Help" error="Bad" {...config} />,
});

describePinfoldConformance({
  name: 'switch',
  variants: false,
  slots: ['root', 'item', 'input', 'box', 'thumb', 'itemLabel', 'description', 'error'],
  dimension: { key: 'width', value: 40 },
  cssFile: 'packages/css/src/switch.css',
  meta: switchMeta,
  preset: { define: defineSwitch as any, props: { label: 'A' } },
  hook: { use: useSwitch as any, config: { label: 'A' } },
  render: (config) => <Switch label="Alerts" description="Help" error="Bad" {...config} />,
});
