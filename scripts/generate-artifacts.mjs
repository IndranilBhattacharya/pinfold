#!/usr/bin/env node
/**
 * Generate what ships inside @pinfold/react next to the code (D-15, D-17),
 * all from component meta, so none of it can drift from the API:
 *
 *   registry/registry.json     shadcn registry index (namespace @pinfold)
 *   registry/<name>.json       shadcn registry item: components/ui/<name>.tsx
 *   schema/<name>.json         JSON Schema of the config
 *   llms.txt, llms-full.txt    model-readable docs, matching the installed version
 *
 * Runs after the core build (it reads @pinfold/core/meta from dist). The site
 * serves these same files; jsDelivr serves them from npm as a fallback.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'packages/react');
const load = (p) => import(pathToFileURL(join(root, p)).href);
const { componentMetas, metaToMarkdown, toJsonSchema } = await load('packages/core/dist/meta.js');
const { componentFile } = await load('packages/cli/lib/commands.mjs');
const { version } = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'));
const SITE = 'https://pinfold.indranildev.in';
const json = (v) => JSON.stringify(v, null, 2) + '\n';

for (const dir of ['registry', 'schema']) {
  rmSync(join(out, dir), { recursive: true, force: true });
  mkdirSync(join(out, dir));
}

const items = componentMetas.map((meta) => {
  // App code may import CSS (unlike the library), so the registry file brings its styles along.
  const content = `import '@pinfold/css/core.css';\nimport '@pinfold/css/${meta.name}.css';\n\n${componentFile(meta.name, 'ts')}`;
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: meta.name,
    type: 'registry:ui',
    title: meta.displayName,
    description: meta.description,
    dependencies: [`@pinfold/react@^${version}`, `@pinfold/css@^${version}`],
    files: [{ path: `components/ui/${meta.name}.tsx`, type: 'registry:ui', target: `components/ui/${meta.name}.tsx`, content }],
    docs: `${SITE}/docs/${meta.name}`,
  };
});

for (const item of items) writeFileSync(join(out, 'registry', `${item.name}.json`), json(item));
writeFileSync(
  join(out, 'registry', 'registry.json'),
  json({
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'pinfold',
    homepage: SITE,
    items: items.map(({ $schema, ...item }) => ({ ...item, files: item.files.map(({ content, ...f }) => f) })),
  }),
);
for (const meta of componentMetas) writeFileSync(join(out, 'schema', `${meta.name}.json`), json(toJsonSchema(meta)));

const intro = [
  '# Pinfold',
  '',
  `> Hooks-first, config-driven, accessible React UI (v${version}). One config object in, an accessible, themed, responsive component out. React 18+, Server Components, plain JS or TypeScript.`,
  '',
  'Rules for generating Pinfold code:',
  '- Data goes in `items` (or raw records plus `fields`); everything else is optional with good defaults.',
  "- Client: `const Faq = useAccordion({ items }); return <Faq />`. Server Component: `const Faq = defineAccordion({ items }); return <Faq />`. Same import path.",
  "- Styles: `import '@pinfold/css/core.css'` once, then `@pinfold/css/<name>.css` per component, in the app entry. Never import CSS from library code.",
  '- Global defaults: `defineConfig({ theme, radius, stylePack, defaults: { <name>: {...} } })` passed to `<PinfoldProvider config>`.',
  '- Customise in this order: config, then `classNames`/`styles`/`slotProps`, then `render` per slot, then parts (`<Faq.Panel id>`), then prop getters.',
  '- Never pass functions from a Server Component; plain data and server-rendered JSX only.',
  '',
  '## Install',
  '',
  '- `npx pinfold init` (or `npm i @pinfold/react @pinfold/css`)',
  '- shadcn: `npx shadcn add @pinfold/<name>` with `"registries": { "@pinfold": "' + SITE + '/r/{name}.json" }` in components.json',
  '',
];

writeFileSync(
  join(out, 'llms.txt'),
  [
    ...intro,
    '## Components',
    '',
    ...componentMetas.map((m) => `- [${m.displayName}](${SITE}/docs/${m.name}): ${m.description} Import \`${m.importPath}\`. Schema: \`schema/${m.name}.json\`.`),
    '',
    '## Reference',
    '',
    `- [Full reference](${SITE}/llms-full.txt): every option of every component (also \`llms-full.txt\` in this package)`,
    `- [Theming](${SITE}/docs/theming): \`npx pinfold theme\`, style packs (glass, bauhaus, brutalist, noise, soft), DTCG tokens`,
    '- Local MCP server: `npx pinfold mcp` (tools: list_components, get_component, get_schema, validate_config, get_install_steps)',
    '',
  ].join('\n'),
);
writeFileSync(join(out, 'llms-full.txt'), [...intro, ...componentMetas.map(metaToMarkdown)].join('\n'));

console.log(`  generated registry, schema and llms docs for ${componentMetas.length} component(s)`);
