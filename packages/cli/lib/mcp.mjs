/** `npx pinfold mcp`: a local Model Context Protocol server over stdio (newline-delimited JSON-RPC 2.0). */
import { createInterface } from 'node:readline';
import { componentMetas, metaToMarkdown, toJsonSchema, validateConfig } from '@pinfold/core/meta';
import { stylesFor } from './commands.mjs';

const VERSION = '1.2.2';
const byName = (name) => componentMetas.find((m) => m.name === name);
const names = () => componentMetas.map((m) => m.name);
const nameArg = { type: 'object', properties: { name: { type: 'string', enum: names() } }, required: ['name'] };

const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Components ranked by how well their name, title and description match the words of a query. */
export function searchComponents(query) {
  const words = fold(query).split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return [];
  return componentMetas
    .map((m) => {
      const name = fold(`${m.name} ${m.displayName}`);
      const text = fold(`${m.description} ${Object.keys(m.props).join(' ')}`);
      const score = words.reduce((s, w) => s + (name.includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0), 0);
      return { m, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((r) => r.m);
}

const READ_ONLY = { readOnlyHint: true, openWorldHint: false };

const TOOLS = [
  {
    name: 'search_components',
    description: 'Find the components for a need in plain words ("date range", "searchable select", "file drop"). Returns names to pass to get_component.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    run: ({ query }) => {
      const found = searchComponents(String(query ?? ''));
      return found.length ? found.map((m) => `- ${m.name}: ${m.description}`).join('\n') : 'No match. Call list_components for every component.';
    },
  },
  {
    name: 'list_components',
    description: 'List every Pinfold component with its import path and one-line description.',
    inputSchema: { type: 'object', properties: {} },
    run: () => componentMetas.map((m) => `- ${m.name}: ${m.description} Import \`${m.importPath}\`.`).join('\n'),
  },
  {
    name: 'get_component',
    description: 'Full reference for one component: usage (a preset for anywhere, a hook for a client component that needs the controller), every option with defaults, rows, slots, keyboard, ARIA.',
    inputSchema: nameArg,
    run: ({ name }) => metaToMarkdown(required(name)),
  },
  {
    name: 'get_schema',
    description: "JSON Schema of a component's config. Use it to generate or check config objects.",
    inputSchema: nameArg,
    run: ({ name }) => JSON.stringify(toJsonSchema(required(name)), null, 2),
  },
  {
    name: 'validate_config',
    description: 'Check a config object for a component: missing required keys, unknown keys (with did-you-mean), wrong types, bad enum values.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', enum: names() }, config: { type: 'object' } },
      required: ['name', 'config'],
    },
    run: ({ name, config }) => {
      const problems = validateConfig(required(name), config);
      return problems.length ? problems.map((p) => `- ${p.message}`).join('\n') : 'Valid: no problems found.';
    },
  },
  {
    name: 'get_install_steps',
    description: 'How to add Pinfold to a project, or one component: the commands, and the exact stylesheets it needs.',
    inputSchema: { type: 'object', properties: { name: { type: 'string', enum: names() } } },
    run: ({ name } = {}) => {
      const meta = name ? required(name) : null;
      const n = meta?.name ?? '<component>';
      const pascal = meta ? meta.pascal ?? meta.displayName.replace(/\s+/g, '') : '<Name>';
      const css = meta ? ['core', ...stylesFor(meta.name)] : ['core', '<component>'];
      return [
        'With the CLI (detects Next.js, Vite or React Router, TypeScript or JavaScript, Tailwind):',
        '1. `npx pinfold init` (add `--yes` to accept the defaults).',
        `2. \`npx pinfold add ${n}\` writes components/ui/${n}.tsx (or .jsx) and imports its stylesheets.`,
        '3. `npx pinfold doctor` checks the setup.',
        '',
        'By hand:',
        '1. `npm install @pinfold/react @pinfold/css`',
        `2. In the app entry, once: ${css.map((s) => `import '@pinfold/css/${s}.css';`).join(' ')}`,
        `3. Default, anywhere (Server Components included): \`export const X = define${pascal}({ ... })\`, defined once outside components, then \`<X />\`. Only in a client component that needs the controller: \`const X = use${pascal}({ ... })\`. Import from \`${meta?.importPath ?? '@pinfold/react/<component>'}\`.`,
        '',
        `With shadcn: add \`"registries": { "@pinfold": "https://pinfold.indranildev.in/r/{name}.json" }\` to components.json, then \`npx shadcn add @pinfold/${n}\`.`,
      ].join('\n');
    },
  },
].map((tool) => ({ ...tool, annotations: READ_ONLY }));

function required(name) {
  const meta = byName(name);
  if (!meta) throw new Error(`Unknown component "${name}". Known: ${names().join(', ')}.`);
  return meta;
}

/** One JSON-RPC request in, one response out (null for notifications). */
export function handle(message) {
  const { id, method, params = {} } = message;
  const reply = (result) => (id === undefined ? null : { jsonrpc: '2.0', id, result });
  const fail = (code, msg) => (id === undefined ? null : { jsonrpc: '2.0', id, error: { code, message: msg } });

  switch (method) {
    case 'initialize':
      return reply({
        protocolVersion: params.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'pinfold', version: VERSION },
        instructions: 'Pinfold UI reference for the installed version. Find components with search_components (or list_components), read get_component before writing Pinfold code, check a config with validate_config, and use get_install_steps for commands and stylesheets. Prefer a define<Name> preset, defined once outside components: it works everywhere, Server Components included. Use the use<Name> hook only in a client component that needs the controller; hooks cannot run in Server Components.',
      });
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS.map(({ run, ...tool }) => tool) });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return fail(-32602, `Unknown tool ${params.name}`);
      try {
        return reply({ content: [{ type: 'text', text: tool.run(params.arguments ?? {}) }] });
      } catch (error) {
        return reply({ content: [{ type: 'text', text: error.message }], isError: true });
      }
    }
    case 'resources/list':
      return reply({
        resources: componentMetas.map((m) => ({ uri: `pinfold://components/${m.name}`, name: m.displayName, mimeType: 'text/markdown', description: m.description })),
      });
    case 'resources/read': {
      const meta = byName(String(params.uri ?? '').replace('pinfold://components/', ''));
      if (!meta) return fail(-32602, `Unknown resource ${params.uri}`);
      return reply({ contents: [{ uri: params.uri, mimeType: 'text/markdown', text: metaToMarkdown(meta) }] });
    }
    default:
      if (method?.startsWith('notifications/')) return null;
      return fail(-32601, `Method not found: ${method}`);
  }
}

export function serve(input = process.stdin, output = process.stdout) {
  const rl = createInterface({ input });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let response;
    try {
      response = handle(JSON.parse(line));
    } catch {
      response = { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } };
    }
    if (response) output.write(JSON.stringify(response) + '\n');
  });
  return new Promise((done) => rl.on('close', done));
}
