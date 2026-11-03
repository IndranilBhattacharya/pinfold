import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { kbdMeta } from '@pinfold/core/meta';
import { Kbd } from './Kbd';
import { useKbd } from './useKbd';
import { defineKbd } from './define';

const setPlatform = (platform: string) => Object.defineProperty(navigator, 'platform', { value: platform, configurable: true });
afterEach(() => setPlatform('Win32'));
/** What is shown on a key (a symbol or word whose spoken name is hidden text sits in an aria-hidden span). */
const shown = (key: Element) => key.querySelector('[aria-hidden="true"]')?.textContent ?? key.textContent;

describe('Kbd', () => {
  it('is a <kbd> holding one <kbd> per key, with words and separators elsewhere', () => {
    setPlatform('Win32');
    const { container } = render(<Kbd keys={['mod', 'shift', 'p']} />);
    const root = container.firstElementChild!;
    expect(root.tagName).toBe('KBD');
    expect([...root.querySelectorAll('kbd')].map(shown)).toEqual(['Ctrl', 'Shift', 'P']);
    // Abbreviations keep a spoken name: a screen reader hears Control, not C-T-R-L.
    expect(root.querySelector('kbd')!.textContent).toContain('Control');
    expect(root.querySelectorAll('.pinfold-kbd__separator')).toHaveLength(2);
    expect(root.getAttribute('data-os')).toBe('other');
  });

  it('shows symbols on Apple platforms, each with its spoken name', () => {
    setPlatform('MacIntel');
    const { container } = render(<Kbd keys={['mod', 'k']} />);
    const keys = [...container.querySelectorAll('kbd kbd')];
    expect(keys[0].querySelector('[aria-hidden="true"]')!.textContent).toBe('⌘');
    expect(keys[0].textContent).toContain('Command');
    expect(container.querySelectorAll('.pinfold-kbd__separator')).toHaveLength(0);
  });

  it('server and first client render agree (Ctrl), then an Apple device switches to ⌘ with no hydration error', async () => {
    setPlatform('Win32');
    const html = renderToString(<Kbd keys={['mod', 'k']} />);
    expect(html).toContain('Ctrl');
    setPlatform('MacIntel');
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      hydrateRoot(host, <Kbd keys={['mod', 'k']} />);
    });
    expect(host.textContent).toContain('⌘');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    host.remove();
  });

  it('display overrides the platform', () => {
    setPlatform('MacIntel');
    const { container } = render(<Kbd keys={['mod', 'k']} display="text" separator="-" />);
    expect([...container.querySelectorAll('kbd kbd')].map(shown)).toEqual(['Cmd', 'K']);
    expect(container.querySelector('.pinfold-kbd__separator')!.textContent).toBe('-');
  });

  it('a preset takes the keys at the use site', () => {
    const Shortcut = defineKbd({ size: 'sm', variant: 'solid' });
    const { container } = render(<Shortcut keys={['esc']} />);
    expect(container.firstElementChild!.getAttribute('data-size')).toBe('sm');
  });
});

describePinfoldConformance({
  name: 'kbd',
  inherits: ['size'],
  slots: ['root', 'key', 'separator'],
  dimension: { key: 'height', value: 28 },
  cssFile: 'packages/css/src/kbd.css',
  meta: kbdMeta,
  preset: { define: defineKbd as any, props: { keys: ['ctrl', 'k'] } },
  hook: { use: useKbd as any, config: { keys: ['k'] } },
  render: (config) => <Kbd keys={['ctrl', 'k']} {...config} />,
});
