import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Accordion } from './Accordion';

const items = [
  { id: 'a', title: 'First', content: 'One' },
  { id: 'b', title: 'Second', content: 'Two' },
  { id: 'c', title: 'Third', content: 'Three', disabled: true },
];

const triggers = () => screen.getAllByRole('button');

describe('Accordion', () => {
  it('wires the ARIA accordion pattern', () => {
    render(<Accordion items={items} defaultValue={['a']} headingLevel={2} />);
    const [first] = triggers();

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);

    const panel = document.getElementById(first.getAttribute('aria-controls')!)!;
    expect(panel).toHaveAttribute('role', 'region');
    expect(panel).toHaveAttribute('aria-labelledby', first.id);
    expect(panel).toHaveAttribute('data-state', 'open');
  });

  it('closes siblings in single mode and reopens on demand', () => {
    const onValueChange = vi.fn();
    render(<Accordion items={items} defaultValue={['a']} onValueChange={onValueChange} />);
    const [first, second] = triggers();

    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(onValueChange).toHaveBeenLastCalledWith(['b']);
  });

  it('keeps several rows open in multiple mode', () => {
    render(<Accordion items={items} mode="multiple" />);
    const [first, second] = triggers();

    fireEvent.click(first);
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('refuses to close the last row when collapsible is false', () => {
    render(<Accordion items={items} defaultValue={['a']} collapsible={false} />);
    const [first] = triggers();

    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('ignores disabled rows but keeps them focusable', () => {
    render(<Accordion items={items} />);
    const third = triggers()[2];

    expect(third).toHaveAttribute('aria-disabled', 'true');
    expect(third).not.toHaveAttribute('disabled');
    fireEvent.click(third);
    expect(third).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus with Arrow, Home and End keys', () => {
    render(<Accordion items={items} />);
    const [first, second, third] = triggers();

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: 'End' });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(third, { key: 'ArrowDown' }); // loops
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(third, { key: 'Home' });
    expect(document.activeElement).toBe(first);
  });

  it('honours controlled value and slot overrides', () => {
    const { rerender } = render(
      <Accordion
        items={items}
        value={[]}
        classNames={{ trigger: 'my-trigger' }}
        slotProps={{ root: { 'data-testid': 'root' } }}
      />,
    );
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');
    expect(triggers()[0].className).toContain('my-trigger');
    expect(screen.getByTestId('root')).toBeTruthy();

    // Controlled: clicking cannot change state without a prop update.
    fireEvent.click(triggers()[0]);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');

    rerender(<Accordion items={items} value={['b']} />);
    expect(triggers()[1]).toHaveAttribute('aria-expanded', 'true');
  });
});
