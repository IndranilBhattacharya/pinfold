/**
 * `npx pinfold mcp`: a local Model Context Protocol server over stdio
 * (newline-delimited JSON-RPC 2.0). It answers from the installed
 * @pinfold/core meta, so the docs always match the installed version and
 * nothing is hosted.
 *
 *   { "mcpServers": { "pinfold": { "command": "npx", "args": ["pinfold", "mcp"] } } }
 */
import { createInterface } from 'node:readline';
import { componentMetas, metaToMarkdown, toJsonSchema, validateConfig } from '@pinfold/core/meta';

const VERSION = '0.8.0';
const byName = (name) => componentMetas.find((m) => m.name === name);
const names = () => componentMetas.map((m) => m.name);
const nameArg = { type: 'object', properties: { name: { type: 'string', enum: names() } }, required: ['name'] };

const TOOLS = [
  {
    name: 'list_components',
    description: 'List every Pinfold component with its import path and one-line description.',
    inputSchema: { type: 'object', properties: {} },
    run: () => componentMetas.map((m) => `- ${m.name}: ${m.description} Import \`${m.importPath}\`.`).join('\n'),
  },
  {
    name: 'get_component',
    description: 'Full reference for one component: usage (client hook and Server Component), every option with defaults, rows, slots, keyboard, ARIA.',
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
    description: 'How to add Pinfold (optionally one component) to a project.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
    run: ({ name } = {}) =>
      [
        '1. `npx pinfold init` (detects Next.js/Vite/React Router, TS or JS, Tailwind; writes config, theme, CSS imports). Non-interactive: `--yes`.',
        `2. \`npx pinfold add ${name ?? '<component>'}\` writes components/ui/${name ?? '<component>'}.tsx (or .jsx) and its CSS import.`,
        '3. Client Component: `const X = use<Name>({ items }); return <X />`. Server Component: `define<Name>({ items })`.',
        '4. `npx pinfold doctor` checks the setup.',
      ].join('\n'),
  },
];

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
        instructions: 'Pinfold UI reference. Call list_components, then get_component before writing Pinfold code; validate_config to check a config.',
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
