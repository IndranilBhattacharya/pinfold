/**
 * Keyboard-shortcut rules, framework-free. `mod` means Command on Apple platforms and Ctrl
 * elsewhere; on Apple platforms keys show as symbols, elsewhere as words. Every key keeps a
 * spoken name, so a symbol is never the only thing a screen reader gets.
 */

export type KbdOs = 'apple' | 'other';
export type KbdDisplay = 'auto' | 'symbols' | 'text';

interface KeyName {
  symbol: string;
  text: string;
  spoken: string;
}

const KEYS: Record<string, KeyName> = {
  cmd: { symbol: '⌘', text: 'Cmd', spoken: 'Command' },
  ctrl: { symbol: '⌃', text: 'Ctrl', spoken: 'Control' },
  alt: { symbol: '⌥', text: 'Alt', spoken: 'Alt' },
  shift: { symbol: '⇧', text: 'Shift', spoken: 'Shift' },
  enter: { symbol: '↵', text: 'Enter', spoken: 'Enter' },
  esc: { symbol: '⎋', text: 'Esc', spoken: 'Escape' },
  tab: { symbol: '⇥', text: 'Tab', spoken: 'Tab' },
  backspace: { symbol: '⌫', text: 'Backspace', spoken: 'Backspace' },
  delete: { symbol: '⌦', text: 'Del', spoken: 'Delete' },
  space: { symbol: '␣', text: 'Space', spoken: 'Space' },
  up: { symbol: '↑', text: '↑', spoken: 'Up arrow' },
  down: { symbol: '↓', text: '↓', spoken: 'Down arrow' },
  left: { symbol: '←', text: '←', spoken: 'Left arrow' },
  right: { symbol: '→', text: '→', spoken: 'Right arrow' },
  pageup: { symbol: '⇞', text: 'PgUp', spoken: 'Page up' },
  pagedown: { symbol: '⇟', text: 'PgDn', spoken: 'Page down' },
  home: { symbol: '↖', text: 'Home', spoken: 'Home' },
  end: { symbol: '↘', text: 'End', spoken: 'End' },
};

const ALIASES: Record<string, string> = {
  command: 'cmd', meta: 'cmd', '⌘': 'cmd', control: 'ctrl', option: 'alt', opt: 'alt', return: 'enter',
  escape: 'esc', del: 'delete', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
};

export interface FormattedKey {
  /** What is shown. */
  display: string;
  /** What a screen reader says. */
  spoken: string;
}

/** Turn `['mod', 'shift', 'k']` into shown and spoken parts for one platform. */
export function formatKeys(keys: readonly string[], os: KbdOs, display: KbdDisplay = 'auto'): FormattedKey[] {
  const symbols = display === 'symbols' || (display === 'auto' && os === 'apple');
  return keys.map((raw) => {
    let id = raw.trim().toLowerCase();
    if (id === 'mod') id = os === 'apple' ? 'cmd' : 'ctrl';
    id = ALIASES[id] ?? id;
    const known = KEYS[id];
    if (known) return { display: symbols ? known.symbol : known.text, spoken: known.spoken };
    // Letters and other keys: upper-case single characters, keep words as written.
    const shown = raw.length === 1 ? raw.toUpperCase() : raw;
    return { display: shown, spoken: shown };
  });
}

/** Apple platforms, from a user agent / platform string. Unknown (the server) is `other`. */
export function kbdOs(platform: string | undefined): KbdOs {
  return platform && /mac|iphone|ipad|ipod/i.test(platform) ? 'apple' : 'other';
}

export interface KbdAppearanceInput {
  display?: string;
  separator?: string;
}

/** Options with no visible effect in the current config. */
export function inactiveKbdOptions(config: KbdAppearanceInput & { os?: KbdOs }): Record<string, string> {
  const symbols = config.display === 'symbols' || (config.display !== 'text' && config.os === 'apple');
  return symbols ? { separator: 'symbols sit side by side (⌘K); the separator shows with `display: \'text\'`.' } : {};
}
