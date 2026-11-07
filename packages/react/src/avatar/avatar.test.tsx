import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { avatarMeta } from '@pinfold/core/meta';
import { Avatar } from './Avatar';
import { useAvatar } from './useAvatar';
import { defineAvatar } from './define';

const root = (c: HTMLElement) => c.querySelector('.pinfold-avatar') as HTMLElement;
const team = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth'].map((name) => ({ name }));

describe('Avatar', () => {
  it('is one image named by the person, with initials underneath', () => {
    render(<Avatar name="Ada Lovelace" src="/ada.png" status="online" />);
    const img = screen.getByRole('img', { name: 'Ada Lovelace, online' });
    expect(img.querySelector('.pinfold-avatar__fallback')!.textContent).toBe('AL');
    expect(img.querySelector('img')!.getAttribute('alt')).toBe('');
    expect(img.querySelector('.pinfold-avatar__status')!.getAttribute('data-status')).toBe('online');
  });

  it('shows the picture once loaded and drops it if it fails', () => {
    const { container } = render(<Avatar name="Ada" src="/ada.png" />);
    fireEvent.load(container.querySelector('img')!);
    expect(root(container).hasAttribute('data-loaded')).toBe(true);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(root(container).textContent).toBe('A');
  });

  it('is decorative without a name; alt overrides the name', () => {
    const { container, rerender } = render(<Avatar />);
    expect(root(container).getAttribute('aria-hidden')).toBe('true');
    rerender(<Avatar name="Ada" alt="Your profile" />);
    expect(screen.getByRole('img', { name: 'Your profile' })).toBeTruthy();
  });

  it('keeps a stable auto tone per name, and honours a fixed tone', () => {
    const a = render(<Avatar name="Ada Lovelace" />);
    const b = render(<Avatar name="Ada Lovelace" />);
    expect(root(a.container).getAttribute('data-tone')).toBe(root(b.container).getAttribute('data-tone'));
    const c = render(<Avatar name="Ada" tone="danger" />);
    expect(root(c.container).getAttribute('data-tone')).toBe('danger');
  });

  it('stacks a group and folds the rest into +N', () => {
    render(<Avatar items={team} max={3} label="Project members" />);
    const group = screen.getByRole('group', { name: 'Project members' });
    expect(group.querySelectorAll('.pinfold-avatar__item')).toHaveLength(4);
    const more = screen.getByRole('img', { name: '4 more' });
    expect(more.textContent).toBe('+4');
    act(() => more.focus());
    expect(screen.getByRole('tooltip').textContent).toBe('Katherine Johnson, Edsger Dijkstra, Barbara Liskov, Donald Knuth');
  });

  it('tooltips are on in a group and opt-in on its own, and work from the keyboard', () => {
    const { rerender } = render(<Avatar name="Ada Lovelace" status="online" />);
    const face = screen.getByRole('img', { name: 'Ada Lovelace, online' });
    expect(face.hasAttribute('tabindex')).toBe(false);
    rerender(<Avatar name="Ada Lovelace" status="online" tooltip />);
    const focusable = screen.getByRole('img', { name: 'Ada Lovelace, online' });
    expect(focusable.getAttribute('tabindex')).toBe('0');
    act(() => focusable.focus());
    expect(screen.getByRole('tooltip').textContent).toBe('Ada Lovelace, online');
  });

  it('a preset renders on the server', () => {
    const Person = defineAvatar({ size: 'lg', shape: 'square' });
    const html = renderToString(<Person name="Ada Lovelace" src="/ada.png" />);
    expect(html).toContain('data-shape="square"');
    expect(html).toContain('src="/ada.png"');
  });
});

describePinfoldConformance({
  name: 'avatar',
  inherits: ['size'],
  variants: false,
  slots: ['root', 'image', 'fallback', 'status'],
  dimension: { key: 'size', value: 40 },
  cssFile: 'packages/css/src/avatar.css',
  meta: avatarMeta,
  preset: { define: defineAvatar as any, props: { name: 'Ada Lovelace' } },
  hook: { use: useAvatar as any, config: { name: 'Ada Lovelace' } },
  render: (config) => <Avatar name="Ada Lovelace" src="/ada.png" status="away" {...config} />,
});
