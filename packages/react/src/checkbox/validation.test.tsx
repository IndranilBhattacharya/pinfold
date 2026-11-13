import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';
import { useCheckbox } from './useCheckbox';
import { Radio } from '../radio/Radio';
import { useRadio } from '../radio/useRadio';
import { Switch } from '../switch/Switch';
import type { CheckboxComponent } from './types';
import type { RadioComponent } from '../radio/types';

const described = (el: Element) => (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)!.textContent);
const rows = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', startContent: <i>logo</i>, endContent: '$9' },
];

describe('Checkbox: events, icon, validation', () => {
  it('onFocus, onBlur, onKeyDown on the native box', () => {
    const calls: string[] = [];
    render(<Checkbox label="A" onFocus={() => calls.push('focus')} onBlur={() => calls.push('blur')} onKeyDown={(e) => calls.push(e.key)} />);
    const box = screen.getByRole('checkbox');
    fireEvent.focus(box);
    fireEvent.keyDown(box, { key: ' ' });
    fireEvent.blur(box);
    expect(calls).toEqual(['focus', ' ', 'blur']);
  });

  it('icon is a node or a function of the box state; rows carry data-checked', () => {
    const { container } = render(<Checkbox label="A" icon={({ checked }) => <span>{checked ? 'on' : 'off'}</span>} />);
    expect(screen.getByText('off')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('on')).toBeTruthy();
    expect(container.querySelector('.pinfold-checkbox__item')!.hasAttribute('data-checked')).toBe(true);
  });

  it('group rows take start and end content, decorative start, outside the name', () => {
    const { container } = render(<Checkbox label="Add-ons" variant="card" items={rows} />);
    expect(container.querySelector('.pinfold-checkbox__itemStartContent')!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.pinfold-checkbox__itemEndContent')!.textContent).toBe('$9');
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toBeTruthy();
  });

  it('render overrides of a row receive the item with its state', () => {
    render(<Checkbox label="G" items={rows} defaultValue={['b']} render={{ item: ({ props, children, item }) => <label {...props} data-probe={`${item?.value}:${item?.checked}`}>{children}</label> }} />);
    expect(document.querySelector('[data-probe="b:true"]')).toBeTruthy();
    expect(document.querySelector('[data-probe="a:false"]')).toBeTruthy();
  });

  it('validate a group: values in, the first box blocks the form', () => {
    const onValidate = vi.fn();
    render(<Checkbox label="G" items={rows} validateOn="change" validate={(v: string[]) => (v.length > 1 ? 'Only one' : null)} onValidate={onValidate} />);
    const [a, b] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    fireEvent.click(a);
    fireEvent.click(b);
    expect(onValidate).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false, value: ['a', 'b'] }));
    expect(a.validationMessage).toBe('Only one');
    const group = screen.getByRole('group');
    expect(described(group)).toEqual(['Only one']);
  });

  it('controller: setError and validate with required', async () => {
    let ctrl!: CheckboxComponent;
    function Host() {
      const C = useCheckbox({ label: 'Terms', required: true, messages: { required: 'Bitte zustimmen' } });
      ctrl = C;
      return <C />;
    }
    render(<Host />);
    const box = screen.getByRole('checkbox');
    let ok = true;
    await act(async () => {
      ok = await ctrl.validate();
    });
    expect(ok).toBe(false);
    expect(described(box)).toEqual(['Bitte zustimmen']);
    fireEvent.click(box);
    act(() => ctrl.setError('Server says no'));
    expect(described(box)).toEqual(['Server says no']);
    act(() => ctrl.clearError());
    expect(box.getAttribute('aria-invalid')).toBeNull();
  });
});

describe('Radio: events, icon, validation', () => {
  it('icon replaces the dot; root says so; rows carry data-checked', () => {
    const { container } = render(<Radio label="R" items={rows} defaultValue="a" icon={({ checked }) => (checked ? '★' : '☆')} />);
    expect(container.firstElementChild!.hasAttribute('data-icon')).toBe(true);
    expect([...container.querySelectorAll('.pinfold-radio__box')].map((b) => b.textContent)).toEqual(['★', '☆']);
    fireEvent.click(screen.getByRole('radio', { name: 'Beta' }));
    expect([...container.querySelectorAll('.pinfold-radio__box')].map((b) => b.textContent)).toEqual(['☆', '★']);
    expect(container.querySelectorAll('[data-checked]')).toHaveLength(1);
  });

  it('blur inside the group does not validate; leaving it does', () => {
    const onBlur = vi.fn();
    render(<Radio label="R" items={rows} validate={(v) => (v === 'b' ? 'Not Beta' : null)} onBlur={onBlur} />);
    const [a, b] = screen.getAllByRole('radio');
    fireEvent.click(b);
    fireEvent.blur(b, { relatedTarget: a });
    expect(screen.getByRole('radiogroup').getAttribute('aria-invalid')).toBeNull();
    fireEvent.blur(b);
    expect(screen.getByRole('radiogroup').getAttribute('aria-invalid')).toBe('true');
    expect(onBlur).toHaveBeenCalledTimes(2);
  });

  it('controller validate with required', async () => {
    let ctrl!: RadioComponent;
    function Host() {
      const R = useRadio({ label: 'R', items: rows, required: true });
      ctrl = R;
      return <R />;
    }
    render(<Host />);
    let ok = true;
    await act(async () => {
      ok = await ctrl.validate();
    });
    expect(ok).toBe(false);
    expect(screen.getByRole('radiogroup').getAttribute('aria-invalid')).toBe('true');
  });
});

describe('Switch: events, thumb, validation', () => {
  it('thumbIcon as a function of state; data-checked follows', () => {
    const { container } = render(<Switch label="Dark" thumbIcon={(s) => (s.checked ? 'moon' : 'sun')} />);
    expect(container.querySelector('.pinfold-switch__thumb')!.textContent).toBe('sun');
    fireEvent.click(screen.getByRole('switch'));
    expect(container.querySelector('.pinfold-switch__thumb')!.textContent).toBe('moon');
    expect(container.firstElementChild!.hasAttribute('data-checked')).toBe(true);
  });

  it('events and a warning status', () => {
    const calls: string[] = [];
    const { container } = render(<Switch label="A" status="warning" description="Careful" onFocus={() => calls.push('focus')} onBlur={() => calls.push('blur')} onKeyDown={() => calls.push('key')} />);
    const sw = screen.getByRole('switch');
    fireEvent.focus(sw);
    fireEvent.keyDown(sw, { key: ' ' });
    fireEvent.blur(sw);
    expect(calls).toEqual(['focus', 'key', 'blur']);
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('warning');
    expect(sw.getAttribute('aria-invalid')).toBeNull();
  });

  it('validate receives the checked state', () => {
    render(<Switch label="A" validateOn="change" validate={(on) => (on ? null : 'Must be on')} defaultChecked />);
    const sw = screen.getByRole('switch');
    fireEvent.click(sw);
    expect(described(sw)).toEqual(['Must be on']);
    expect((sw as HTMLInputElement).validity.customError).toBe(true);
  });
});
