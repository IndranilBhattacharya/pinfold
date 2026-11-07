import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { numberMeta, otpMeta, sliderMeta } from '@pinfold/core/meta';
import { Slider } from './Slider';
import { useSlider } from './useSlider';
import { defineSlider } from './define';
import { NumberField } from '../number/NumberField';
import { useNumberField } from '../number/useNumberField';
import { defineNumberField } from '../number/define';
import { Otp } from '../otp/Otp';
import { useOtp } from '../otp/useOtp';
import { defineOtp } from '../otp/define';

describe('Slider', () => {
  it('one thumb is a native range named by the label, reading the formatted value', () => {
    const onChange = vi.fn();
    render(<Slider label="Volume" defaultValue={[40]} formatValue={(v) => `${v}%`} onChange={onChange} />);
    const thumb = screen.getByRole('slider', { name: 'Volume' }) as HTMLInputElement;
    expect(thumb.value).toBe('40');
    expect(thumb.getAttribute('aria-valuetext')).toBe('40%');
    fireEvent.change(thumb, { target: { value: '55' } });
    expect(onChange).toHaveBeenCalledWith([55], expect.anything());
    expect(screen.getByText('55%')).toBeTruthy();
  });

  it('a range has two named thumbs that never cross and keep the gap', () => {
    const onChange = vi.fn();
    render(<Slider label="Price" defaultValue={[20, 80]} minGap={10} onChange={onChange} />);
    const [low, high] = screen.getAllByRole('slider') as HTMLInputElement[];
    expect(low.getAttribute('aria-labelledby')!.split(' ').map((id) => document.getElementById(id)!.textContent)).toEqual(['Price', 'Minimum']);
    fireEvent.change(low, { target: { value: '95' } });
    expect(onChange).toHaveBeenLastCalledWith([70, 80], expect.anything());
    expect(screen.getByRole('group', { name: 'Price' }).hasAttribute('data-range')).toBe(true);
    void high;
  });

  it('onChangeEnd fires on release with the last values', () => {
    const onChangeEnd = vi.fn();
    render(<Slider label="Volume" defaultValue={[10]} onChangeEnd={onChangeEnd} />);
    const thumb = screen.getByRole('slider');
    fireEvent.change(thumb, { target: { value: '30' } });
    fireEvent.pointerUp(thumb);
    expect(onChangeEnd).toHaveBeenCalledWith([30]);
  });

  it('a form reset returns to the default', async () => {
    render(
      <form data-testid="f">
        <Slider label="Volume" name="volume" defaultValue={[10]} />
      </form>,
    );
    const thumb = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(thumb, { target: { value: '70' } });
    act(() => (screen.getByTestId('f') as HTMLFormElement).reset());
    expect(thumb.value).toBe('10');
  });

  it('snapToMarks: a drag lands on the nearest mark, arrow keys move from mark to mark', () => {
    const onChange = vi.fn();
    const marks = [{ value: 0 }, { value: 10 }, { value: 50 }, { value: 100 }];
    render(<Slider label="Plan" defaultValue={[12]} marks={marks} snapToMarks onChange={onChange} />);
    const thumb = screen.getByRole('slider') as HTMLInputElement;
    expect(thumb.value).toBe('10');
    expect(thumb.getAttribute('step')).toBe('any');
    fireEvent.change(thumb, { target: { value: '38' } });
    expect(onChange).toHaveBeenLastCalledWith([50], expect.anything());
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith([100], expect.anything());
    fireEvent.keyDown(thumb, { key: 'Home' });
    expect(thumb.value).toBe('0');
    fireEvent.keyDown(thumb, { key: 'ArrowUp' });
    expect(thumb.value).toBe('10');
  });

  it('showSteps draws a dot per step up to 40 steps; variant and icons either side', () => {
    const { container, rerender } = render(<Slider label="Level" step={10} showSteps variant="bar" startContent={<i>low</i>} endContent={<i>high</i>} />);
    const root = container.querySelector('.pinfold-slider') as HTMLElement;
    expect(root.dataset.variant).toBe('bar');
    expect(root.style.getPropertyValue('--pinfold-sld-n')).toBe('10');
    expect(container.querySelector('.pinfold-slider__steps')).toBeTruthy();
    expect(container.querySelector('.pinfold-slider__body > .pinfold-slider__startContent')!.textContent).toBe('low');
    expect(container.querySelector('.pinfold-slider__endContent')!.getAttribute('aria-hidden')).toBe('true');
    rerender(<Slider label="Level" showSteps />);
    expect(container.querySelector('.pinfold-slider__steps')).toBeNull();
    expect(container.querySelector('.pinfold-slider__body')).toBeNull();
  });
});

