import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { resetWarnings } from '@pinfold/core';
import { buttonMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '@pinfold/react';
import { Button } from './Button';
import { useButton } from './useButton';
import { defineButton } from './define';
import type { ButtonConfig } from './types';

afterEach(() => {
  vi.restoreAllMocks();
  resetWarnings();
});

function Hook(config: ButtonConfig & { onApi?: (api: ReturnType<typeof useButton>) => void }) {
  const { onApi, ...rest } = config;
  const Save = useButton(rest);
  onApi?.(Save);
  return <Save />;
}

describe('Button', () => {
  it('renders from one config object: a native button of type "button"', () => {
    render(<Hook label="Save" />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('data-variant')).toBe('solid');
    expect(button.getAttribute('data-size')).toBe('md');
    expect(button.getAttribute('data-tone')).toBe('primary');
  });

  it('takes element attributes on the returned component', () => {
    function Demo() {
      const Send = useButton({ label: 'Send', type: 'submit' });
      return <Send form="f" name="intent" value="send" className="mt-4" data-track="send" />;
    }
    render(<Demo />);
    const button = screen.getByRole('button', { name: 'Send' });
    expect(button.getAttribute('form')).toBe('f');
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.classList.contains('mt-4')).toBe(true);
    expect(button.classList.contains('pinfold-button')).toBe(true);
    expect(button.getAttribute('data-track')).toBe('send');
  });

  it('stays focusable when disabled, and swallows clicks and form submits', () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Hook label="Send" type="submit" disabled onClick={onClick} />
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

  it('keeps the label visible while loading, with the spinner in the icon slot', () => {
    const { container, rerender } = render(<Hook label="Save" icon={<svg data-icon />} loading />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(container.querySelector('.pinfold-button__label')!.textContent).toBe('Save');
    expect(container.querySelector('[data-icon]')).toBeNull();
    const spinner = container.querySelector('.pinfold-button__spinner')!;
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.getAttribute('data-motion')).toBe('essential');

    rerender(<Hook label="Save" loading loadingText="Saving…" />);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeTruthy();
    rerender(<Hook label="Save" loadingText="Saving…" />);
    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('shows the loading state while an async onClick runs, then clears it', async () => {
    let finish!: () => void;
    const onClick = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<Hook label="Save" loadingText="Saving…" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: 'Saving…' }).getAttribute('aria-busy')).toBe('true');
    // A second click while pending is swallowed.
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('is a controller: loading, setLoading, focus and click', () => {
    let api!: ReturnType<typeof useButton>;
    const onClick = vi.fn();
    render(<Hook label="Go" onClick={onClick} onApi={(a) => (api = a)} />);
    act(() => api.setLoading(true));
    expect(api.loading).toBe(true);
    act(() => api.setLoading(false));
    act(() => api.focus());
    expect(document.activeElement).toBe(screen.getByRole('button'));
    act(() => api.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a link for href, adding noopener noreferrer to new tabs', () => {
    render(<Hook label="Docs" href="https://example.com" target="_blank" rel="external" />);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toBe('external noopener noreferrer');
    expect(link.hasAttribute('type')).toBe(false);
  });

  it('a disabled link cannot navigate but stays focusable', () => {
    render(<Hook label="Next" href="/next" disabled />);
    const link = screen.getByRole('link', { name: 'Next' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('tabindex')).toBe('0');
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('icon-only: the label becomes the accessible name and the tooltip', () => {
    const { container } = render(<Hook label="Delete" icon={<svg />} iconOnly endIcon={<svg data-end />} />);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.hasAttribute('data-icon-only')).toBe(true);
    expect(button.getAttribute('title')).toBe('Delete');
    expect(container.querySelector('.pinfold-button__label')).toBeNull();
    expect(container.querySelector('[data-end]')).toBeNull();
    expect(container.querySelector('.pinfold-button__icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('warns about options with no effect and about config mistakes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Hook label="A" href="/a" type="submit" variant="link" radius="full" />);
    render(<Hook {...({ label: 'B', varient: 'soft' } as unknown as ButtonConfig)} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('`type` has no visible effect'))).toBe(true);
    expect(messages.some((m) => m.includes('`radius` has no visible effect'))).toBe(true);
    expect(messages.some((m) => m.includes('Did you mean `variant`?'))).toBe(true);
  });

  it('component config beats defaults.button, which beats the provider', () => {
    render(
      <PinfoldProvider size="sm" defaults={{ button: { size: 'lg', variant: 'soft' } }}>
        <Hook label="Defaults" />
        <Hook label="Own" size="md" variant="outline" />
      </PinfoldProvider>,
    );
    const [fromDefaults, own] = screen.getAllByRole('button');
    expect(fromDefaults.getAttribute('data-size')).toBe('lg');
    expect(fromDefaults.getAttribute('data-variant')).toBe('soft');
    expect(own.getAttribute('data-size')).toBe('md');
    expect(own.getAttribute('data-variant')).toBe('outline');
  });

  it('maps radius presets and lengths onto the radius variable', () => {
    const { container } = render(
      <>
        <Button label="A" radius="full" />
        <Button label="B" radius="lg" />
        <Button label="C" radius={20} />
        <Button label="D" radius="lg" dimensions={{ radius: 4 }} />
      </>,
    );
    const radius = (i: number) => (container.querySelectorAll('button')[i] as HTMLElement).style.getPropertyValue('--pinfold-button-radius');
    expect(radius(0)).toBe('var(--pinfold-radius-full)');
    expect(radius(1)).toBe('calc(var(--pinfold-control-radius-unit) * 1.5)');
    expect(radius(2)).toBe('20px');
    expect(radius(3)).toBe('4px');
  });

  it('swaps the root element through render.root, keeping behaviour props', () => {
    render(<Hook label="Docs" href="/docs" render={{ root: ({ props, children }) => <a {...props} data-router="yes">{children}</a> }} />);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.getAttribute('data-router')).toBe('yes');
    expect(link.getAttribute('href')).toBe('/docs');
  });

  it('defineButton renders the same button with no hook in the caller (Server Components)', () => {
    const Docs = defineButton({ label: 'Docs', href: '/docs', variant: 'soft' });
    const html = renderToString(<Docs className="x" />);
    expect(html).toContain('href="/docs"');
    expect(html).toContain('data-variant="soft"');
    expect(html).toContain('>Docs<');
  });

  it('a preset is defined once and used in one line, in loops, with its own handler per row', () => {
    const Danger = defineButton({ variant: 'soft', tone: 'danger', iconOnly: true, icon: <svg /> });
    const removed: string[] = [];
    const rows = ['a', 'b', 'c'];
    render(
      <>
        {rows.map((id) => (
          <Danger key={id} label={`Delete ${id}`} onClick={() => removed.push(id)} />
        ))}
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete b' }));
    expect(removed).toEqual(['b']);
    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('data-variant')).toBe('soft');
      expect(button.getAttribute('data-tone')).toBe('danger');
    }
  });

  it('use-site props win over the preset; element attributes reach the root', () => {
    const Quiet = defineButton({ variant: 'ghost', tone: 'neutral', dimensions: { paddingX: 10, gap: 4 } });
    render(<Quiet label="Go" variant="outline" dimensions={{ paddingX: 20 }} form="f" aria-describedby="hint" />);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button.getAttribute('data-variant')).toBe('outline');
    expect(button.getAttribute('data-tone')).toBe('neutral');
    expect(button.style.getPropertyValue('--pinfold-button-padding-x')).toBe('20px');
    expect(button.style.getPropertyValue('--pinfold-button-gap')).toBe('4px');
    expect(button.getAttribute('form')).toBe('f');
    expect(button.getAttribute('aria-describedby')).toBe('hint');
    expect(Quiet.config).toEqual({ variant: 'ghost', tone: 'neutral', dimensions: { paddingX: 10, gap: 4 } });
  });

  it('the tag passes element attributes through and keeps config out of the DOM', () => {
    render(<Button label="Go" tone="info" name="intent" value="go" />);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button.getAttribute('name')).toBe('intent');
    expect(button.hasAttribute('tone')).toBe(false);
    expect(button.hasAttribute('label')).toBe(false);
  });
});

describePinfoldConformance({
  name: 'button',
  slots: ['root', 'icon', 'label', 'endIcon', 'spinner'],
  // Loading replaces the icon with the spinner, so one of them is always absent.
  optionalSlots: ['icon', 'spinner'],
  dimension: { key: 'paddingX', value: 24 },
  cssFile: 'packages/css/src/button.css',
  meta: buttonMeta,
  preset: { define: defineButton as any, props: { label: 'Save' } },
  hook: { use: useButton as any, config: { label: 'Save' } },
  render: (config) => <Button label="Save" icon={<svg />} endIcon={<svg />} {...config} />,
});
