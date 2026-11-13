import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Input } from './Input';
import { useInput } from './useInput';
import type { InputComponent } from './types';

const described = (el: Element) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)!.textContent);

describe('Input validation', () => {
  it('validate on blur (default): quiet while typing, shown on leaving, live after that', () => {
    const onValidate = vi.fn();
    render(<Input label="Name" validate={(v) => (v.length < 3 ? 'Too short' : null)} onValidate={onValidate} />);
    const box = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(box, { target: { value: 'ab' } });
    expect(box.getAttribute('aria-invalid')).toBeNull();
    // The native validity already blocks a plain form.
    expect(box.validity.customError).toBe(true);
    expect(box.validationMessage).toBe('Too short');
    fireEvent.blur(box);
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(described(box)).toEqual(['Too short']);
    fireEvent.change(box, { target: { value: 'abc' } });
    expect(box.getAttribute('aria-invalid')).toBeNull();
    expect(box.validity.valid).toBe(true);
    expect(onValidate).toHaveBeenLastCalledWith({ valid: true, status: null, message: null, value: 'abc' });
  });

  it('validateOn change shows at once; submit waits for the form', () => {
    const { rerender } = render(<Input label="A" validateOn="change" validate={(v) => (v ? null : 'Needed')} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'x' } });
    fireEvent.change(box, { target: { value: '' } });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    rerender(<></>);
    render(
      <form>
        <Input label="B" validateOn="submit" validate={(v) => (v === 'ok' ? null : 'Say ok')} />
      </form>,
    );
    const b = screen.getByRole('textbox', { name: 'B' }) as HTMLInputElement;
    fireEvent.change(b, { target: { value: 'no' } });
    fireEvent.blur(b);
    expect(b.getAttribute('aria-invalid')).toBeNull();
    act(() => void b.dispatchEvent(new Event('invalid', { cancelable: true })));
    expect(b.getAttribute('aria-invalid')).toBe('true');
    expect(described(b)).toEqual(['Say ok']);
  });

  it('async validate: a pending state, and a stale result is dropped', async () => {
    const pending: Array<(v: string | null) => void> = [];
    const { container } = render(<Input label="User" validateOn="change" validate={() => new Promise<string | null>((r) => pending.push(r))} />);
    const box = screen.getByRole('textbox');
    const root = container.firstElementChild!;
    fireEvent.change(box, { target: { value: 'a' } });
    fireEvent.change(box, { target: { value: 'ab' } });
    expect(root.hasAttribute('data-validating')).toBe(true);
    expect(box.getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('.pinfold-input__validating')).toBeTruthy();
    await act(async () => pending[1](null));
    await act(async () => pending[0]('Taken'));
    expect(root.hasAttribute('data-validating')).toBe(false);
    expect(box.getAttribute('aria-invalid')).toBeNull();
  });

  it('warning and success: toned, linked, not invalid', () => {
    const { container, rerender } = render(<Input label="Pw" validateOn="change" validate={(v) => ({ status: 'warning', message: v.length < 8 ? 'Weak' : '' })} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'abc' } });
    expect(box.getAttribute('aria-invalid')).toBeNull();
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('warning');
    expect(described(box)).toEqual(['Weak']);
    expect(container.querySelector('.pinfold-input__statusIcon')).toBeTruthy();
    rerender(<Input label="Pw" status="success" description="Looks good" />);
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('success');
    expect(container.querySelector('.pinfold-input__description')!.getAttribute('data-status')).toBe('success');
  });

  it('native messages: overrides for translation, shown on blur after an edit; onInvalid reports', () => {
    const onInvalid = vi.fn();
    render(<Input label="Mail" type="email" required messages={{ required: 'Pflichtfeld', type: (el) => `Keine E-Mail: ${el.value}` }} onInvalid={onInvalid} />);
    const box = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.blur(box);
    expect(box.getAttribute('aria-invalid')).toBeNull();
    fireEvent.change(box, { target: { value: 'x' } });
    fireEvent.blur(box);
    expect(described(box)).toEqual(['Keine E-Mail: x']);
    fireEvent.change(box, { target: { value: '' } });
    act(() => void box.dispatchEvent(new Event('invalid', { cancelable: true })));
    expect(described(box)).toEqual(['Pflichtfeld']);
    expect(onInvalid).toHaveBeenCalledWith('Pflichtfeld', expect.anything());
  });

  it('error as a function of state wraps the validation message', () => {
    render(<Input label="A" validateOn="change" validate={() => 'Bad'} error={({ message }) => (message ? `Oops: ${message}` : null)} />);
    const box = screen.getByRole('textbox');
    expect(box.getAttribute('aria-invalid')).toBeNull();
    fireEvent.change(box, { target: { value: 'x' } });
    expect(described(box)).toEqual(['Oops: Bad']);
  });

  it('controller: validate(), setError() blocks the form until an edit, clearError()', async () => {
    let ctrl!: InputComponent;
    function Host() {
      const I = useInput({ label: 'A', required: true });
      ctrl = I;
      return <I />;
    }
    render(<Host />);
    const box = screen.getByRole('textbox') as HTMLInputElement;
    let ok = true;
    await act(async () => {
      ok = await ctrl.validate();
    });
    expect(ok).toBe(false);
    expect(box.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(box, { target: { value: 'x' } });
    act(() => ctrl.setError('Taken on the server'));
    expect(box.validationMessage).toBe('Taken on the server');
    expect(described(box)).toEqual(['Taken on the server']);
    act(() => ctrl.clearError());
    expect(box.validity.valid).toBe(true);
    expect(box.getAttribute('aria-invalid')).toBeNull();
    act(() => ctrl.setError('Again'));
    fireEvent.change(box, { target: { value: 'xy' } });
    expect(box.validity.valid).toBe(true);
  });

  it('a plain form will not submit while validate reports an error, and shows it', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Input label="Code" name="code" validateOn="submit" validate={(v) => (v === 'ok' ? null : 'Type ok')} />
      </form>,
    );
    const form = container.querySelector('form')!;
    const box = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(box, { target: { value: 'no' } });
    expect(box.getAttribute('aria-invalid')).toBeNull();
    act(() => form.requestSubmit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(described(box)).toEqual(['Type ok']);
    fireEvent.change(box, { target: { value: 'ok' } });
    act(() => form.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('a form reset drops validation results', () => {
    const { container } = render(
      <form>
        <Input label="A" validateOn="change" validate={(v) => (v ? 'No' : null)} />
      </form>,
    );
    const box = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(box, { target: { value: 'x' } });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    act(() => container.querySelector('form')!.reset());
    expect(box.getAttribute('aria-invalid')).toBeNull();
    expect(box.validity.valid).toBe(true);
  });
});

describe('Input events and content', () => {
  it('onFocus, onBlur, onKeyDown, onEnter (Ctrl+Enter when multiline), onClear', () => {
    const calls: string[] = [];
    const { rerender } = render(
      <Input
        label="A"
        clearable
        defaultValue="hi"
        onFocus={() => calls.push('focus')}
        onBlur={() => calls.push('blur')}
        onKeyDown={(e) => calls.push(`key:${e.key}`)}
        onEnter={(v) => calls.push(`enter:${v}`)}
        onClear={() => calls.push('clear')}
      />,
    );
    const box = screen.getByRole('textbox');
    fireEvent.focus(box);
    fireEvent.keyDown(box, { key: 'Enter' });
    fireEvent.blur(box);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    // Clearing refocuses the field.
    expect(calls).toEqual(['focus', 'key:Enter', 'enter:hi', 'blur', 'clear', 'focus']);
    const onEnter = vi.fn();
    rerender(<Input label="A" multiline defaultValue="x" onEnter={onEnter} />);
    const area = screen.getByRole('textbox');
    fireEvent.keyDown(area, { key: 'Enter' });
    expect(onEnter).not.toHaveBeenCalled();
    fireEvent.keyDown(area, { key: 'Enter', ctrlKey: true });
    expect(onEnter).toHaveBeenCalledWith('x', expect.anything());
  });

  it('start and end content take a function of state', () => {
    render(<Input label="A" startContent={(s) => (s.hasValue ? 'full' : 'empty')} endContent={<button type="button">Go</button>} />);
    expect(screen.getByText('empty')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    expect(screen.getByText('full')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
  });
});
