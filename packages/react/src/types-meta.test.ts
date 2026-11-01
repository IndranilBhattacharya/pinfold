// @vitest-environment node
/**
 * Conformance: a component's public types and its meta describe the same options.
 *
 * The meta drives the docs, the JSON schema, the dev validator, the playground and the AI
 * files; the types drive IntelliSense and the compiler. If they drift, one of them lies. So,
 * per component: the option names must match (top level and nested shapes), and every
 * `@default` in the types must equal the meta's default, both ways.
 *
 * A new component adds one entry to COMPONENTS.
 */
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { accordionMeta, type ComponentMeta, type PropMeta } from '@pinfold/core/meta';

interface Entry {
  meta: ComponentMeta;
  /** The component's types file, relative to this folder. */
  file: string;
  /** Config interfaces whose options together equal `meta.props`. */
  configs: string[];
  /** Nested meta shapes and the interface that types them. */
  nested: Record<string, string>;
}

const COMPONENTS: Entry[] = [
  {
    meta: accordionMeta,
    file: 'accordion/types.ts',
    configs: ['AccordionConfig', 'AccordionMappedConfig'],
    nested: { items: 'AccordionItemConfig', dimensions: 'AccordionDimensions' },
  },
];

for (const c of COMPONENTS) {
  describe(`${c.meta.displayName}: types and meta agree`, () => {
    const file = resolve(import.meta.dirname, c.file);
    const program = ts.createProgram([file], { strict: true, jsx: ts.JsxEmit.React, noEmit: true, skipLibCheck: true });
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(file)!;
    const moduleSymbol = checker.getSymbolAtLocation(source)!;
    const exported = new Map(checker.getExportsOfModule(moduleSymbol).map((s) => [s.name, s]));

    const props = (name: string) => {
      const symbol = exported.get(name);
      if (!symbol) throw new Error(`${c.file} does not export ${name}`);
      return checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol));
    };
    const names = (symbols: ts.Symbol[]) => [...new Set(symbols.map((s) => s.name))].sort();
    const shape = (p: PropMeta) => p.keys ?? p.items ?? {};

    it('lists the same options', () => {
      expect(names(c.configs.flatMap(props))).toEqual(Object.keys(c.meta.props).sort());
    });

    for (const [key, type] of Object.entries(c.nested)) {
      it(`lists the same keys in \`${key}\` (${type})`, () => {
        expect(names(props(type))).toEqual(Object.keys(shape(c.meta.props[key])).sort());
      });
    }

    it('documents every default with @default, matching the meta', () => {
      const tagged: Record<string, unknown> = {};
      for (const symbol of c.configs.flatMap(props)) {
        const tag = symbol.getJsDocTags(checker).find((t) => t.name === 'default');
        if (tag) tagged[symbol.name] = JSON.parse(ts.displayPartsToString(tag.text).trim().replace(/'/g, '"'));
      }
      const fromMeta = Object.fromEntries(
        Object.entries(c.meta.props)
          .filter(([, p]) => p.default !== undefined)
          .map(([k, p]) => [k, p.default]),
      );
      expect(tagged).toEqual(fromMeta);
    });
  });
}
