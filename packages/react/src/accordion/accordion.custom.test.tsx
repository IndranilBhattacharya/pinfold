import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { resetWarnings } from '@pinfold/core';
import { Accordion } from './Accordion';

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnings();
});

describe('Accordion: custom header and content, events, nesting', () => {
  it('header: a node or a function of { open, disabled, toggle }; the indicator stays', () => {
    let toggle: (() => void) | undefined;
    const { container } = render(
      <Accordion
        items={[
          {
            id: 'a',
            title: 'Plain title',
            content: 'Body',
            header: (s) => {
              toggle = s.toggle;
              return <span>Custom {s.open ? 'open' : 'closed'}{s.disabled ? ' off' : ''}</span>;
            },
          },
          { id: 'b', title: 'B', header: <em>Node header</em>, content: 'B body' },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Custom closed' });
    expect(screen.queryByText('Plain title')).toBeNull();
    expect(trigger.querySelector('.pinfold-accordion__indicator')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Node header' })).toBeTruthy();
    fireEvent.click(trigger);
    expect(trigger.textContent).toContain('Custom open');
    React.act(() => toggle!());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelectorAll('[data-custom]')).toHaveLength(2);
  });

  it('startContent sits inside the trigger and is read; endContent sits outside it and keeps its own clicks', () => {
    const onEdit = vi.fn();
    render(<Accordion items={[{ id: 'a', title: 'Account', content: 'Body', startContent: <span>Avatar</span>, endContent: (s) => <button onClick={onEdit}>Edit {s.open ? 'open' : 'closed'}</button> }]} />);
    const trigger = screen.getByRole('button', { name: 'AvatarAccount' });
    const edit = screen.getByRole('button', { name: 'Edit closed' });
    expect(trigger.contains(edit)).toBe(false);
    expect(edit.closest('h3')).toBe(trigger.closest('h3'));
    expect(edit.parentElement!.className).toBe('pinfold-accordion__end-content');
    fireEvent.click(edit);
    expect(onEdit).toHaveBeenCalled();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('events: onValueChange, then onItemToggle, then the row\'s own onOpenChange', () => {
    const order: string[] = [];
    render(
      <Accordion
        onValueChange={(ids) => order.push('value ' + ids.join())}
        onItemToggle={(id, open) => order.push(`item ${id} ${open}`)}
        items={[{ id: 'a', title: 'A', content: 'x', onOpenChange: (open, d) => order.push(`own ${open} ${d.reason}`) }, { id: 'b', title: 'B', content: 'y' }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'A' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(order).toEqual(['value a', 'item a true', 'own true click', 'value b', 'item b true']);
  });

  it('nested accordions keep their own state and keyboard', () => {
    render(
      <Accordion
        mode="multiple"
        defaultValue={['outer']}
        items={[
          { id: 'outer', title: 'Outer', content: <Accordion items={[{ id: 'i1', title: 'Inner one', content: 'i1' }, { id: 'i2', title: 'Inner two', content: 'i2' }]} /> },
          { id: 'next', title: 'Next', content: 'n' },
        ]}
      />,
    );
    const inner = screen.getByRole('button', { name: 'Inner one' });
    fireEvent.click(inner);
    expect(inner.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Outer' }).getAttribute('aria-expanded')).toBe('true');
    inner.focus();
    fireEvent.keyDown(inner, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Inner two' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(inner);
    const outer = screen.getByRole('button', { name: 'Outer' });
    outer.focus();
    fireEvent.keyDown(outer, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next' }));
  });
});
