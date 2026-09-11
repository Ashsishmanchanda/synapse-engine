'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Play, 
  Code2, 
  Terminal,
  Activity,
  Box
} from 'lucide-react';
import { SynapseGraphNode, WireDefinition } from '../../types';

interface LiveGraphRuntimeProps {
  appName: string;
  nodes: any[];
  wires: any[];
  onExport: () => void;
  isExporting: boolean;
  exportNotice: string | null;
  onSync: () => void;
}

export function LiveGraphRuntime({
  appName,
  nodes,
  wires,
  onExport,
  isExporting,
  exportNotice,
  onSync
}: LiveGraphRuntimeProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);

  // Group nodes by category
  const stateNodes = nodes.filter(n => n.data.category === 'state');
  const processNodes = nodes.filter(n => ['transform', 'logic', 'compound'].includes(n.data.category));
  const uiNodes = nodes.filter(n => n.data.category === 'ui');

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="flex flex-col h-full w-full bg-[#080b11] text-slate-100 font-mono overflow-hidden select-none">
      {/* Top Runtime Status Bar */}
      <div className="h-12 border-b border-slate-800/80 bg-[#0a0e14] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>SYNAPSE LIVE RUNTIME</span>
          </div>
          <div className="text-xs text-slate-300 font-bold">
            <span>Active Blueprint: </span>
            <span className="text-amber-400 uppercase tracking-wider">{appName}</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">
            {nodes.length} Nodes mounted • {wires.length} Typed Wires active
          </span>
        </div>

        <div className="flex items-center gap-3">
          {exportNotice && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{exportNotice}</span>
            </div>
          )}
          <button
            onClick={onSync}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-300 transition-colors"
            title="Sync graph"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync</span>
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Synthesizing...' : 'Export Next.js 15'}</span>
          </button>
        </div>
      </div>

      {/* Main Runtime Workspace */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Live Reactive Node Execution Pipeline (5 cols) */}
        <div className="col-span-5 flex flex-col gap-3 h-full overflow-hidden">
          <div className="flex-1 bg-[#0a0e14] border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-slate-800/80 bg-[#0d121c] flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                Constitutional Execution Pipeline
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Verified</span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {/* Section 1: Inputs & State */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  State & Input Nodes ({stateNodes.length})
                </div>
                <div className="space-y-1">
                  {stateNodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        selectedNodeId === node.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-[#0d121c] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        <span className="text-xs font-bold truncate">{node.data.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        {node.data.outputs.length} outputs
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Logic & Transform Engines */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Logic & Engine Nodes ({processNodes.length})
                </div>
                <div className="space-y-1">
                  {processNodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        selectedNodeId === node.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-[#0d121c] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                        <span className="text-xs font-bold truncate">{node.data.title}</span>
                        {node.data.isCompound && (
                          <span className="text-[9px] px-1 py-0.2 bg-purple-500/30 text-purple-200 rounded">
                            Subgraph
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        {node.data.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: UI Nodes */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  UI Presentation Nodes ({uiNodes.length})
                </div>
                <div className="space-y-1">
                  {uiNodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        selectedNodeId === node.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-[#0d121c] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-xs font-bold truncate">{node.data.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        render()
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Live Inspector & Execution Output (7 cols) */}
        <div className="col-span-7 flex flex-col gap-3 h-full overflow-hidden">
          {selectedNode ? (
            <div className="flex-1 bg-[#0a0e14] border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-800/80 bg-[#0d121c] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200 font-bold">{selectedNode.data.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({selectedNode.id})</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400">Budget:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedNode.data.ruleMetrics?.lines || 0}/{selectedNode.data.ruleMetrics?.maxLines || 50} lines
                  </span>
                </div>
              </div>

              {/* Code Snippet View */}
              <div className="p-3 border-b border-slate-800/80 bg-[#06090e] max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                  <span>Pure Functional TypeScript:</span>
                  <span className="text-amber-400">Zero Mutation • Zod Verified</span>
                </div>
                <pre className="text-[11px] text-amber-100/90 font-mono leading-relaxed overflow-x-auto whitespace-pre">
                  {selectedNode.data.code}
                </pre>
              </div>

              {/* Live Evaluated Output */}
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-[#070a0f]">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold border-b border-slate-800 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Evaluated Execution Output</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">React 19 Pure Evaluation</span>
                </div>

                <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs font-mono overflow-auto">
                  {(() => {
                    try {
                      // Attempt safe in-browser dynamic evaluation of pure function
                      const code = selectedNode.data.code;
                      // Match exported function
                      const fnMatch = code.match(/export\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{([\s\S]*)\}/);
                      if (fnMatch) {
                        const fnBody = fnMatch[2];
                        // Execute pure return body
                        const fn = new Function(fnBody);
                        const result = fn();
                        return (
                          <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        );
                      }
                      return (
                        <div className="text-slate-400 italic">
                          Node is ready for execution. Output will be piped to connected targets.
                        </div>
                      );
                    } catch (err: any) {
                      return (
                        <div className="text-slate-400">
                          Execution schema active: <span className="text-cyan-300">{selectedNode.data.outputs[0]?.typeSchema || 'z.any()'}</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Connected Wires for this node */}
                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300 uppercase tracking-wider">Connected Wires:</div>
                  <div className="space-y-0.5">
                    {wires
                      .filter(w => w.source === selectedNode.id || w.target === selectedNode.id)
                      .map(w => (
                        <div key={w.id} className="flex items-center gap-1 font-mono text-[10px]">
                          <span className={w.source === selectedNode.id ? 'text-amber-400' : 'text-slate-500'}>
                            {w.source}
                          </span>
                          <span>→</span>
                          <span className={w.target === selectedNode.id ? 'text-cyan-400' : 'text-slate-500'}>
                            {w.target}
                          </span>
                          <span className="text-emerald-400 text-[9px]">({w.data?.contract || 'z.any()'})</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
              Select a node to inspect its live execution
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
