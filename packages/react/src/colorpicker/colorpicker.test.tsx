import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { colorpickerMeta } from '@pinfold/core/meta';
import { ColorPicker } from './ColorPicker';
import { useColorPicker } from './useColorPicker';
import { defineColorPicker } from './define';

describe('Color picker', () => {
  it('a named group: the area is a slider reading both axes; hue and opacity are native ranges', () => {
    render(<ColorPicker label="Brand" defaultValue="#3366cc80" alpha />);
    screen.getByRole('group', { name: 'Brand' });
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' });
    expect(area.getAttribute('aria-valuetext')).toBe('saturation 75%, brightness 80%');
    expect((screen.getByRole('slider', { name: 'Hue' }) as HTMLInputElement).value).toBe('220');
    expect((screen.getByRole('slider', { name: 'Opacity' }) as HTMLInputElement).value).toBe('50');
    expect((screen.getByRole('textbox', { name: 'Hex' }) as HTMLInputElement).value).toBe('#3366cc80');
  });

  it('keys move the area; sliders change hue and opacity; onChange gets the value in the format and every form', () => {
    const onChange = vi.fn();
    render(<ColorPicker label="Brand" defaultValue="#3366cc" format="oklch" alpha onChange={onChange} />);
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' });
    fireEvent.keyDown(area, { key: 'Home' });
    expect(onChange.mock.lastCall![1].hex).toBe('#cccccc');
    fireEvent.keyDown(area, { key: 'End' });
    fireEvent.keyDown(area, { key: 'ArrowUp', shiftKey: true });
    expect(onChange.mock.lastCall![1].hex).toBe('#004de6');
    fireEvent.change(screen.getByRole('slider', { name: 'Hue' }), { target: { value: '0' } });
    expect(onChange.mock.lastCall![1].hex).toBe('#e60000');
    fireEvent.change(screen.getByRole('slider', { name: 'Opacity' }), { target: { value: '25' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.stringMatching(/^oklch\([\d.]+% [\d.]+ [\d.]+ \/ 0\.25\)$/), expect.objectContaining({ hex: '#e6000040', rgb: 'rgb(230 0 0 / 0.25)', alpha: 0.25 }));
  });

  it('the text field takes any CSS colour on Enter; an unknown one is invalid and reverts on leaving', () => {
    const onChange = vi.fn();
    render(<ColorPicker label="Brand" onChange={onChange} swatches={['#16a34a', 'tomato?']} />);
    const field = screen.getByRole('textbox', { name: 'Hex' }) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'hsl(0 100% 50%)' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('#ff0000', expect.anything());
    expect(field.value).toBe('#ff0000');
    fireEvent.change(field, { target: { value: 'not a colour' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    fireEvent.blur(field);
    expect(field.value).toBe('#ff0000');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '#16a34a' }));
    expect(screen.getByRole('button', { name: '#16a34a' }).getAttribute('aria-pressed')).toBe('true');
    expect(field.value).toBe('#16a34a');
  });

  it('a controlled value from outside moves it; a grey keeps the hue; disabled changes nothing', () => {
    const { rerender } = render(<ColorPicker label="Brand" value="#3366cc" />);
    rerender(<ColorPicker label="Brand" value="#808080" />);
    expect((screen.getByRole('slider', { name: 'Hue' }) as HTMLInputElement).value).toBe('220');
    const onChange = vi.fn();
    rerender(<ColorPicker label="Brand" value="#808080" disabled onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Saturation and brightness' }), { key: 'End' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders on the server, with a hidden input for forms', () => {
    const html = renderToString(React.createElement(defineColorPicker({ format: 'rgb' }), { label: 'C', defaultValue: '#336699', name: 'brand' }));
    expect(html).toContain('name="brand"');
    expect(html).toContain('value="rgb(51 102 153)"');
  });
});

describePinfoldConformance({
  name: 'colorpicker',
  variants: false,
  inherits: ['size'],
  slots: ['root', 'area', 'thumb', 'controls', 'hue', 'preview', 'field', 'input'],
  optionalSlots: ['alpha', 'eyedropper', 'swatches', 'swatchGroup', 'swatchLabel', 'swatch', 'description', 'error', 'statusIcon', 'validating'],
  cssFile: 'packages/css/src/colorpicker.css',
  meta: colorpickerMeta,
  preset: { define: defineColorPicker as any, props: { label: 'C' } },
  hook: { use: useColorPicker as any, config: { label: 'C' } },
  render: (config) => <ColorPicker label="C" {...config} />,
});
