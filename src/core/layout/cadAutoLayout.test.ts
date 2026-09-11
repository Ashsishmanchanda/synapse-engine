import { describe, it, expect } from 'bun:test';
import { 
  executeCADAutoLayout, 
  snapToGrid, 
  CAD_NODE_WIDTH, 
  CAD_COLUMN_GAP, 
  CAD_GRID_SNAP 
} from './cadAutoLayout';
import { SynapseGraphNode, WireDefinition } from '../../types';

describe('CAD Auto-Layout Engine', () => {
  it('snaps coordinates to 16px grid units', () => {
    expect(snapToGrid(15)).toBe(16);
    expect(snapToGrid(33)).toBe(32);
    expect(snapToGrid(0)).toBe(0);
  });

  it('arranges nodes into non-overlapping topological columns', () => {
    const mockNodes: SynapseGraphNode[] = [
      {
        id: 'n-state',
        type: 'codeSnippet',
        position: { x: 0, y: 0 },
        data: {
          id: 'n-state',
          domain: 'saas',
          module: 'data',
          action: 'get-state',
          title: 'App State',
          category: 'state',
          isExpanded: false,
          code: 'export function getState() { return {}; }',
          inputs: [],
          outputs: [{ id: 'out-state', name: 'out.state', typeSchema: 'z.any()', direction: 'out' }],
          ruleMetrics: {
            lines: 1,
            maxLines: 50,
            statements: 1,
            maxStatements: 40,
            maxCharsPerLine: 40,
            hasMutation: false,
            hasThis: false,
            hasThrow: false,
            status: 'verified',
            violations: []
          }
        }
      },
      {
        id: 'n-transform',
        type: 'codeSnippet',
        position: { x: 0, y: 0 },
        data: {
          id: 'n-transform',
          domain: 'saas',
          module: 'logic',
          action: 'transform-data',
          title: 'Data Transformer',
          category: 'transform',
          isExpanded: false,
          code: 'export function transform(x: any) { return x; }',
          inputs: [{ id: 'in-data', name: 'in.data', typeSchema: 'z.any()', direction: 'in' }],
          outputs: [{ id: 'out-data', name: 'out.data', typeSchema: 'z.any()', direction: 'out' }],
          ruleMetrics: {
            lines: 1,
            maxLines: 50,
            statements: 1,
            maxStatements: 40,
            maxCharsPerLine: 40,
            hasMutation: false,
            hasThis: false,
            hasThrow: false,
            status: 'verified',
            violations: []
          }
        }
      },
      {
        id: 'n-ui',
        type: 'codeSnippet',
        position: { x: 0, y: 0 },
        data: {
          id: 'n-ui',
          domain: 'saas',
          module: 'view',
          action: 'render-card',
          title: 'Card View',
          category: 'ui',
          isExpanded: false,
          code: 'export function Card() { return null; }',
          inputs: [{ id: 'in-card', name: 'in.card', typeSchema: 'z.any()', direction: 'in' }],
          outputs: [],
          ruleMetrics: {
            lines: 1,
            maxLines: 50,
            statements: 1,
            maxStatements: 40,
            maxCharsPerLine: 40,
            hasMutation: false,
            hasThis: false,
            hasThrow: false,
            status: 'verified',
            violations: []
          }
        }
      }
    ];

    const mockWires: WireDefinition[] = [
      {
        id: 'w1',
        source: 'n-state',
        sourceHandle: 'out-state',
        target: 'n-transform',
        targetHandle: 'in-data'
      },
      {
        id: 'w2',
        source: 'n-transform',
        sourceHandle: 'out-data',
        target: 'n-ui',
        targetHandle: 'in-card'
      }
    ];

    const laidOut = executeCADAutoLayout(mockNodes, mockWires);

    expect(laidOut.length).toBe(3);

    const stateNode = laidOut.find(n => n.id === 'n-state')!;
    const transformNode = laidOut.find(n => n.id === 'n-transform')!;
    const uiNode = laidOut.find(n => n.id === 'n-ui')!;

    // Columns must be strictly ordered left to right: State (Col 0) < Transform (Col 1) < UI (Col 3)
    expect(stateNode.position.x).toBeLessThan(transformNode.position.x);
    expect(transformNode.position.x).toBeLessThan(uiNode.position.x);

    // Every coordinate must snap to 16px grid
    laidOut.forEach(n => {
      expect(n.position.x % CAD_GRID_SNAP).toBe(0);
      expect(n.position.y % CAD_GRID_SNAP).toBe(0);
    });
  });
});
