import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { PinfoldProvider } from './provider';
import { Accordion } from './accordion/lazy';

const items = [{ title: 'Lazy row', content: 'Body' }];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('lazy entry', () => {
  it('loads eagerly under auto (the accordion is light)', async () => {
    render(<Accordion items={items} />);
    expect(await screen.findByRole('button', { name: 'Lazy row' })).toBeInTheDocument();
  });

  it('waits for visibility under lazy="visible"', async () => {
    let fire: (entries: Array<{ isIntersecting: boolean }>) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof fire) {
          fire = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<Accordion items={items} lazy="visible" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelector('[data-pinfold-lazy]')).not.toBeNull();
    act(() => fire([{ isIntersecting: true }]));
    expect(await screen.findByRole('button', { name: 'Lazy row' })).toBeInTheDocument();
  });

  it('takes the strategy from the provider', async () => {
    const callbacks: Array<() => void> = [];
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => callbacks.push(cb));
    render(
      <PinfoldProvider lazy="idle">
        <Accordion items={items} />
      </PinfoldProvider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    act(() => callbacks.forEach((cb) => cb()));
    expect(await screen.findByRole('button', { name: 'Lazy row' })).toBeInTheDocument();
  });
});
