import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * React APIs that are removed, deprecated or unsafe in React 19+, plus the
 * react-dom import components must never make (keeps non-DOM renderers viable).
 * A grep, not a linter: zero config, and it fails loudly with the file name.
 */
const BANNED: Array<[string, RegExp]> = [
  ['defaultProps (removed for function components in React 19)', /\.defaultProps\b/],
  ['propTypes (removed in React 19)', /\.propTypes\b/],
  ['legacy context (contextTypes / childContextTypes)', /\b(contextTypes|childContextTypes|getChildContext)\b/],
  ['findDOMNode (removed in React 19)', /\bfindDOMNode\b/],
  ['string refs (removed in React 19)', /\bref=["']/],
  ['UNSAFE_ lifecycles', /\bUNSAFE_\w+/],
  ['react-dom import inside components', /from\s+['"]react-dom(\/[^'"]*)?['"]/],
];

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'fixtures' ? [] : sources(path);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [path] : [];
  });
}

describe('banned React APIs', () => {
  const files = sources('packages/react/src');
  for (const [label, pattern] of BANNED) {
    it(`no ${label}`, () => {
      expect(files.filter((f) => pattern.test(readFileSync(f, 'utf8')))).toEqual([]);
    });
  }
});
