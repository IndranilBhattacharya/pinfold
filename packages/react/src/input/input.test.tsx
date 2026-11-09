import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { inputMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Input } from './Input';
import { useInput } from './useInput';
import { defineInput } from './define';
import type { InputComponent } from './types';

describe('Input', () => {
  it('revealable: a pressed toggle shows the password as text and hides it again', () => {
    render(<Input label="Password" type="password" revealable />);
    const field = screen.getByLabelText('Password') as HTMLInputElement;
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(field.type).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(field.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(toggle);
    expect(field.type).toBe('password');
  });

  it('showCount: "n/max" as you type, read politely once typing pauses; warns near and at the limit', () => {
    vi.useFakeTimers();
    const { container } = render(<Input label="Bio" showCount maxLength={10} defaultValue="abc" />);
    const counter = container.querySelector('.pinfold-input__counter')!;
    expect(counter.textContent).toBe('3/10');
    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'abcdefghi' } });
    expect(counter.textContent).toBe('9/10');
    expect(counter.hasAttribute('data-near')).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('');
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole('status').textContent).toBe('1 character left');
    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'abcdefghij' } });
    expect(counter.hasAttribute('data-full')).toBe(true);
    vi.useRealTimers();
  });

  it('showCount without a limit counts only; a controlled value counts too', () => {
    const { container } = render(<Input label="Notes" showCount multiline value="hello" onChange={() => {}} />);
    expect(container.querySelector('.pinfold-input__counter')!.textContent).toBe('5');
  });

  it('label inside: it follows the input, which gets a blank placeholder so CSS sees it empty', () => {
    const { container } = render(<Input label="Email" labelPlacement="inside" />);
    const box = screen.getByRole('textbox', { name: 'Email' }) as HTMLInputElement;
    expect(box.placeholder).toBe(' ');
    expect(box.nextElementSibling!.tagName).toBe('LABEL');
    expect(box.parentElement!.classList.contains('pinfold-input__field')).toBe(true);
    expect(container.firstElementChild!.getAttribute('data-label-placement')).toBe('inside');
    render(<Input label="Name" labelPlacement="inside" placeholder="Ada" />);
    expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).placeholder).toBe('Ada');
  });

  it('a hidden label stays outside, whatever the placement', () => {
    const { container } = render(<Input label="Search" labelPlacement="inside" hideLabel />);
    expect(container.firstElementChild!.getAttribute('data-label-placement')).toBe('outside');
    expect(container.querySelector('.pinfold-input__field')).toBeNull();
  });

  it('multiline has a drag handle (own icon optional) that sets the height, never below the rows', () => {
    const icon = <svg data-testid="grip" />;
    const { container, rerender } = render(<Input label="Notes" multiline resizeIcon={icon} />);
    const handle = container.querySelector('.pinfold-input__handle') as HTMLElement;
    expect(handle.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByTestId('grip')).toBeTruthy();
    const area = screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement;
    Object.defineProperty(area, 'offsetHeight', { configurable: true, value: 80 });
    fireEvent.pointerDown(handle, { button: 0, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 160, pointerId: 1 });
    expect(area.style.height).toBe('140px');
    fireEvent.pointerMove(handle, { clientY: 0, pointerId: 1 });
    expect(area.style.height).toBe('80px');
    fireEvent.pointerUp(handle, { pointerId: 1 });
    rerender(<Input label="Notes" multiline autosize />);
    expect(container.querySelector('.pinfold-input__handle')).toBeNull();
    rerender(<Input label="Notes" multiline resize="none" />);
    expect(container.querySelector('.pinfold-input__handle')).toBeNull();
  });

  it('the clear button takes its own icon', () => {
    render(<Input label="Q" clearable defaultValue="x" clearIcon={<svg data-testid="mine" />} />);
    expect(screen.getByTestId('mine').closest('button')!.getAttribute('aria-label')).toBe('Clear');
  });

  it('names the control and links its help text and error', () => {
    render(<Input label="Email" description="We never share it" error="Not valid" />);
    const box = screen.getByRole('textbox', { name: 'Email' }) as HTMLInputElement;
    expect(box.getAttribute('aria-invalid')).toBe('true');
    const ids = box.getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => document.getElementById(id)!.textContent)).toEqual(['We never share it', 'Not valid']);
  });

  it('a hidden label still names it; required is native with an aria-hidden marker', () => {
    const { container } = render(<Input label="Search" hideLabel required />);
    const box = screen.getByRole('textbox', { name: /Search/ }) as HTMLInputElement;
    expect(box.required).toBe(true);
    expect(container.querySelector('label')!.getAttribute('style')).toContain('position: absolute');
    expect(container.querySelector('.pinfold-field__required')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('reports values; uncontrolled stays native', () => {
    const onChange = vi.fn();
    render(<Input label="Name" defaultValue="Ada" onChange={onChange} />);
    const box = screen.getByRole('textbox') as HTMLInputElement;
    expect(box.value).toBe('Ada');
    fireEvent.change(box, { target: { value: 'Grace' } });
    expect(onChange).toHaveBeenCalledWith('Grace', expect.anything());
  });

  it('the clear button empties it and refocuses, uncontrolled or controlled', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Input label="Name" defaultValue="Ada" clearable onChange={onChange} />);
    const box = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(box.value).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(document.activeElement).toBe(box);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    rerender(<Input label="Name" value="Ada" clearable onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('no clear button when read-only or disabled', () => {
    const { rerender } = render(<Input label="Name" defaultValue="Ada" clearable readOnly />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Input label="Name" defaultValue="Ada" clearable disabled />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('multiline is a textarea, without a type', () => {
    render(<Input label="Notes" multiline rows={5} />);
    const box = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(box.tagName).toBe('TEXTAREA');
    expect(box.rows).toBe(5);
    expect(box.hasAttribute('type')).toBe(false);
  });

  it('shows the browser message instead of its bubble, focuses the first invalid, and recovers', () => {
    render(
      <form noValidate={false}>
        <Input label="First" required name="a" />
        <Input label="Second" required name="b" />
      </form>,
    );
    const first = screen.getByRole('textbox', { name: /First/ }) as HTMLInputElement;
    const second = screen.getByRole('textbox', { name: /Second/ }) as HTMLInputElement;
    const event = new Event('invalid', { cancelable: true });
    act(() => void second.dispatchEvent(event));
    act(() => void first.dispatchEvent(new Event('invalid', { cancelable: true })));
    expect(event.defaultPrevented).toBe(true);
    expect(first.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(first);
    fireEvent.change(first, { target: { value: 'x' } });
    expect(first.getAttribute('aria-invalid')).toBeNull();
    expect(second.getAttribute('aria-invalid')).toBe('true');
  });

  it('`error` wins over native messages; nativeErrors off leaves the bubble', () => {
    const { rerender } = render(<Input label="A" required error="Mine" />);
    const box = screen.getByRole('textbox');
    act(() => void box.dispatchEvent(new Event('invalid', { cancelable: true })));
    expect(document.getElementById(box.getAttribute('aria-describedby')!)!.textContent).toBe('Mine');
    rerender(<Input label="A" required nativeErrors={false} />);
    const event = new Event('invalid', { cancelable: true });
    act(() => void box.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
  });

  it('a form reset restores the value and clears native messages', async () => {
    const { container } = render(
      <form>
        <Input label="A" required defaultValue="Ada" clearable />
      </form>,
    );
    const box = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    act(() => void box.dispatchEvent(new Event('invalid', { cancelable: true })));
    expect(box.getAttribute('aria-invalid')).toBe('true');
    act(() => container.querySelector('form')!.reset());
    expect(box.value).toBe('Ada');
    expect(box.getAttribute('aria-invalid')).toBeNull();
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy());
  });

  it('has a controller', () => {
    let ctrl!: InputComponent;
    function Host() {
      const I = useInput({ label: 'A', defaultValue: 'x' });
      ctrl = I;
      return <I />;
    }
    render(<Host />);
    act(() => ctrl.focus());
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
    act(() => ctrl.clear());
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('follows the provider size', () => {
    const { container } = render(
      <PinfoldProvider size="lg">
        <Input label="A" />
      </PinfoldProvider>,
    );
    expect(container.querySelector('.pinfold-input')!.getAttribute('data-size')).toBe('lg');
  });

  it('a preset renders on the server, with the value', () => {
    const Email = defineInput({ type: 'email', required: true });
    const html = renderToString(<Email label="Email" name="email" defaultValue="a@b.co" />);
    expect(html).toContain('type="email"');
    expect(html).toContain('value="a@b.co"');
    expect(html).toContain('for="');
  });
});

describePinfoldConformance({
  name: 'input',
  inherits: ['size'],
  slots: ['root', 'label', 'control', 'input', 'startContent', 'endContent', 'clear', 'description', 'error'],
  dimension: { key: 'width', value: 300 },
  cssFile: 'packages/css/src/input.css',
  meta: inputMeta,
  preset: { define: defineInput as any, props: { label: 'Name' } },
  hook: { use: useInput as any, config: { label: 'Name' } },
  render: (config) => <Input label="Name" defaultValue="Ada" description="Help" error="Bad" clearable startContent={<svg />} endContent={<svg />} {...config} />,
});
