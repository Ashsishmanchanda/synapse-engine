import fs from 'fs';
import path from 'path';
import { SynapseGraph, SynapseGraphNode, WireDefinition, CodeSnippetNodeData } from '../../types';
import { executeCADAutoLayout } from '../layout/cadAutoLayout';
import { evaluateNodeWithLisp } from '../lisp/constitutionalRulebook';

export function getGraphFilePath(): string {
  return process.env.SYNAPSE_GRAPH_PATH || path.join(process.cwd(), 'synapse-graph.json');
}

export const INITIAL_SEED_NODES: SynapseGraphNode[] = [
  {
    id: 'n-state',
    type: 'codeSnippet',
    position: { x: 60, y: 80 },
    data: {
      id: 'n-state',
      domain: 'chess',
      module: 'state',
      action: 'get-initial-state',
      title: 'Initial Game State',
      category: 'state',
      isExpanded: true,
      inputs: [],
      outputs: [{ id: 'out-state', name: 'out.state', typeSchema: 'z.any()', direction: 'out' }],
      code: `import { z } from "zod";
export const input = z.void(), output = z.any();

export function getInitialState() {
  return {
    board: [
      ["bR","bN","bB","bQ","bK","bB","bN","bR"],
      ["bP","bP","bP","bP","bP","bP","bP","bP"],
      ["","","","","","","",""],
      ["","","","","","","",""],
      ["","","","","","","",""],
      ["","","","","","","",""],
      ["wP","wP","wP","wP","wP","wP","wP","wP"],
      ["wR","wN","wB","wQ","wK","wB","wN","wR"]
    ],
    turn: "w",
    selected: null,
    whiteClock: "5:00",
    blackClock: "5:00"
  };
}`,
      ruleMetrics: {
        lines: 19,
        maxLines: 50,
        statements: 2,
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
    id: 'n-pieces',
    type: 'codeSnippet',
    position: { x: 60, y: 440 },
    data: {
      id: 'n-pieces',
      domain: 'chess',
      module: 'assets',
      action: 'get-piece-img',
      title: 'Piece SVG Sprite Map',
      category: 'io',
      isExpanded: true,
      inputs: [{ id: 'in-piece', name: 'in.piece', typeSchema: 'z.string()', direction: 'in' }],
      outputs: [{ id: 'out-svg', name: 'out.svg', typeSchema: 'z.string()', direction: 'out' }],
      code: `import { z } from "zod";
export const input = z.string(), output = z.string();

export function getPieceImg(piece: string): string {
  if (!piece) return "";
  return "/assets/pieces/" + piece + ".svg";
}`,
      ruleMetrics: {
        lines: 6,
        maxLines: 50,
        statements: 3,
        maxStatements: 40,
        maxCharsPerLine: 45,
        hasMutation: false,
        hasThis: false,
        hasThrow: false,
        status: 'verified',
        violations: []
      }
    }
  },
  {
    id: 'n-action-logic',
    type: 'codeSnippet',
    position: { x: 580, y: 80 },
    data: {
      id: 'n-action-logic',
      domain: 'chess',
      module: 'logic',
      action: 'handle-action',
      title: 'Move & Selection Reducer',
      category: 'logic',
      isExpanded: true,
      inputs: [{ id: 'in-action', name: 'in.action', typeSchema: 'z.any()', direction: 'in' }],
      outputs: [{ id: 'out-state', name: 'out.state', typeSchema: 'z.any()', direction: 'out' }],
      code: `import { z } from "zod";
export const input = z.any(), output = z.any();

export function handleAction(state: any, actionName: string, payload: any): any {
  if (actionName !== "SELECT_SQ") return state;
  const pos = payload;
  const sel = state.selected;
  if (!sel) return { ...state, selected: pos };
  if (sel === pos) return { ...state, selected: null };
  const [fr, fc] = [8 - parseInt(sel[1]), sel.charCodeAt(0) - 97];
  const [tr, tc] = [8 - parseInt(pos[1]), pos.charCodeAt(0) - 97];
  const piece = state.board[fr][fc];
  if (!piece) return { ...state, selected: pos };
  const nextBoard = state.board.map((row, r) =>
    row.map((sq, c) => (r === tr && c === tc ? piece : (r === fr && c === fc ? "" : sq)))
  );
  return {
    ...state,
    board: nextBoard,
    selected: null,
    turn: state.turn === "w" ? "b" : "w",
    moves: [...(state.moves || []), sel + " → " + pos]
  };
}`,
      ruleMetrics: {
        lines: 23,
        maxLines: 50,
        statements: 15,
        maxStatements: 40,
        maxCharsPerLine: 85,
        hasMutation: false,
        hasThis: false,
        hasThrow: false,
        status: 'verified',
        violations: []
      }
    }
  },
  {
    id: 'n-board-ui',
    type: 'codeSnippet',
    position: { x: 1620, y: 80 },
    data: {
      id: 'n-board-ui',
      domain: 'chess',
      module: 'ui',
      action: 'render-board-ui',
      title: 'Walnut Chessboard View',
      category: 'ui',
      isExpanded: true,
      inputs: [
        { id: 'in-state', name: 'in.state', typeSchema: 'z.any()', direction: 'in' },
        { id: 'in-svg', name: 'in.svg', typeSchema: 'z.string()', direction: 'in' }
      ],
      outputs: [{ id: 'out-vdom', name: 'out.vdom', typeSchema: 'z.array(z.any())', direction: 'out' }],
      code: `import { z } from "zod";
export const input = z.any(), output = z.array(z.any());

export function renderBoardUI(state: any) {
  return Array.from({ length: 64 }, (_, i) => ({
    r: Math.floor(i / 8),
    c: i % 8,
    pos: String.fromCharCode(97 + (i % 8)) + (8 - Math.floor(i / 8))
  }));
}`,
      ruleMetrics: {
        lines: 9,
        maxLines: 50,
        statements: 3,
        maxStatements: 40,
        maxCharsPerLine: 65,
        hasMutation: false,
        hasThis: false,
        hasThrow: false,
        status: 'verified',
        violations: []
      }
    }
  }
];

export const INITIAL_SEED_WIRES: WireDefinition[] = [
  {
    id: 'w-state-action',
    source: 'n-state',
    sourceHandle: 'out-state',
    target: 'n-action-logic',
    targetHandle: 'in-action',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.any()', sourceSchema: 'z.any()', targetSchema: 'z.any()', status: 'compatible' }
  },
  {
    id: 'w-pieces-board',
    source: 'n-pieces',
    sourceHandle: 'out-svg',
    target: 'n-board-ui',
    targetHandle: 'in-svg',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.string()', sourceSchema: 'z.string()', targetSchema: 'z.string()', status: 'compatible' }
  }
];

export function getDefaultGraph(): SynapseGraph {
  const laidOutNodes = executeCADAutoLayout(INITIAL_SEED_NODES, INITIAL_SEED_WIRES);
  return {
    version: '1.0.0',
    activeApp: 'walnut-chess',
    subgraphs: {
      root: { id: 'root', title: 'Walnut Chess Studio' }
    },
    nodes: laidOutNodes,
    wires: INITIAL_SEED_WIRES
  };
}

export function loadGraphFromDisk(): SynapseGraph {
  const filePath = getGraphFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to load synapse-graph.json from disk, falling back to seed:', err);
  }

  const defaultGraph = getDefaultGraph();
  saveGraphToDisk(defaultGraph);
  return defaultGraph;
}

export function saveGraphToDisk(graph: SynapseGraph): void {
  const filePath = getGraphFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(graph, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write synapse-graph.json to disk:', err);
    throw err;
  }
}

export function upsertGraphNode(nodeInput: {
  id: string;
  domain?: string;
  module?: string;
  action?: string;
  title?: string;
  category?: 'transform' | 'io' | 'logic' | 'state' | 'compound' | 'ui';
  code: string;
  inputs?: any[];
  outputs?: any[];
  isExpanded?: boolean;
  subgraphId?: string;
}): { node: SynapseGraphNode; graph: SynapseGraph } {
  const graph = loadGraphFromDisk();
  const category = nodeInput.category || 'transform';
  const ruleMetrics = evaluateNodeWithLisp(nodeInput.code, category);

  const existingIndex = graph.nodes.findIndex(n => n.id === nodeInput.id);

  const nodeData: CodeSnippetNodeData = {
    id: nodeInput.id,
    domain: nodeInput.domain || 'core',
    module: nodeInput.module || 'main',
    action: nodeInput.action || 'exec',
    title: nodeInput.title || nodeInput.id,
    category,
    code: nodeInput.code,
    isExpanded: nodeInput.isExpanded ?? true,
    inputs: nodeInput.inputs || [],
    outputs: nodeInput.outputs || [],
    subgraphId: nodeInput.subgraphId || 'root',
    ruleMetrics
  };

  const newNode: SynapseGraphNode = {
    id: nodeInput.id,
    type: 'codeSnippet',
    position: existingIndex >= 0 ? graph.nodes[existingIndex].position : { x: 60, y: 80 },
    data: nodeData
  };

  if (existingIndex >= 0) {
    graph.nodes[existingIndex] = newNode;
  } else {
    graph.nodes.push(newNode);
  }

  // Auto-layout nodes cleanly
  graph.nodes = executeCADAutoLayout(graph.nodes, graph.wires);
  saveGraphToDisk(graph);

  const finalNode = graph.nodes.find(n => n.id === nodeInput.id) || newNode;
  return { node: finalNode, graph };
}

export function removeGraphNode(nodeId: string): SynapseGraph {
  const graph = loadGraphFromDisk();
  graph.nodes = graph.nodes.filter(n => n.id !== nodeId);
  // Cascade remove attached wires
  graph.wires = graph.wires.filter(w => w.source !== nodeId && w.target !== nodeId);
  graph.nodes = executeCADAutoLayout(graph.nodes, graph.wires);
  saveGraphToDisk(graph);
  return graph;
}

export function connectGraphWire(wireInput: {
  id?: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  contract?: string;
  sourceSchema?: string;
  targetSchema?: string;
}): { wire: WireDefinition; graph: SynapseGraph } {
  const graph = loadGraphFromDisk();
  const wireId = wireInput.id || `w-${wireInput.source}-${wireInput.target}`;

  const newWire: WireDefinition = {
    id: wireId,
    source: wireInput.source,
    sourceHandle: wireInput.sourceHandle,
    target: wireInput.target,
    targetHandle: wireInput.targetHandle,
    type: 'zodWire',
    animated: true,
    data: {
      contract: wireInput.contract || wireInput.sourceSchema || 'z.any()',
      sourceSchema: wireInput.sourceSchema || 'z.any()',
      targetSchema: wireInput.targetSchema || 'z.any()',
      status: 'compatible'
    }
  };

  graph.wires = graph.wires.filter(w => w.id !== wireId);
  graph.wires.push(newWire);

  // Recalculate auto layout based on new wiring dependencies
  graph.nodes = executeCADAutoLayout(graph.nodes, graph.wires);
  saveGraphToDisk(graph);

  return { wire: newWire, graph };
}

export function removeGraphWire(wireId: string): SynapseGraph {
  const graph = loadGraphFromDisk();
  graph.wires = graph.wires.filter(w => w.id !== wireId);
  graph.nodes = executeCADAutoLayout(graph.nodes, graph.wires);
  saveGraphToDisk(graph);
  return graph;
}

export function clearGraph(): SynapseGraph {
  const blankGraph: SynapseGraph = {
    version: '1.0.0',
    activeApp: 'untitled-app',
    subgraphs: { root: { id: 'root', title: 'Root Canvas' } },
    nodes: [],
    wires: []
  };
  saveGraphToDisk(blankGraph);
  return blankGraph;
}
