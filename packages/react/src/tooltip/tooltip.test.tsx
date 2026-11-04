import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { tooltipMeta } from '@pinfold/core/meta';
import { Tooltip } from './Tooltip';
import { useTooltip } from './useTooltip';
import { defineTooltip } from './define';

// jsdom caches `:focus-visible` matches across tests; the real check is covered in the browser report.
const matches = Element.prototype.matches;
beforeEach(() => {
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    return selector === ':focus-visible' ? true : matches.call(this, selector);
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Tooltip', () => {
  it('opens on hover after the delay and describes its trigger', () => {
    vi.useFakeTimers();
    render(<Tooltip content="Copies the link" trigger={{ label: 'Share' }} delay={100} />);
    const button = screen.getByRole('button', { name: 'Share' });
    fireEvent.pointerEnter(button, { pointerType: 'mouse' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => void vi.advanceTimersByTime(100));
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Copies the link');
    expect(button.getAttribute('aria-describedby')).toBe(tip.id);
  });

  it('stays while the pointer crosses onto it, then closes', () => {
    vi.useFakeTimers();
    render(<Tooltip content="Hint" trigger={{ label: 'Share' }} defaultOpen closeDelay={100} />);
    const button = screen.getByRole('button', { name: 'Share' });
    fireEvent.pointerLeave(button, { pointerType: 'mouse' });
    fireEvent.pointerEnter(screen.getByRole('tooltip'));
    act(() => void vi.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.pointerLeave(screen.getByRole('tooltip'));
    act(() => void vi.advanceTimersByTime(100));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('ignores touch hover; Escape closes it without moving focus', () => {
    vi.useFakeTimers();
    render(<Tooltip content="Hint" trigger={{ label: 'Share' }} delay={0} />);
    const button = screen.getByRole('button', { name: 'Share' });
    fireEvent.pointerEnter(button, { pointerType: 'touch' });
    act(() => void vi.advanceTimersByTime(500));
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => button.focus());
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('wraps any element, chaining its handlers', () => {
    const onFocus = vi.fn();
    render(<Tooltip content="Hint" trigger={<a href="/x" onFocus={onFocus}>Docs</a>} />);
    act(() => screen.getByRole('link').focus());
    expect(onFocus).toHaveBeenCalled();
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('never opens when disabled or empty', () => {
    render(<Tooltip content="Hint" defaultOpen disabled trigger={{ label: 'A' }} />);
    render(<Tooltip content="" defaultOpen trigger={{ label: 'B' }} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('attaches to your own element through getTriggerProps', () => {
    function Host() {
      const Tip = useTooltip({ content: 'Hint' });
      return (
        <>
          <button {...Tip.getTriggerProps()}>Own</button>
          <Tip />
        </>
      );
    }
    render(<Host />);
    act(() => screen.getByRole('button', { name: 'Own' }).focus());
    expect(screen.getByRole('tooltip').textContent).toBe('Hint');
  });

  it('renders no tooltip on the server', () => {
    const Hint = defineTooltip({ placement: 'bottom' });
    const html = renderToString(<Hint content="Hint" defaultOpen trigger={{ label: 'Share' }} />);
    expect(html).toContain('Share');
    expect(html).not.toContain('role="tooltip"');
  });
});

describePinfoldConformance({
  name: 'tooltip',
  inherits: [],
  slots: ['root', 'arrow'],
  dimension: { key: 'maxWidth', value: 200 },
  cssFile: 'packages/css/src/tooltip.css',
  meta: tooltipMeta,
  preset: { define: defineTooltip as any, props: { content: 'Hint', defaultOpen: true }, probe: { key: 'variant', values: ['surface', 'inverse', 'surface'] } },
  hook: { use: useTooltip as any, config: { content: 'Hint', defaultOpen: true } },
  render: (config) => <Tooltip content="Hint" defaultOpen trigger={{ label: 'Share' }} {...config} />,
});