describe('NumberField', () => {
  it('is a native spinbutton; the buttons step, stop at the limits, and stay out of the tab order', () => {
    const onChange = vi.fn();
    render(<NumberField label="Quantity" defaultValue={98} min={1} max={99} onChange={onChange} />);
    const box = screen.getByRole('spinbutton', { name: 'Quantity' }) as HTMLInputElement;
    const plus = screen.getByRole('button', { name: 'Increase' });
    expect(plus.tabIndex).toBe(-1);
    fireEvent.click(plus, { detail: 0 });
    expect(box.value).toBe('99');
    expect(onChange).toHaveBeenLastCalledWith(99);
    expect((plus as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(box, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything());
  });

  it('press and hold repeats', () => {
    vi.useFakeTimers();
    render(<NumberField label="N" defaultValue={0} />);
    const plus = screen.getByRole('button', { name: 'Increase' });
    fireEvent.pointerDown(plus, { button: 0 });
    act(() => void vi.advanceTimersByTime(400 + 60 * 3));
    fireEvent.pointerUp(plus);
    expect(Number((screen.getByRole('spinbutton') as HTMLInputElement).value)).toBe(5);
    vi.useRealTimers();
  });

  it('end steppers sit after the number; none leaves the arrow keys', () => {
    const { container, rerender } = render(<NumberField label="N" steppers="end" />);
    const control = container.querySelector('.pinfold-number__control')!;
    expect([...control.children].map((el) => el.className)).toEqual(['pinfold-number__input', 'pinfold-number__decrement', 'pinfold-number__increment']);
    rerender(<NumberField label="N" steppers="none" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Otp', () => {
  it('one native input holds the code, with autofill and validation; boxes are hidden', () => {
    const onComplete = vi.fn();
    const { container } = render(<Otp label="Code" length={4} onComplete={onComplete} />);
    const box = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    expect(box.getAttribute('autocomplete')).toBe('one-time-code');
    expect(box.getAttribute('pattern')).toBe('\\d{4}');
    expect(container.querySelector('.pinfold-otp__slots')!.getAttribute('aria-hidden')).toBe('true');
    fireEvent.change(box, { target: { value: '12a3-45' } });
    expect(box.value).toBe('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect([...container.querySelectorAll('.pinfold-otp__slot')].map((s) => s.textContent)).toEqual(['1', '2', '3', '4']);
  });

  it('a whole code pasted over a partial one replaces it; no maxLength cuts the paste', () => {
    render(<Otp label="Code" defaultValue="12" />);
    const box = screen.getByRole('textbox') as HTMLInputElement;
    expect(box.hasAttribute('maxlength')).toBe(false);
    fireEvent.change(box, { target: { value: '12' + '987-654' } });
    expect(box.value).toBe('987654');
  });

  it('groups put a separator between boxes; mask shows dots', () => {
    const { container } = render(<Otp label="Code" groups={[3, 3]} mask defaultValue="12" />);
    expect(container.querySelectorAll('.pinfold-otp__separator')).toHaveLength(1);
    expect(container.querySelector('.pinfold-otp__slot')!.textContent).toBe('•');
  });

  it('focus shows the caret in the next box', () => {
    const { container } = render(<Otp label="Code" defaultValue="1" />);
    fireEvent.focus(screen.getByRole('textbox'));
    const active = container.querySelector('[data-active]')!;
    expect([...container.querySelectorAll('.pinfold-otp__slot')].indexOf(active)).toBe(1);
    expect(active.querySelector('.pinfold-otp__caret')).toBeTruthy();
  });

  it('a preset renders on the server', () => {
    const Code = defineOtp({ groups: [3, 3] });
    expect(renderToString(<Code label="Code" />)).toContain('one-time-code');
  });
});

describePinfoldConformance({
  name: 'slider',
  variants: false,
  slots: ['root', 'label', 'value', 'control', 'track', 'range', 'input', 'thumb', 'marks', 'mark', 'description', 'error'],
  dimension: { key: 'thickness', value: 6 },
  cssFile: 'packages/css/src/slider.css',
  meta: sliderMeta,
  preset: { define: defineSlider as any, props: { label: 'V' } },
  hook: { use: useSlider as any, config: { label: 'V' } },
  render: (config) => <Slider label="Volume" defaultValue={[40]} marks={[{ value: 0, label: '0' }, { value: 50 }]} description="Help" error="Bad" {...config} />,
});

describePinfoldConformance({
  name: 'number',
  inherits: ['size'],
  slots: ['root', 'label', 'control', 'input', 'decrement', 'increment', 'startContent', 'endContent', 'description', 'error'],
  dimension: { key: 'width', value: 180 },
  cssFile: 'packages/css/src/number.css',
  meta: numberMeta,
  preset: { define: defineNumberField as any, props: { label: 'N' } },
  hook: { use: useNumberField as any, config: { label: 'N' } },
  render: (config) => <NumberField label="Quantity" defaultValue={2} startContent="$" endContent="kg" description="Help" error="Bad" {...config} />,
});

describePinfoldConformance({
  name: 'otp',
  inherits: ['size'],
  slots: ['root', 'label', 'control', 'input', 'slots', 'slot', 'separator', 'description', 'error'],
  optionalSlots: ['caret'],
  dimension: { key: 'slotSize', value: 44 },
  cssFile: 'packages/css/src/otp.css',
  meta: otpMeta,
  preset: { define: defineOtp as any, props: { label: 'Code' } },
  hook: { use: useOtp as any, config: { label: 'Code' } },
  render: (config) => <Otp label="Code" groups={[3, 3]} defaultValue="12" description="Help" error="Bad" {...config} />,
});
