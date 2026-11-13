import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Slider } from './Slider';
import { useSlider } from './useSlider';
import type { SliderComponent } from './types';

describe('Slider events, content and validation', () => {
  it('onValueCommit and onChangeEnd fire on release after a change, not on a bare key release', () => {
    const onValueCommit = vi.fn();
    const onChangeEnd = vi.fn();
    render(<Slider label="V" defaultValue={[10]} onValueCommit={onValueCommit} onChangeEnd={onChangeEnd} />);
    const thumb = screen.getByRole('slider');
    fireEvent.keyUp(thumb, { key: 'Tab' });
    expect(onValueCommit).not.toHaveBeenCalled();
    fireEvent.change(thumb, { target: { value: '30' } });
    fireEvent.pointerUp(thumb);
    fireEvent.blur(thumb);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith([30]);
    expect(onChangeEnd).toHaveBeenCalledWith([30]);
  });

  it('onFocus, onBlur, onKeyDown per thumb', () => {
    const calls: string[] = [];
    render(<Slider label="V" defaultValue={[10, 50]} onFocus={(e) => calls.push(`focus${e.currentTarget.dataset.index}`)} onBlur={() => calls.push('blur')} onKeyDown={(e) => calls.push(e.key)} />);
    const [, hi] = screen.getAllByRole('slider');
    fireEvent.focus(hi);
    fireEvent.keyDown(hi, { key: 'ArrowRight' });
    fireEvent.blur(hi);
    expect(calls).toEqual(['focus1', 'ArrowRight', 'blur']);
  });

  it('thumbContent: a node or a function of the thumb', () => {
    const { container } = render(<Slider label="V" defaultValue={[10, 50]} thumbContent={({ value, index }) => `${index}:${value}`} />);
    const thumbs = [...container.querySelectorAll('.pinfold-slider__thumb')];
    expect(thumbs.map((t) => t.textContent)).toEqual(['0:10', '1:50']);
    expect(thumbs[0].hasAttribute('data-custom')).toBe(true);
  });

  it('validate gets the values; the controller sets and clears errors', async () => {
    let ctrl!: SliderComponent;
    function Host() {
      const S = useSlider({ label: 'V', defaultValue: [10], validateOn: 'change', validate: (v) => (v[0] > 80 ? 'Too loud' : null) });
      ctrl = S;
      return <S />;
    }
    const { container } = render(<Host />);
    const thumb = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(thumb, { target: { value: '90' } });
    expect(thumb.getAttribute('aria-invalid')).toBe('true');
    expect(thumb.validationMessage).toBe('Too loud');
    expect(container.firstElementChild!.getAttribute('data-validity')).toBe('error');
    fireEvent.change(thumb, { target: { value: '20' } });
    expect(thumb.getAttribute('aria-invalid')).toBeNull();
    act(() => ctrl.setError('Locked'));
    expect(thumb.getAttribute('aria-invalid')).toBe('true');
    let ok = true;
    await act(async () => {
      ok = await ctrl.validate();
    });
    expect(ok).toBe(false);
    act(() => ctrl.clearError());
    expect(thumb.getAttribute('aria-invalid')).toBeNull();
  });
});
