import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { resetWarnings } from '@pinfold/core';
import { PinfoldProvider } from '@pinfold/react';
import { Button } from './Button';

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnings();
});

describe('Button', () => {
  it('is a native button of type "button" by default', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('data-variant')).toBe('solid');
  });

  it('passes native attributes and the ref through', () => {
    const ref = React.createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(<Button ref={ref} id="save" name="intent" value="save" type="submit" onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button');
    expect(ref.current).toBe(button);
    expect(button.id).toBe('save');
    expect(button.getAttribute('type')).toBe('submit');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stays focusable when disabled, and swallows clicks and form submits', () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" disabled onClick={onClick}>Send</Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Send' });
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a decorative spinner while loading, keeps the label, and announces loadingText', () => {
    const onClick = vi.fn();
    const { container, rerender } = render(<Button loading onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('data-loading')).toBe(true);
    const spinner = container.querySelector('.pinfold-button__spinner')!;
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.getAttribute('data-motion')).toBe('essential');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button loading loadingText="Saving">Save</Button>);
    expect(screen.getByRole('button', { name: 'Saving' })).toBeTruthy();
    rerender(<Button loadingText="Saving">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('renders a link for href, adding noopener noreferrer to new tabs', () => {
    render(<Button href="https://example.com" target="_blank" rel="external">Docs</Button>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toBe('external noopener noreferrer');
    expect(link.hasAttribute('type')).toBe(false);
  });

  it('a disabled link cannot navigate but stays focusable', () => {
    render(<Button href="/next" disabled>Next</Button>);
    const link = screen.getByRole('link', { name: 'Next' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('tabindex')).toBe('0');
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('is icon-only and square with an icon and no label, and warns without a name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container, rerender } = render(<Button icon={<svg />} />);
    const button = container.querySelector('button')!;
    expect(button.hasAttribute('data-icon-only')).toBe(true);
    expect(container.querySelector('.pinfold-button__icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('icon-only button needs `aria-label`'));

    warn.mockClear();
    resetWarnings();
    rerender(<Button icon={<svg />} aria-label="Delete" />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns about options with no effect', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Button href="/a" type="submit" variant="link" radius="full">A</Button>);
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('`type` has no effect'))).toBe(true);
    expect(messages.some((m) => m.includes('`radius` has no effect'))).toBe(true);
  });

  it('writes size and tone only when set, so the provider applies otherwise', () => {
    const { container } = render(
      <PinfoldProvider size="lg" tone="success">
        <Button>Inherit</Button>
        <Button size="sm" tone="danger">Own</Button>
      </PinfoldProvider>,
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.getAttribute('data-pinfold-size')).toBe('lg');
    expect(wrapper.getAttribute('data-pinfold-tone')).toBe('success');
    const [inherit, own] = screen.getAllByRole('button');
    expect(inherit.hasAttribute('data-size')).toBe(false);
    expect(inherit.hasAttribute('data-tone')).toBe(false);
    expect(own.getAttribute('data-size')).toBe('sm');
    expect(own.getAttribute('data-tone')).toBe('danger');
  });

  it('maps radius presets and lengths onto the radius variable', () => {
    const { container } = render(
      <>
        <Button radius="full">A</Button>
        <Button radius="lg">B</Button>
        <Button radius={20}>C</Button>
        <Button radius="lg" dimensions={{ radius: 4 }}>D</Button>
      </>,
    );
    const radius = (i: number) => (container.querySelectorAll('button')[i] as HTMLElement).style.getPropertyValue('--pinfold-button-radius');
    expect(radius(0)).toBe('var(--pinfold-radius-full)');
    expect(radius(1)).toBe('calc(var(--pinfold-control-radius-unit) * 1.5)');
    expect(radius(2)).toBe('20px');
    expect(radius(3)).toBe('4px');
  });

  it('swaps the root element through render.root, keeping behaviour props', () => {
    render(
      <Button href="/docs" render={{ root: ({ props, children }) => <a {...props} data-router="yes">{children}</a> }}>
        Docs
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.getAttribute('data-router')).toBe('yes');
    expect(link.getAttribute('href')).toBe('/docs');
    expect(link.classList.contains('pinfold-button')).toBe(true);
  });

  it('uses no hooks, so it renders where hooks cannot (Server Components)', () => {
    // Calling the render function outside React would throw "Invalid hook call" if it used one.
    const element = (Button as unknown as { render: (p: object, r: null) => React.ReactElement }).render({ children: 'Go', tone: 'info' }, null);
    expect(renderToString(element)).toContain('data-tone="info"');
  });
});

describePinfoldConformance({
  name: 'button',
  kind: 'atom',
  slots: ['root', 'icon', 'label', 'endIcon', 'spinner'],
  dimension: { key: 'paddingX', value: 24 },
  cssFile: 'packages/css/src/button.css',
  render: (config) => (
    <Button icon={<svg />} endIcon={<svg />} loading {...config}>
      Save
    </Button>
  ),
});
