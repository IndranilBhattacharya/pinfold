import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { inactiveTagsOptions } from '@pinfold/core';
import { Tags } from './Tags';

function Keywords(props: { selection?: 'none' | 'multiple'; onReorder?: boolean; delimiters?: string[] }) {
  const [words, setWords] = React.useState(['React', 'Vue', 'Svelte']);
  return (
    <Tags
      label="Keywords"
      items={words}
      selection={props.selection}
      delimiters={props.delimiters}
      onAdd={(t) => setWords((w) => [...w, t])}
      onRemove={(v) => setWords((w) => w.filter((x) => x !== v))}
      onEdit={(v, t) => setWords((w) => w.map((x) => (x === v ? t : x)))}
      onReorder={props.onReorder === false ? undefined : (next) => setWords(next)}
    />
  );
}
const order = () => Array.from(document.querySelectorAll('[data-tag-value]'), (el) => el.getAttribute('data-tag-value'));

describe('Tags: add, rename, reorder', () => {
  it('onAdd: Enter adds the trimmed text and clears the field; empty text adds nothing; delimiters and pastes split', () => {
    render(<Keywords delimiters={[',']} />);
    const field = screen.getByRole('textbox', { name: 'Add tag' });
    fireEvent.change(field, { target: { value: '  Solid ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(order()).toEqual(['React', 'Vue', 'Svelte', 'Solid']);
    expect((field as HTMLInputElement).value).toBe('');
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(order()).toHaveLength(4);
    fireEvent.change(field, { target: { value: 'Qwik' } });
    fireEvent.keyDown(field, { key: ',' });
    expect(order()).toContain('Qwik');
    fireEvent.paste(field, { clipboardData: { getData: () => 'Lit, Preact,' } });
    expect(order()).toEqual(['React', 'Vue', 'Svelte', 'Solid', 'Qwik', 'Lit', 'Preact']);
  });

  it('Backspace in the empty add field goes back to the last tag', () => {
    render(<Keywords />);
    const field = screen.getByRole('textbox', { name: 'Add tag' });
    field.focus();
    fireEvent.keyDown(field, { key: 'Backspace' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Svelte' }));
  });

  it('onEdit (tags to read): the text is a rename button; Enter keeps, Escape cancels, focus comes back', () => {
    render(<Keywords />);
    fireEvent.click(screen.getByRole('button', { name: 'Rename Vue' }));
    const edit = screen.getByRole('textbox', { name: 'Rename Vue' });
    fireEvent.change(edit, { target: { value: 'Vue 3' } });
    fireEvent.keyDown(edit, { key: 'Enter' });
    expect(order()).toEqual(['React', 'Vue 3', 'Svelte']);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Rename Vue 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename React' }));
    const again = screen.getByRole('textbox', { name: 'Rename React' });
    fireEvent.change(again, { target: { value: 'Nope' } });
    fireEvent.keyDown(again, { key: 'Escape' });
    expect(order()[0]).toBe('React');
  });

  it('onEdit (tags to pick): F2 renames the focused option, and the edit keys stay in the field', () => {
    render(<Keywords selection="multiple" />);
    const vue = screen.getByRole('option', { name: 'Vue' });
    vue.focus();
    fireEvent.keyDown(vue, { key: 'F2' });
    const edit = screen.getByRole('textbox', { name: 'Rename Vue' });
    fireEvent.change(edit, { target: { value: 'Nuxt' } });
    fireEvent.keyDown(edit, { key: ' ' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('false');
    fireEvent.keyDown(edit, { key: 'Enter' });
    expect(order()).toEqual(['React', 'Nuxt', 'Svelte']);
    expect(screen.getByRole('option', { name: 'Nuxt' }).getAttribute('aria-keyshortcuts')).toBe('Delete F2 Alt+ArrowLeft Alt+ArrowRight');
  });

  it('onReorder: Alt + arrow moves a tag and keeps focus on it, announced politely', () => {
    render(<Keywords />);
    const remove = screen.getByRole('button', { name: 'Remove React' });
    remove.focus();
    fireEvent.keyDown(remove, { key: 'ArrowRight', altKey: true });
    expect(order()).toEqual(['Vue', 'React', 'Svelte']);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove React' }));
    expect(screen.getByRole('status').textContent).toBe('React: 2 of 3');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Remove React' }), { key: 'ArrowLeft', altKey: true });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Remove React' }), { key: 'ArrowLeft', altKey: true });
    expect(order()).toEqual(['React', 'Vue', 'Svelte']);
  });

  it('onReorder: a drag and a drop', () => {
    const onReorder = vi.fn();
    render(<Tags label="Order" items={['a', 'b', 'c']} onReorder={onReorder} />);
    const [a, , c] = Array.from(document.querySelectorAll<HTMLElement>('[data-tag-value]'));
    expect(a.getAttribute('draggable')).toBe('true');
    fireEvent.dragStart(a, { dataTransfer: { setData: () => undefined } });
    fireEvent.dragOver(c);
    expect(c.hasAttribute('data-drop')).toBe(true);
    fireEvent.drop(c);
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a'], expect.anything());
  });

  it('inactive options are reported', () => {
    expect(inactiveTagsOptions({})).toMatchObject({ addLabel: expect.any(String), delimiters: expect.any(String), editLabel: expect.any(String) });
    expect(inactiveTagsOptions({ selection: 'multiple', onEdit: () => {} })).not.toHaveProperty('removeHint');
  });
});
