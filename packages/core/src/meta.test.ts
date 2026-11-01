// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { accordionMeta } from './accordion.meta';
import { toJsonSchema, validateConfig } from './meta';

describe('meta', () => {
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

  it('generates a JSON schema', () => {
    const schema = toJsonSchema(accordionMeta) as any;
    expect(schema.required).toEqual(['items']);
    expect(schema.properties.variant.enum).toContain('separated');
    expect(schema.properties.items.items.required).toEqual(['title']);
    expect(schema.additionalProperties).toBe(false);
  });
});
