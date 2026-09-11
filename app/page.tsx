'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Cpu, Play, LayoutGrid, Layers, RefreshCw, Download, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CodeSnippetNode } from '../src/components/Nodes/CodeSnippetNode';
import { ZodWireEdge } from '../src/components/Edges/ZodWireEdge';
import { evaluateNodeWithLisp } from '../src/core/lisp/constitutionalRulebook';
import { ApexRoiAppView } from '../src/components/Apps/ApexRoiAppView';

const nodeTypes = {
  codeSnippet: CodeSnippetNode,
};

const edgeTypes = {
  zodWire: ZodWireEdge,
};

// Initial 7 Constitutional Micro-Nodes for Chess Engine
const INITIAL_NODES_DATA = [
  {
    id: 'n-state',
    type: 'codeSnippet',
    position: { x: 50, y: 80 },
    data: {
      id: 'n-state',
      domain: 'chess',
      module: 'state',
      action: 'get-initial-state',
      title: 'Initial Game State',
      category: 'ui',
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
}`
    }
  },
  {
    id: 'n-pieces',
    type: 'codeSnippet',
    position: { x: 50, y: 440 },
    data: {
      id: 'n-pieces',
      domain: 'chess',
      module: 'assets',
      action: 'get-piece-img',
      title: 'Piece SVG Sprite Map',
      category: 'ui',
      isExpanded: true,
      inputs: [{ id: 'in-piece', name: 'in.piece', typeSchema: 'z.string()', direction: 'in' }],
      outputs: [{ id: 'out-svg', name: 'out.svg', typeSchema: 'z.string()', direction: 'out' }],
      code: `import { z } from "zod";
export const input = z.string(), output = z.string();

export function getPieceImg(piece: string): string {
  if (!piece) return "";
  return "/assets/pieces/" + piece + ".svg";
}`
    }
  },
  {
    id: 'n-action-logic',
    type: 'codeSnippet',
    position: { x: 50, y: 720 },
    data: {
      id: 'n-action-logic',
      domain: 'chess',
      module: 'logic',
      action: 'handle-action',
      title: 'Move & Selection Reducer',
      category: 'ui',
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
}`
    }
  },
  {
    id: 'n-left-nav',
    type: 'codeSnippet',
    position: { x: 520, y: 80 },
    data: {
      id: 'n-left-nav',
      domain: 'chess',
      module: 'ui',
      action: 'render-left-nav',
      title: 'Left Sidebar Component',
      category: 'ui',
      isExpanded: true,
      inputs: [{ id: 'in-state', name: 'in.state', typeSchema: 'z.any()', direction: 'in' }],
      outputs: [{ id: 'out-vdom', name: 'out.vdom', typeSchema: 'z.array(z.any())', direction: 'out' }],
      code: `import { z } from "zod";
export const input = z.any(), output = z.array(z.any());

export function renderLeftNav(state: any) {
  const items = ["Play", "Puzzles", "Learn", "Train", "Watch", "Community"];
  return items.map(item => ({ label: item, active: item === "Play" }));
}`
    }
  },
  {
    id: 'n-board-ui',
    type: 'codeSnippet',
    position: { x: 520, y: 440 },
    data: {
      id: 'n-board-ui',
      domain: 'chess',
      module: 'ui',
      action: 'render-board-ui',
      title: 'Walnut Chessboard View',
      category: 'ui',
      isExpanded: true,
      inputs: [
        {"id": "in-state", "name": "in.state", "typeSchema": "z.any()", "direction": "in"},
        {"id": "in-svg", "name": "in.svg", "typeSchema": "z.string()", "direction": "in"}
      ],
      outputs: [{"id": "out-vdom", "name": "out.vdom", "typeSchema": "z.array(z.any())", "direction": "out"}],
      code: `import { z } from "zod";
export const input = z.any(), output = z.array(z.any());

export function renderBoardUI(state: any) {
  return Array.from({ length: 64 }, (_, i) => ({
    r: Math.floor(i / 8),
    c: i % 8,
    pos: String.fromCharCode(97 + (i % 8)) + (8 - Math.floor(i / 8))
  }));
}`
    }
  },
  {
    id: 'n-panel-ui',
    type: 'codeSnippet',
    position: { x: 520, y: 780 },
    data: {
      id: 'n-panel-ui',
      domain: 'chess',
      module: 'ui',
      action: 'render-panel-ui',
      title: 'Engine Analysis Panel',
      category: 'ui',
      isExpanded: true,
      inputs: [{"id": "in-state", "name": "in.state", "typeSchema": "z.any()", "direction": "in"}],
      outputs: [{"id": "out-vdom", "name": "out.vdom", "typeSchema": "z.array(z.any())", "direction": "out"}],
      code: `import { z } from "zod";
export const input = z.any(), output = z.array(z.any());

export function renderPanelUI(state: any) {
  return {
    engine: "Stockfish 16 Lite",
    moves: state.moves || [],
    tabs: ["Analysis", "+ New Game", "Games", "Players"]
  };
}`
    }
  },
  {
    id: 'n-root-ui',
    type: 'codeSnippet',
    position: { x: 980, y: 440 },
    data: {
      id: 'n-root-ui',
      domain: 'chess',
      module: 'ui',
      action: 'render-root',
      title: 'Root Viewport Assembler',
      category: 'ui',
      isExpanded: true,
      inputs: [
        {"id": "in-state", "name": "in.state", "typeSchema": "z.any()", "direction": "in"},
        {"id": "in-left", "name": "in.left", "typeSchema": "z.array(z.any())", "direction": "in"},
        {"id": "in-board", "name": "in.board", "typeSchema": "z.array(z.any())", "direction": "in"},
        {"id": "in-panel", "name": "in.panel", "typeSchema": "z.array(z.any())", "direction": "in"}
      ],
      outputs: [{"id": "out-vdom", "name": "out.vdom", "typeSchema": "z.array(z.any())", "direction": "out"}],
      code: `import { z } from "zod";
export const input = z.any(), output = z.array(z.any());

export function renderRoot(state: any) {
  return {
    layout: "three-column",
    left: "170px",
    board: "min(calc(100vh - 72px), calc(100vw - 570px))",
    panel: "320px"
  };
}`
    }
  }
];

