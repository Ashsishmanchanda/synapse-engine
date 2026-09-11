import { describe, it, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { exportNextjsApp, toComponentName } from './codeExporter';
import { SynapseGraph } from '../../types';

describe('One-Click Next.js 15 Code Exporter', () => {
  it('sanitizes node IDs into clean PascalCase component names', () => {
    expect(toComponentName('n-state')).toBe('StateComponent');
    expect(toComponentName('n-action-logic')).toBe('ActionLogicComponent');
    expect(toComponentName('pricing-card')).toBe('PricingCardComponent');
  });

  it('synthesizes a standalone Next.js 15 project folder structure', () => {
    const testGraph: SynapseGraph = {
      version: '1.0.0',
      activeApp: 'test-saas-calc',
      subgraphs: { root: { id: 'root', title: 'Root Canvas' } },
      nodes: [
        {
          id: 'n-state',
          type: 'codeSnippet',
          position: { x: 64, y: 80 },
          data: {
            id: 'n-state',
            domain: 'calc',
            module: 'state',
            action: 'get-state',
            title: 'Calculator State',
            category: 'state',
            isExpanded: true,
            code: 'export function getState() { return { count: 0 }; }',
            inputs: [],
            outputs: [{ id: 'out-state', name: 'out.state', typeSchema: 'z.any()', direction: 'out' }],
            ruleMetrics: {
              lines: 1,
              maxLines: 50,
              statements: 1,
              maxStatements: 40,
              maxCharsPerLine: 50,
              hasMutation: false,
              hasThis: false,
              hasThrow: false,
              status: 'verified',
              violations: []
            }
          }
        },
        {
          id: 'n-card-ui',
          type: 'codeSnippet',
          position: { x: 1620, y: 80 },
          data: {
            id: 'n-card-ui',
            domain: 'calc',
            module: 'ui',
            action: 'render-card',
            title: 'Card View',
            category: 'ui',
            isExpanded: true,
            code: 'export function Card() { return <div>Card</div>; }',
            inputs: [{ id: 'in-state', name: 'in.state', typeSchema: 'z.any()', direction: 'in' }],
            outputs: [],
            ruleMetrics: {
              lines: 1,
              maxLines: 50,
              statements: 1,
              maxStatements: 40,
              maxCharsPerLine: 50,
              hasMutation: false,
              hasThis: false,
              hasThrow: false,
              status: 'verified',
              violations: []
            }
          }
        }
      ],
      wires: [
        {
          id: 'w-state-card',
          source: 'n-state',
          sourceHandle: 'out-state',
          target: 'n-card-ui',
          targetHandle: 'in-state',
          data: { contract: 'z.any()', sourceSchema: 'z.any()', targetSchema: 'z.any()' }
        }
      ]
    };

    const result = exportNextjsApp(testGraph, 'test-export-output');
    expect(result.success).toBe(true);
    expect(result.nodeCount).toBe(2);
    expect(result.wireCount).toBe(1);

    // Verify key files exist
    expect(fs.existsSync(path.join(result.exportPath, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.exportPath, 'app', 'page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(result.exportPath, 'app', 'layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(result.exportPath, 'components', 'nodes', 'StateComponent.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(result.exportPath, 'components', 'nodes', 'CardUiComponent.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(result.exportPath, 'lib', 'contracts', 'schemas.ts'))).toBe(true);

    // Cleanup test export
    fs.rmSync(result.exportPath, { recursive: true, force: true });
  });
});
