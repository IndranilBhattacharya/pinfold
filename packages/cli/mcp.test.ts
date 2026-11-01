// @vitest-environment node
import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
// @ts-ignore plain ESM module
import { handle, serve } from './lib/mcp.mjs';

const call = (name: string, args = {}) => handle({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }).result;

describe('pinfold mcp', () => {
  it('initialises and lists its tools', () => {
    const init = handle({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
    expect(init.result.serverInfo.name).toBe('pinfold');
    expect(init.result.capabilities.tools).toBeDefined();
    expect(handle({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
    const tools = handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' }).result.tools.map((t: { name: string }) => t.name);
    expect(tools).toEqual(['list_components', 'get_component', 'get_schema', 'validate_config', 'get_install_steps']);
  });

  it('answers from component meta', () => {
    expect(call('list_components').content[0].text).toContain('accordion');
    const doc = call('get_component', { name: 'accordion' }).content[0].text;
    expect(doc).toContain('# Accordion');
    expect(doc).toContain('`hiddenUntilFound`');
    expect(JSON.parse(call('get_schema', { name: 'accordion' }).content[0].text).required).toEqual(['items']);
    expect(call('validate_config', { name: 'accordion', config: { items: [{ title: 'A' }], varaint: 'x' } }).content[0].text).toContain('Did you mean `variant`?');
    expect(call('get_component', { name: 'nope' }).isError).toBe(true);
  });

  it('serves newline-delimited JSON-RPC over stdio', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const done = serve(input, output);
    const lines: string[] = [];
    output.on('data', (d) => lines.push(...String(d).trim().split('\n')));
    input.write(JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'ping' }) + '\n');
    input.write('not json\n');
    input.end();
    await done;
    expect(JSON.parse(lines[0])).toEqual({ jsonrpc: '2.0', id: 7, result: {} });
    expect(JSON.parse(lines[1]).error.code).toBe(-32700);
  });
});
