// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { accordionMeta } from './accordion.meta';
import * as metas from './meta';
import { toJsonSchema, validateConfig } from './meta';

describe('meta', () => {
  it('lists every component meta in componentMetas (registry, schema, llms.txt and MCP read it)', () => {
    const exported = Object.entries(metas).filter(([k, v]) => k.endsWith('Meta') && typeof v === 'object' && v && 'props' in v).map(([, v]) => v);
    expect(exported.length).toBeGreaterThan(20);
    for (const m of exported) expect(metas.componentMetas).toContain(m);
  });

  it('accepts a valid config with extra data on rows', () => {
    expect(validateConfig(accordionMeta, { items: [{ title: 'A', category: 'x' }], variant: 'ghost', dimensions: { paddingX: 12 } })).toEqual([]);
  });

  it('reports typos, wrong types and bad enums', () => {
    const messages = validateConfig(accordionMeta, { items: [{ titel: 'A' }], size: 'xl', loop: 1 }).map((p) => p.message);
    expect(messages).toContain('Accordion: `items[0].title` is required.');
    expect(messages).toContain('Accordion: unknown option `items[0].titel`. Did you mean `items[0].title`?');
    expect(messages.some((m) => m.includes('`size` must be one of'))).toBe(true);
    expect(messages.some((m) => m.includes('`loop` must be true or false'))).toBe(true);
  });

  it('hints only at likely typos: one edit, letters swapped, or two edits in a long key', () => {
    const hint = (row: Record<string, unknown>) => validateConfig(accordionMeta, { items: [{ title: 'A', ...row }] }).map((p) => p.message);
    // Two edits between short words is another word: extra row data, not a misspelling.
    expect(hint({ role: 'Engineer' })).toEqual([]);
    // One edit, and the same letters swapped round, are typos.
    expect(hint({ contnt: 'x' })).toContain('Accordion: unknown option `items[0].contnt`. Did you mean `items[0].content`?');
    expect(validateConfig(accordionMeta, { items: [{ titel: 'A' }] }).map((p) => p.message)).toContain('Accordion: unknown option `items[0].titel`. Did you mean `items[0].title`?');
    // Two edits in a long key.
    expect(validateConfig(accordionMeta, { items: [], defaultVlaue: ['a'] }).map((p) => p.message)).toContain('Accordion: unknown option `defaultVlaue`. Did you mean `defaultValue`?');
  });

  it('generates a JSON schema', () => {
    const schema = toJsonSchema(accordionMeta) as any;
    expect(schema.required).toEqual(['items']);
    expect(schema.properties.variant.enum).toContain('separated');
    expect(schema.properties.items.items.required).toEqual(['title']);
    expect(schema.additionalProperties).toBe(false);
  });
});