const INITIAL_EDGES = [
  {
    id: 'e-state-root',
    source: 'n-state',
    sourceHandle: 'out-state',
    target: 'n-root-ui',
    targetHandle: 'in-state',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.any()', sourceSchema: 'z.any()', targetSchema: 'z.any()' }
  },
  {
    id: 'e-pieces-board',
    source: 'n-pieces',
    sourceHandle: 'out-svg',
    target: 'n-board-ui',
    targetHandle: 'in-svg',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.string()', sourceSchema: 'z.string()', targetSchema: 'z.string()' }
  },
  {
    id: 'e-left-root',
    source: 'n-left-nav',
    sourceHandle: 'out-vdom',
    target: 'n-root-ui',
    targetHandle: 'in-left',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.array(z.any())', sourceSchema: 'z.array(z.any())', targetSchema: 'z.array(z.any())' }
  },
  {
    id: 'e-board-root',
    source: 'n-board-ui',
    sourceHandle: 'out-vdom',
    target: 'n-root-ui',
    targetHandle: 'in-board',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.array(z.any())', sourceSchema: 'z.array(z.any())', targetSchema: 'z.array(z.any())' }
  },
  {
    id: 'e-panel-root',
    source: 'n-panel-ui',
    sourceHandle: 'out-vdom',
    target: 'n-root-ui',
    targetHandle: 'in-panel',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.array(z.any())', sourceSchema: 'z.array(z.any())', targetSchema: 'z.array(z.any())' }
  },
  {
    id: 'e-action-root',
    source: 'n-action-logic',
    sourceHandle: 'out-state',
    target: 'n-root-ui',
    targetHandle: 'in-state',
    type: 'zodWire',
    animated: true,
    data: { contract: 'z.any()', sourceSchema: 'z.any()', targetSchema: 'z.any()' }
  }
];

