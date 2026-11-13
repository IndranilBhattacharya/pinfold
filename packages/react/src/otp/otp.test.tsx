import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Otp } from './Otp';

const described = (el: Element) => (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)!.textContent);

describe('Otp events and content', () => {
  it('onPaste reports the text and can cancel; onFocus, onBlur, onKeyDown', () => {
    const calls: string[] = [];
    render(
      <Otp
        label="Code"
        onPaste={(text, event) => {
          calls.push(`paste:${text}`);
          if (text === 'no') event.preventDefault();
        }}
        onFocus={() => calls.push('focus')}
        onBlur={() => calls.push('blur')}
        onKeyDown={(e) => calls.push(e.key)}
      />,
    );
    const box = screen.getByRole('textbox');
    fireEvent.focus(box);
    fireEvent.keyDown(box, { key: '1' });
    const ok = fireEvent.paste(box, { clipboardData: { getData: () => '123456' } });
    const cancelled = !fireEvent.paste(box, { clipboardData: { getData: () => 'no' } });
    fireEvent.blur(box);
    expect(ok).toBe(true);
    expect(cancelled).toBe(true);
    expect(calls).toEqual(['focus', '1', 'paste:123456', 'paste:no', 'blur']);
  });

  it('separator as a function, maskChar, placeholder in empty boxes', () => {
    const { container } = render(<Otp label="Code" length={6} groups={[2, 2, 2]} separator={(i) => `#${i}`} mask maskChar="*" placeholder="·" defaultValue="12" />);
    expect([...container.querySelectorAll('.pinfold-otp__separator')].map((s) => s.textContent)).toEqual(['#0', '#1']);
    const slots = [...container.querySelectorAll('.pinfold-otp__slot')].map((s) => s.textContent);
    expect(slots).toEqual(['*', '*', '·', '·', '·', '·']);
  });

  it('onComplete, then validate checks the whole code', async () => {
    const onComplete = vi.fn();
    render(<Otp label="Code" length={4} validateOn="change" onComplete={onComplete} validate={(v) => (v.length === 4 && v !== '1234' ? 'Wrong code' : null)} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '1111' } });
    expect(onComplete).toHaveBeenCalledWith('1111');
    expect(described(box)).toEqual(['Wrong code']);
    fireEvent.change(box, { target: { value: '1234' } });
    expect(box.getAttribute('aria-invalid')).toBeNull();
  });

  it('async validate on complete: pending, then the result', async () => {
    let resolve!: (v: string | null) => void;
    const { container } = render(<Otp label="Code" length={2} validateOn="change" validate={() => new Promise((r) => (resolve = r))} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '12' } });
    expect(container.firstElementChild!.hasAttribute('data-validating')).toBe(true);
    expect(container.querySelector('.pinfold-otp__validating')).toBeTruthy();
    await act(async () => resolve('Expired'));
    expect(described(box)).toEqual(['Expired']);
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('error');
  });
});
