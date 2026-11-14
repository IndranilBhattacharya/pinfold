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

  it('checks a number against its range, and puts the range in the schema', async () => {
    const { tooltipMeta } = await import('./tooltip.meta');
    const messages = (config: Record<string, unknown>) => validateConfig(tooltipMeta, { content: 'Hi', trigger: { label: 'x' }, ...config }).map((p) => p.message);
    expect(messages({ offset: 12 })).toEqual([]);
    expect(messages({ offset: -4 }).some((m) => m.includes('`offset` must be at least 0 px, got -4.'))).toBe(true);
    expect(messages({ offset: 99 }).some((m) => m.includes('`offset` must be at most 48 px, got 99.'))).toBe(true);
    expect(messages({ offset: Number.NaN }).some((m) => m.includes('`offset` must be a number'))).toBe(true);
    const schema = toJsonSchema(tooltipMeta) as any;
    expect(schema.properties.offset).toMatchObject({ type: 'number', minimum: 0, maximum: 48 });
    // A Number field's value may be null (empty): no warning, and the schema says so.
    const { numberMeta } = await import('./number.meta');
    expect(validateConfig(numberMeta, { label: 'Qty', value: null }).map((p) => p.message)).toEqual([]);
    expect((toJsonSchema(numberMeta) as any).properties.value.type).toEqual(['number', 'null']);
  });

  it('gives every number option a range, and a control only where a page can show it', async () => {
    const metas = await import('./meta');
    for (const meta of metas.componentMetas) {
      for (const [key, p] of Object.entries(meta.props)) {
        if (p.type !== 'number') continue;
        expect(p.min, `${meta.name}.${key} min`).toBeTypeOf('number');
        expect(p.max, `${meta.name}.${key} max`).toBeTypeOf('number');
        expect(p.min!, `${meta.name}.${key} range`).toBeLessThan(p.max!);
        if (p.default !== undefined) {
          expect(p.default as number, `${meta.name}.${key} default in range`).toBeGreaterThanOrEqual(p.min!);
          expect(p.default as number, `${meta.name}.${key} default in range`).toBeLessThanOrEqual(p.max!);
        }
      }
    }
  });

  it('generates a JSON schema', () => {
    const schema = toJsonSchema(accordionMeta) as any;
    expect(schema.required).toEqual(['items']);
    expect(schema.properties.variant.enum).toContain('separated');
    expect(schema.properties.items.items.required).toEqual(['title']);
    expect(schema.additionalProperties).toBe(false);
  });
});
