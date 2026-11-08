// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentMetas } from './meta';

const dir = join(__dirname, '../../../docs/components');
// Specs that live inside another one.
const within: Record<string, string> = { spinner: 'button' };

describe('component specs', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  it('every component has a spec', () => {
    for (const meta of componentMetas) expect(files, meta.name).toContain(`${within[meta.name] ?? meta.name}.md`);
  });
  it.each(files)('%s has one title and no repeated section', (file) => {
    const headings = readFileSync(join(dir, file), 'utf8')
      .split('\n')
      .filter((line) => /^#{1,2} /.test(line));
    expect(headings.filter((h) => h.startsWith('# ')), 'one title').toHaveLength(1);
    expect(new Set(headings).size, `repeated section in ${file}`).toBe(headings.length);
  });
});
