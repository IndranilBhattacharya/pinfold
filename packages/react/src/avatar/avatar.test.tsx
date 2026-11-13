import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
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

  it('falls back from the picture to the initials, then to an icon; a custom fallback wins', () => {
    const status = vi.fn();
    const { container, rerender } = render(<Avatar name="Ada Lovelace" src="/ada.png" onLoadingStatusChange={status} />);
    expect(status).toHaveBeenLastCalledWith('loading');
    fireEvent.error(container.querySelector('img')!);
    expect(status).toHaveBeenLastCalledWith('error');
    expect(root(container).querySelector('.pinfold-avatar__fallback')!.getAttribute('data-fallback')).toBe('initials');
    rerender(<Avatar alt="Someone" initials="" />);
    expect(root(container).querySelector('[data-fallback="icon"] svg')).toBeTruthy();
    rerender(<Avatar alt="Bot" icon={<b>B</b>} initials="" />);
    expect(root(container).querySelector('[data-fallback="icon"]')!.textContent).toBe('B');
    rerender(<Avatar name="Ada" fallback={(s) => <i>{s.loading}</i>} />);
    const custom = root(container).querySelector('[data-fallback="custom"]')!;
    expect(custom.textContent).toBe('error');
  });

  it('reports a loaded picture', () => {
    const status = vi.fn();
    const { container } = render(<Avatar name="Ada" src="/ada.png" onLoadingStatusChange={status} />);
    fireEvent.load(container.querySelector('img')!);
    expect(status).toHaveBeenLastCalledWith('loaded');
  });

  it('shapes, preset and numeric sizes, ring and status placement reach the root', () => {
    const { container, rerender } = render(<Avatar name="Ada" shape="rounded" size="xl" ring status="online" statusPlacement="top-start" />);
    expect(root(container).getAttribute('data-shape')).toBe('rounded');
    expect(root(container).getAttribute('data-size')).toBe('xl');
    expect(root(container).getAttribute('data-ring')).toBe('auto');
    expect(root(container).getAttribute('data-status-placement')).toBe('top-start');
    rerender(<Avatar name="Ada" size={72} ring="danger" />);
    expect(root(container).hasAttribute('data-size')).toBe(false);
    expect(root(container).style.getPropertyValue('--pinfold-avatar-size')).toBe('72px');
    expect(root(container).getAttribute('data-ring')).toBe('danger');
  });

  it('colorFrom keeps the auto colour apart for two people with one name', () => {
    const a = render(<Avatar name="Alex" colorFrom="user-1" />);
    const tones = new Set<string | null>([root(a.container).getAttribute('data-tone')]);
    for (const id of ['user-2', 'user-3', 'user-4', 'user-5']) tones.add(root(render(<Avatar name="Alex" colorFrom={id} />).container).getAttribute('data-tone'));
    expect(tones.size).toBeGreaterThan(1);
  });

  it('onClick makes a face a named button, href a link', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Avatar name="Ada Lovelace" status="online" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Ada Lovelace, online' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Avatar name="Ada Lovelace" href="/u/ada" tooltip />);
    const link = screen.getByRole('link', { name: 'Ada Lovelace' });
    // Already focusable: no extra tabindex for the tooltip.
    expect(link.hasAttribute('tabindex')).toBe(false);
  });

  it('a group takes your own surplus, per-person clicks and expandOnHover', () => {
    const open = vi.fn();
    const { container } = render(<Avatar items={[{ name: 'Ada', onClick: open }, ...team]} max={2} expandOnHover label="Team" surplus={({ count, hidden }) => `${count}/${hidden.length}`} />);
    expect(root(container).hasAttribute('data-expand')).toBe(true);
    expect(screen.getByRole('img', { name: '6 more' }).textContent).toBe('6/6');
    fireEvent.click(screen.getByRole('button', { name: 'Ada' }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('a preset renders on the server', () => {
    const Person = defineAvatar({ size: 'lg', shape: 'square', statusPlacement: 'top-end' });
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
