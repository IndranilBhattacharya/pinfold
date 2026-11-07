import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { toggleMeta, toolbarMeta } from '@pinfold/core/meta';
import { Toggle } from './Toggle';
import { useToggle } from './useToggle';
import { defineToggle } from './define';
import { Toolbar } from '../toolbar/Toolbar';
import { useToolbar } from '../toolbar/useToolbar';
import { defineToolbar } from '../toolbar/define';

const views = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board', disabled: true },
  { value: 'calendar', label: 'Calendar' },
];

describe('Toggle', () => {
  it('one toggle is a button with aria-pressed that reports its state', () => {
    const onChange = vi.fn();
    render(<Toggle label="Pin" onChange={onChange} />);
    const button = screen.getByRole('button', { name: 'Pin' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('icon only: the label stays as the name and the tooltip', () => {
    render(<Toggle label="Bold" icon={<svg />} iconOnly />);
    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button.getAttribute('title')).toBe('Bold');
    expect(button.textContent).toBe('');
  });

  it('a single selection is a named radiogroup; arrows select, and land on a disabled one without selecting it', () => {
    const onChange = vi.fn();
    render(<Toggle label="View" items={views} defaultValue={['list']} onChange={onChange} />);
    const group = screen.getByRole('radiogroup', { name: 'View' });
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[1]);
    expect(radios[1].getAttribute('aria-checked')).toBe('false');
    expect(radios[1].getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(radios[1]);
    expect(radios[1].getAttribute('aria-checked')).toBe('false');
    fireEvent.keyDown(radios[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[2]);
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenLastCalledWith(['calendar'], expect.anything());
    expect(group.getAttribute('data-selection')).toBe('single');
  });

  it('a single selection stays chosen unless allowEmpty', () => {
    const { rerender } = render(<Toggle label="View" items={views} defaultValue={['list']} />);
    fireEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByRole('radio', { name: 'List' }).getAttribute('aria-checked')).toBe('true');
    rerender(<Toggle label="View 2" items={views} defaultValue={['list']} allowEmpty />);
  });

  it('allowEmpty clears the selection', () => {
    render(<Toggle label="View" items={views} defaultValue={['list']} allowEmpty />);
    fireEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByRole('radio', { name: 'List' }).getAttribute('aria-checked')).toBe('false');
  });

  it('a multiple selection is a group of pressed buttons; arrows only move', () => {
    render(<Toggle label="Style" selection="multiple" items={views} name="style" />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[2]);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true']);
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'End' });
    expect(document.activeElement).toBe(buttons[2]);
    const hidden = document.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="style"]');
    expect([...hidden].map((h) => h.value)).toEqual(['list', 'calendar']);
  });

  it('the segmented pill is decorative and only in a single selection', () => {
    const { container, rerender } = render(<Toggle label="View" items={views} defaultValue={['list']} />);
    expect(container.querySelector('.pinfold-toggle__indicator')!.getAttribute('aria-hidden')).toBe('true');
    rerender(<Toggle label="View" items={views} selection="multiple" />);
    expect(container.querySelector('.pinfold-toggle__indicator')).toBeNull();
  });

  it('a preset renders on the server', () => {
    const View = defineToggle({ fullWidth: true });
    const html = renderToString(<View label="View" items={views} defaultValue={['calendar']} />);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('data-full-width');
  });
});

describe('Toolbar', () => {
  const items = [{ label: 'Previous' }, { label: 'Today', disabled: true }, { label: 'Next' }];

  it('is a named toolbar with one tab stop; arrows reach disabled buttons and stop at the ends', () => {
    render(<Toolbar label="Pages" items={items} />);
    expect(screen.getByRole('toolbar', { name: 'Pages' }).hasAttribute('data-attached')).toBe(true);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);
    fireEvent.keyDown(buttons[2], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2].tabIndex).toBe(0);
  });

  it('gives every button its look; an item\'s own config wins', () => {
    render(<Toolbar label="Edit" variant="ghost" items={[{ label: 'Cut' }, { label: 'Delete', tone: 'danger', variant: 'soft' }]} />);
    expect(screen.getByRole('button', { name: 'Cut' }).getAttribute('data-variant')).toBe('ghost');
    expect(screen.getByRole('button', { name: 'Delete' }).getAttribute('data-variant')).toBe('soft');
    expect(screen.getByRole('button', { name: 'Delete' }).getAttribute('data-tone')).toBe('danger');
  });
});

describePinfoldConformance({
  name: 'toggle',
  slots: ['root', 'label', 'items', 'item', 'indicator', 'text'],
  optionalSlots: ['icon'],
  dimension: { key: 'height', value: 36 },
  cssFile: 'packages/css/src/toggle.css',
  meta: toggleMeta,
  preset: { define: defineToggle as any, props: { label: 'View', items: views } },
  hook: { use: useToggle as any, config: { label: 'View', items: views } },
  // No disabled row: roving focus gives every other row tabindex -1 by design.
  render: (config) => <Toggle label="View" items={views.filter((v) => !v.disabled)} defaultValue={['list']} {...config} />,
});

describePinfoldConformance({
  name: 'toolbar',
  inherits: ['size'],
  slots: ['root', 'item'],
  dimension: { key: 'gap', value: 6 },
  cssFile: 'packages/css/src/toolbar.css',
  meta: toolbarMeta,
  preset: { define: defineToolbar as any, props: { label: 'Pages', items: [{ label: 'A' }] } },
  hook: { use: useToolbar as any, config: { label: 'Pages', items: [{ label: 'A' }] } },
  render: (config) => <Toolbar label="Pages" items={[{ label: 'A' }, { label: 'B' }]} {...config} />,
});