export default function SynapseStudioPage() {
  const [viewMode, setViewMode] = useState<'canvas' | 'live'>('canvas');

  // Interactive Live Chess State (React 19)
  const [gameState, setGameState] = useState({
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
    selected: null as string | null,
    turn: 'w',
    moves: [] as string[]
  });

  const handleSquareClick = (r: number, c: number) => {
    const pos = String.fromCharCode(97 + c) + (8 - r);
    const sel = gameState.selected;

    if (!sel) {
      if (gameState.board[r][c]) {
        setGameState(prev => ({ ...prev, selected: pos }));
      }
      return;
    }

    if (sel === pos) {
      setGameState(prev => ({ ...prev, selected: null }));
      return;
    }

    const [fr, fc] = [8 - parseInt(sel[1]), sel.charCodeAt(0) - 97];
    const piece = gameState.board[fr][fc];
    if (!piece) {
      setGameState(prev => ({ ...prev, selected: pos }));
      return;
    }

    const nextBoard = gameState.board.map((row, rowIdx) =>
      row.map((sq, colIdx) => {
        if (rowIdx === r && colIdx === c) return piece;
        if (rowIdx === fr && colIdx === fc) return "";
        return sq;
      })
    );

    setGameState(prev => ({
      board: nextBoard,
      selected: null,
      turn: prev.turn === 'w' ? 'b' : 'w',
      moves: [...prev.moves, `${sel} → ${pos}`]
    }));
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<'saas' | 'chess'>('saas');

  // Multi-Level Subgraph Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string }>>([
    { id: 'root', title: 'Studio Root' }
  ]);

  const currentLevel = breadcrumbs[breadcrumbs.length - 1];

  const handleDrillDown = (subgraphId: string, title?: string) => {
    setBreadcrumbs(prev => [
      ...prev,
      { id: subgraphId, title: title || subgraphId }
    ]);
  };

  const handlePopToLevel = (index: number) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  // Canvas Nodes with Constitutional Metrics
  const [nodes, setNodes, onNodesChange] = useNodesState(
    INITIAL_NODES_DATA.map(n => ({
      ...n,
      data: {
        ...n.data,
        ruleMetrics: evaluateNodeWithLisp(n.data.code, n.data.category)
      }
    }))
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  // Filter nodes & edges by current subgraph level
  const visibleNodes = React.useMemo(() => {
    if (activeApp === 'chess') {
      return nodes;
    }
    const filtered = nodes.filter(n => {
      const nodeSubgraphId = (n.data as any)?.subgraphId || 'root';
      return nodeSubgraphId === currentLevel.id;
    });

    return filtered.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDrillDown: handleDrillDown,
      }
    }));
  }, [nodes, activeApp, currentLevel.id]);

  const visibleEdges = React.useMemo(() => {
    if (activeApp === 'chess') {
      return edges;
    }
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, activeApp, visibleNodes]);

  const handleSyncGraph = async () => {
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      if (data.success && data.graph?.nodes?.length > 0) {
        setNodes(data.graph.nodes);
        setEdges(data.graph.wires);
      }
    } catch (err) {
      console.warn('Sync failed, keeping canvas state:', err);
    }
  };

  const handleExportApp = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setExportNotice(`Application exported to: ${data.result.exportPath}`);
        setTimeout(() => setExportNotice(null), 6000);
      } else {
        alert(`Export failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    handleSyncGraph();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080b11]">
      {/* Top Navbar */}
      <header className="h-14 border-b border-orange-500/30 bg-[#0a0d14]/95 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(255,102,0,0.6)]">
              <Sparkles className="w-4.5 h-4.5 text-slate-950 font-black stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200 bg-clip-text text-transparent">
                SYNAPSE ENGINE
              </div>
              <div className="text-[9px] text-amber-400/90 font-mono font-bold">
                NEXT.JS 15 + REACT 19
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">Constitution:</span>
              <span className="text-amber-400 font-bold">Clojure Spec Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] font-mono">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Wires:</span>
              <span className="text-emerald-400 font-bold">Zod Validated</span>
            </div>
          </div>
        </div>

        {/* View Switcher & Export Next.js 15 Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportApp}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-lg text-xs shadow-[0_0_15px_rgba(255,102,0,0.4)] transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Synthesizing...' : 'Export Next.js 15'}</span>
          </button>

          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'canvas'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Blueprint Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'live'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Live Next.js App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation & Graph Sync Toolbar */}
      <div className="h-9 bg-[#0a0d14] border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono text-[11px]">Active App:</span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px] font-mono">
            <button
              onClick={() => {
                setActiveApp('saas');
                setBreadcrumbs([{ id: 'root', title: 'Studio Root' }]);
                handleSyncGraph();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                activeApp === 'saas'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Apex ROI SaaS
            </button>
            <button
              onClick={() => {
                setActiveApp('chess');
                setBreadcrumbs([{ id: 'root', title: 'Walnut Chess Studio' }]);
                setNodes(INITIAL_NODES_DATA.map(n => ({
                  ...n,
                  data: {
                    ...n.data,
                    ruleMetrics: evaluateNodeWithLisp(n.data.code, n.data.category)
                  }
                })));
                setEdges(INITIAL_EDGES);
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                activeApp === 'chess'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Walnut Chess
            </button>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1 font-mono text-[11px]">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                  <button
                    onClick={() => handlePopToLevel(idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                      isLast
                        ? 'text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isLast ? 'Active Level' : `Click to pop back to ${crumb.title}`}
                  >
                    {idx > 0 && <Layers className="w-3 h-3 text-purple-400" />}
                    <span>{crumb.title}</span>
                    <span className="text-[9px] text-slate-400 font-normal">
                      (Level {idx})
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {exportNotice && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded text-[11px] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{exportNotice}</span>
            </div>
          )}
          <button 
            onClick={handleSyncGraph} 
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors font-mono text-[11px]"
            title="Reload blueprint topology from synapse-graph.json"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync Blueprint</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 w-full h-[calc(100vh-56px)] overflow-hidden relative">
        {viewMode === 'canvas' ? (
          <>
            {/* Subgraph Level Floating Status Banner */}
            {currentLevel.id !== 'root' && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/95 border border-purple-500/60 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">
                      Inside Subgraph Level 1
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      {currentLevel.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePopToLevel(breadcrumbs.length - 2)}
                  className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs font-mono transition-all flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <span>← Pop to Root Level</span>
                </button>
              </div>
            )}

            <ReactFlow
              key={currentLevel.id}
              nodes={visibleNodes}
              edges={visibleEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2.0}
              defaultEdgeOptions={{ animated: true }}
              className="bg-[#080b11]"
            >
              <Background color="#1e293b" gap={24} size={1} variant={BackgroundVariant.Dots} />
              <Controls className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg overflow-hidden" />
            </ReactFlow>
          </>
        ) : activeApp === 'saas' ? (
          <ApexRoiAppView />
        ) : (
          <div className="flex flex-row w-full h-full bg-[#262421] overflow-hidden select-none">
            {/* 170px Left Sidebar */}
            <aside className="w-[170px] min-w-[170px] bg-[#f8f9fa] border-r border-[#e5e7eb] flex flex-col justify-between p-3 text-[#262421]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-2 py-3 font-black text-lg tracking-tight">
                  <span className="text-[#81b64c]">♟</span>
                  <span>Chess.com</span>
                </div>
                {["Play", "Puzzles", "Learn", "Train", "Watch", "Community"].map((item, idx) => (
                  <button
                    key={item}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                      idx === 0 ? 'bg-[#e5e7eb] text-black' : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <span>{idx === 0 ? "♟" : "🧩"}</span>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">👤</div>
                <span>zemma_6</span>
              </div>
            </aside>

            {/* Center Stage: Walnut Chessboard */}
            <section className="flex-1 flex flex-col items-center justify-center p-4 bg-[#2b2724] relative">
              <div className="w-full max-w-[640px] flex items-center justify-between text-white text-xs font-bold py-1 px-2">
                <span>♟ Endspiel1313 (888) 🇺🇦</span>
                <span className="bg-[#1e1c18] px-3 py-1 rounded font-mono">5:00</span>
              </div>

              {/* 8x8 Walnut Board Grid */}
              <div
                className="w-full max-w-[640px] aspect-square relative shadow-2xl rounded-sm overflow-hidden"
                style={{
                  backgroundImage: "url('/assets/walnut_board.png')",
                  backgroundSize: "100% 100%"
                }}
              >
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                  {gameState.board.map((row, r) =>
                    row.map((piece, c) => {
                      const pos = String.fromCharCode(97 + c) + (8 - r);
                      const isSelected = gameState.selected === pos;
                      const isDark = (r + c) % 2 === 1;
                      const coordColor = isDark ? "hsl(36, 40%, 80%)" : "hsl(30, 30%, 40%)";

                      return (
                        <div
                          key={pos}
                          onClick={() => handleSquareClick(r, c)}
                          className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected ? 'bg-yellow-400/70' : 'hover:bg-yellow-400/20'
                          }`}
                        >
                          {c === 0 && (
                            <span
                              className="absolute top-0.5 left-1 text-[11px] font-black pointer-events-none select-none"
                              style={{ color: coordColor }}
                            >
                              {8 - r}
                            </span>
                          )}
                          {r === 7 && (
                            <span
                              className="absolute bottom-0.5 right-1 text-[11px] font-black pointer-events-none select-none"
                              style={{ color: coordColor }}
                            >
                              {String.fromCharCode(97 + c)}
                            </span>
                          )}
                          {piece && (
                            <img
                              src={`/assets/pieces/${piece}.svg`}
                              alt={piece}
                              className="w-[85%] h-[85%] object-contain pointer-events-none drop-shadow"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="w-full max-w-[640px] flex items-center justify-between text-white text-xs font-bold py-1 px-2">
                <span>♟ zemma_6 (912) 🇮🇳</span>
                <span className="bg-white text-black px-3 py-1 rounded font-mono font-black">🕒 5:00</span>
              </div>
            </section>

            {/* 320px Right Analysis Panel */}
            <aside className="w-[320px] min-w-[320px] bg-white border-l border-slate-200 flex flex-col justify-between text-slate-800 shadow-xl">
              <div>
                <div className="flex border-b border-slate-200 text-xs font-bold bg-slate-50">
                  <div className="flex-1 py-3 text-center border-b-2 border-[#81b64c] text-black">⚡ Analysis</div>
                  <div className="flex-1 py-3 text-center text-slate-500">+ New Game</div>
                  <div className="flex-1 py-3 text-center text-slate-500">🏁 Games</div>
                </div>
                <div className="p-3 border-b border-slate-100 flex justify-between text-xs font-bold text-slate-500 bg-slate-50/50">
                  <span>⚡ Analysis</span>
                  <span>Stockfish 16 Lite ⚙</span>
                </div>
                <div className="p-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                  <div className="text-xs font-bold text-slate-400">Starting Position</div>
                  {gameState.moves.map((move, idx) => (
                    <div key={idx} className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      {idx + 1}. {move}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-slate-200 flex justify-around text-slate-600 text-xs font-bold bg-slate-50">
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">|◀</button>
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">◀</button>
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">▶</button>
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">▶|</button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
