import { Node } from '@xyflow/react';

export type PortDirection = 'in' | 'out' | 'err';

export interface PortDefinition {
  id: string;
  name: string;
  typeSchema: string; // e.g., 'z.string()', 'z.object({ id: z.string() })'
  direction: PortDirection;
  label?: string;
  description?: string;
}

export type NodeRuleStatus = 'verified' | 'warning' | 'violated' | 'draft';

export interface RuleViolation {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  fixSuggestion?: string;
}

export interface NodeRuleMetrics {
  lines: number;
  maxLines: number;
  statements: number;
  maxStatements: number;
  maxCharsPerLine: number;
  hasMutation: boolean;
  hasThis: boolean;
  hasThrow: boolean;
  status: NodeRuleStatus;
  violations: RuleViolation[];
}

export type NodeCategory = 'transform' | 'io' | 'logic' | 'state' | 'compound' | 'ui';

export interface CodeSnippetNodeData extends Record<string, unknown> {
  id: string;
  domain: string;
  module: string;
  action: string;
  title: string;
  category: NodeCategory;
  code: string;
  isExpanded: boolean;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  ruleMetrics: NodeRuleMetrics;
  subgraphId?: string;
  isCompound?: boolean;
  targetSubgraphId?: string;
  collapsedChildCount?: number;
  runtimeTarget?: 'client' | 'server';
  onCodeChange?: (id: string, newCode: string) => void;
  onToggleExpand?: (id: string) => void;
  onDrillDown?: (subgraphId: string, title: string) => void;
  onSplitNode?: (id: string) => void;
}

export type CodeSnippetNodeType = Node<CodeSnippetNodeData, 'codeSnippet'>;

export interface BreadcrumbItem {
  id: string;
  title: string;
  path: string;
}

export interface WireDefinition {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  type?: string;
  animated?: boolean;
  data?: {
    contract: string;
    sourceSchema: string;
    targetSchema: string;
    status?: 'compatible' | 'mismatch' | 'unknown' | 'subtype';
  };
}

export interface SynapseGraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: CodeSnippetNodeData;
}

export interface SynapseGraph {
  version: string;
  activeApp: string;
  subgraphs: Record<string, { id: string; title: string; parentId?: string }>;
  nodes: SynapseGraphNode[];
  wires: WireDefinition[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  port: number;
  status: 'stopped' | 'running' | 'building' | 'error';
  pid?: number;
}

export interface ProjectManifest {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  env?: Record<string, string>;
  entryNodeId?: string;
  allocatedPort?: number;
}

export interface ProjectProcessStatus {
  id: string;
  status: 'stopped' | 'running' | 'building' | 'error';
  port: number;
  pid?: number;
  uptime?: number;
  url?: string;
  lastError?: string;
}
