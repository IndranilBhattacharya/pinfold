import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetWarnings } from '@pinfold/core';
import { PinfoldProvider, defineConfig } from '@pinfold/react';
import { Accordion } from './Accordion';
import { useAccordion } from './useAccordion';

const items = [
  { id: 'a', title: 'First', content: 'One' },
  { id: 'b', title: 'Second', content: 'Two', description: 'More' },
];
const triggers = () => screen.getAllByRole('button');
const panelOf = (trigger: HTMLElement) => document.getElementById(trigger.getAttribute('aria-controls')!)!;

afterEach(() => {
  resetWarnings();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/');
});

describe('Accordion features', () => {
  it('maps raw records with fields', () => {
    const rows = [{ slug: 'q1', question: 'Why?', answer: 'Because.' }];
    render(<Accordion items={rows} fields={{ id: 'slug', title: 'question', content: 'answer' }} defaultValue={['q1']} />);
    expect(screen.getByRole('button', { name: 'Why?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Because.')).toBeInTheDocument();
  });

  it('reports why the value changed', () => {
    const onValueChange = vi.fn();
    render(<Accordion items={items} onValueChange={onValueChange} />);
    fireEvent.click(triggers()[0], { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(['a'], expect.objectContaining({ id: 'a', open: true, reason: 'click' }));
    fireEvent.click(triggers()[1], { detail: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith(['b'], expect.objectContaining({ reason: 'keyboard' }));
  });

  it('lets onBeforeChange veto a change', () => {
    const onBeforeChange = vi.fn((d: { id?: string }) => d.id !== 'b');
    render(<Accordion items={items} onBeforeChange={onBeforeChange} />);
    fireEvent.click(triggers()[1]);
    expect(triggers()[1]).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(triggers()[0]);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('disables every row with root disabled, keeping them focusable', () => {
    render(<Accordion items={items} disabled />);
    fireEvent.click(triggers()[0]);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');
    expect(triggers()[0]).toHaveAttribute('aria-disabled', 'true');
    expect(triggers()[0]).not.toHaveAttribute('disabled');
  });

  it('mounts panels by policy', () => {
    const { unmount } = render(<Accordion items={items} mountPanels="open" />);
    expect(screen.queryByText('One')).toBeNull();
    unmount();
    render(<Accordion items={items} mountPanels="first-open" />);
    fireEvent.click(triggers()[0]);
    fireEvent.click(triggers()[0]);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.queryByText('Two')).toBeNull();
  });

  it('keeps unmountClosed working, with a deprecation warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Accordion items={items} unmountClosed />);
    expect(screen.queryByText('One')).toBeNull();
    await waitFor(() => expect(warn.mock.calls.flat().join(' ')).toMatch(/unmountClosed.*deprecated/));
  });

  it('marks closed panels hidden="until-found" and opens on beforematch', () => {
    const onValueChange = vi.fn();
    render(<Accordion items={items} onValueChange={onValueChange} animate={false} />);
    const inner = panelOf(triggers()[1]).firstElementChild as HTMLElement;
    expect(inner).toHaveAttribute('hidden', 'until-found');
    act(() => {
      inner.dispatchEvent(new Event('beforematch'));
    });
    expect(triggers()[1]).toHaveAttribute('aria-expanded', 'true');
    expect(inner).not.toHaveAttribute('hidden');
    expect(onValueChange).toHaveBeenLastCalledWith(['b'], expect.objectContaining({ reason: 'find-in-page' }));
  });

  it('skips until-found when turned off', () => {
    render(<Accordion items={items} hiddenUntilFound={false} />);
    expect(panelOf(triggers()[1]).firstElementChild).not.toHaveAttribute('hidden');
  });

  it('syncs with the URL hash', () => {
    history.replaceState(null, '', '/#b');
    render(<Accordion items={items} syncWithHash />);
    expect(triggers()[1]).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(triggers()[0], { detail: 1 });
    expect(location.hash).toBe('#a');
    act(() => {
      history.replaceState(null, '', '/#b');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(triggers()[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('flags panels while they transition', () => {
    vi.useFakeTimers();
    render(<Accordion items={items} />);
    fireEvent.click(triggers()[0]);
    expect(panelOf(triggers()[0])).toHaveAttribute('data-transition', 'opening');
    act(() => {
      vi.runAllTimers();
    });
    expect(panelOf(triggers()[0])).not.toHaveAttribute('data-transition');
    vi.useRealTimers();
  });

  it('applies the overflow policy to title and description', () => {
    render(<Accordion items={items} overflow={{ title: 'truncate' }} />);
    expect(screen.getByText('Second')).toHaveAttribute('data-overflow', 'truncate');
    const description = screen.getByText('More');
    expect(description).toHaveAttribute('data-overflow', 'clamp');
    expect(description.style.getPropertyValue('--pinfold-lines')).toBe('2');
  });

  it('applies global defaults below component config', () => {
    const config = defineConfig({ size: 'lg', defaults: { accordion: { variant: 'separated', dividers: false } } });
    render(
      <PinfoldProvider config={config}>
        <Accordion items={items} dividers />
      </PinfoldProvider>,
    );
    const root = document.querySelector('[data-pinfold="accordion"]')!;
    expect(root).toHaveAttribute('data-variant', 'separated');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-dividers');
  });

  it('lets a nested provider override its section', () => {
    render(
      <PinfoldProvider defaults={{ accordion: { variant: 'ghost', size: 'sm' } }}>
        <PinfoldProvider defaults={{ accordion: { variant: 'filled' } }}>
          <Accordion items={items} />
        </PinfoldProvider>
      </PinfoldProvider>,
    );
    const root = document.querySelector('[data-pinfold="accordion"]')!;
    expect(root).toHaveAttribute('data-variant', 'filled');
    expect(root).toHaveAttribute('data-size', 'sm');
  });

  it('validates config in development, for JS users', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Bad() {
      const Faq = useAccordion({ items, varient: 'solid', mode: 'many', animate: 'yes' } as any);
      return <Faq />;
    }
    render(<Bad />);
    await waitFor(() => expect(warn).toHaveBeenCalled());
    const out = warn.mock.calls.flat().join('\n');
    expect(out).toMatch(/unknown option `varient`. Did you mean `variant`\?/);
    expect(out).toMatch(/`mode` must be one of "single" \| "multiple"/);
    expect(out).toMatch(/`animate` must be true or false/);
  });

  it('warns about a row without a title', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Accordion items={[{ content: 'x' } as any]} />);
    await waitFor(() => expect(warn.mock.calls.flat().join('\n')).toMatch(/`items\[0\]\.title` is required/));
  });
});
