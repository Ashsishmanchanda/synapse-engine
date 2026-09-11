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
  collapsedChildCount?: number;
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
