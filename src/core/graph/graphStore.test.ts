import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import path from 'path';
import fs from 'fs';

const TEST_GRAPH_PATH = path.join(process.cwd(), 'test-synapse-graph.json');
process.env.SYNAPSE_GRAPH_PATH = TEST_GRAPH_PATH;

import { 
  loadGraphFromDisk, 
  upsertGraphNode, 
  removeGraphNode, 
  connectGraphWire, 
  removeGraphWire,
  clearGraph 
} from './graphStore';

describe('Persistent Graph Store & Headless Logic', () => {
  beforeEach(() => {
    clearGraph();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_GRAPH_PATH)) {
      fs.unlinkSync(TEST_GRAPH_PATH);
    }
  });

  it('initializes and clears to an empty canvas', () => {
    const graph = loadGraphFromDisk();
    expect(graph.nodes.length).toBe(0);
    expect(graph.wires.length).toBe(0);
  });

  it('upserts a node, evaluates Lisp constitutional rules, and applies CAD layout', () => {
    const compliantCode = `import { z } from "zod";
export const input = z.void(), output = z.string();
export function getHello(): string {
  return "Hello World";
}`;

    const { node, graph } = upsertGraphNode({
      id: 'n-hello',
      domain: 'test',
      module: 'core',
      action: 'get-hello',
      title: 'Hello Node',
      category: 'state',
      code: compliantCode,
      inputs: [],
      outputs: [{ id: 'out-str', name: 'out.str', typeSchema: 'z.string()', direction: 'out' }]
    });

    expect(node.id).toBe('n-hello');
    expect(node.data.ruleMetrics.status).toBe('verified');
    expect(graph.nodes.length).toBe(1);
    expect(graph.nodes[0].position.x).toBe(64); // Column 0 (state)
  });

  it('connects a typed wire and updates the graph', () => {
    // Add Node A
    upsertGraphNode({
      id: 'node-a',
      category: 'state',
      code: 'export function a() { return 1; }',
      outputs: [{ id: 'out', name: 'out', typeSchema: 'z.number()', direction: 'out' }]
    });

    // Add Node B
    upsertGraphNode({
      id: 'node-b',
      category: 'ui',
      code: 'export function b() { return null; }',
      inputs: [{ id: 'in', name: 'in', typeSchema: 'z.number()', direction: 'in' }]
    });

    const { wire, graph } = connectGraphWire({
      source: 'node-a',
      sourceHandle: 'out',
      target: 'node-b',
      targetHandle: 'in',
      sourceSchema: 'z.number()',
      targetSchema: 'z.number()'
    });

    expect(wire.source).toBe('node-a');
    expect(wire.target).toBe('node-b');
    expect(graph.wires.length).toBe(1);
  });

  it('cascades wire removal when a node is deleted', () => {
    upsertGraphNode({ id: 'node-1', code: 'const x = 1;' });
    upsertGraphNode({ id: 'node-2', code: 'const y = 2;' });
    connectGraphWire({
      source: 'node-1',
      sourceHandle: 'out',
      target: 'node-2',
      targetHandle: 'in'
    });

    const graphAfterDelete = removeGraphNode('node-1');
    expect(graphAfterDelete.nodes.length).toBe(1);
    expect(graphAfterDelete.wires.length).toBe(0); // Wire was cascaded away
  });
});
