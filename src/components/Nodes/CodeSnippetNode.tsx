import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Code2, 
  Scissors, 
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from 'lucide-react';
import { CodeSnippetNodeType } from '../../types';
import { MiniCodeEditor } from '../Editor/MiniCodeEditor';

export function getPinStyle(typeSchema: string = '', direction?: string) {
  if (direction === 'err') {
    return { color: '#f43f5e', tag: 'err', bg: 'bg-rose-500/20', border: 'border-rose-500', dot: 'bg-rose-500' };
  }
  const s = typeSchema.toLowerCase();
  if (s.includes('boolean')) {
    return { color: '#facc15', tag: 'bool', bg: 'bg-yellow-400/20', border: 'border-yellow-400', dot: 'bg-yellow-400' };
  }
  if (s.includes('object') || s.includes('{')) {
    return { color: '#ff6600', tag: 'obj', bg: 'bg-orange-500/20', border: 'border-orange-500', dot: 'bg-orange-500' };
  }
  if (s.includes('number') || s.includes('int') || s.includes('float')) {
    return { color: '#a3e635', tag: 'num', bg: 'bg-lime-400/20', border: 'border-lime-400', dot: 'bg-lime-400' };
  }
  if (s.includes('array') || s.includes('[]')) {
    return { color: '#c084fc', tag: 'arr', bg: 'bg-purple-500/20', border: 'border-purple-400', dot: 'bg-purple-400' };
  }
  return { color: '#f59e0b', tag: 'str', bg: 'bg-amber-400/20', border: 'border-amber-400', dot: 'bg-amber-400' };
}

export const CodeSnippetNode: React.FC<NodeProps<CodeSnippetNodeType>> = ({ data, selected }) => {
  const [copied, setCopied] = useState(false);
  const [showViolations, setShowViolations] = useState(false);

  const {
    id,
    domain,
    module,
    action,
    title,
    category,
    code,
    isExpanded,
    inputs = [],
    outputs = [],
    ruleMetrics,
    collapsedChildCount,
    onCodeChange,
    onToggleExpand,
    onDrillDown,
    onSplitNode,
  } = data;

  const isCompound = category === 'compound' || Boolean((data as any).isCompound) || Boolean((data as any).targetSubgraphId);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Unreal/Blender domain header color styling with bright orange & yellow
  const getDomainHeaderGradient = () => {
    const d = (domain || '').toLowerCase();
    if (d.includes('auth') || d.includes('security') || d.includes('crypto')) {
      return 'from-amber-600/90 via-orange-600/80 to-slate-950 border-b border-amber-400/60 text-amber-100 shadow-[0_4px_12px_rgba(245,158,11,0.15)]';
    }
    if (d.includes('physics') || d.includes('engine') || d.includes('game')) {
      return 'from-orange-600/90 via-amber-600/80 to-slate-950 border-b border-orange-400/60 text-orange-100 shadow-[0_4px_12px_rgba(255,102,0,0.15)]';
    }
    if (d.includes('math') || d.includes('transform')) {
      return 'from-yellow-500/90 via-amber-600/80 to-slate-950 border-b border-yellow-400/60 text-yellow-100 shadow-[0_4px_12px_rgba(250,204,21,0.15)]';
    }
    if (d.includes('io') || d.includes('input') || d.includes('network')) {
      return 'from-orange-500/90 via-amber-700/80 to-slate-950 border-b border-orange-400/60 text-orange-100 shadow-[0_4px_12px_rgba(255,102,0,0.15)]';
    }
    return 'from-amber-700/80 via-orange-900/70 to-slate-950 border-b border-amber-500/40 text-amber-200';
  };

  const getStatusBorder = () => {
    if (ruleMetrics?.status === 'violated') {
      return 'border-rose-500 shadow-glow-crimson ring-1 ring-rose-500/60';
    }
    if (ruleMetrics?.status === 'warning') {
      return 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.45)] ring-1 ring-yellow-400/60';
    }
    if (selected) {
      return 'border-orange-500 shadow-[0_0_24px_rgba(255,102,0,0.7)] ring-2 ring-amber-400';
    }
    return 'border-slate-800 hover:border-amber-500/60 hover:shadow-[0_0_14px_rgba(245,158,11,0.25)]';
  };

  const maxLines = ruleMetrics?.maxLines || 10;
  const currentLines = ruleMetrics?.lines || 0;
  const maxStatements = ruleMetrics?.maxStatements || 6;
  const currentStatements = ruleMetrics?.statements || 0;
  const linePercentage = Math.min(100, Math.round((currentLines / maxLines) * 100));

  // Determine row count for multi-input/multi-output alignment
  const maxRows = Math.max(inputs.length, outputs.length, 1);

  return (
    <div
      className={`relative rounded-xl bg-[#0c1017] border backdrop-blur-md text-slate-100 font-mono transition-all duration-200 ${
        isExpanded ? 'w-96' : 'w-72'
      } ${getStatusBorder()}`}
      onDoubleClick={() => {
        if (isCompound && onDrillDown) {
          onDrillDown((data as any).targetSubgraphId || id, title);
        } else if (onToggleExpand) {
          onToggleExpand(id);
        }
      }}
    >
      {/* 1. Unreal / Blender Title Bar */}
      <div className={`px-3 py-2 rounded-t-xl bg-gradient-to-r ${getDomainHeaderGradient()} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan shrink-0" />
          <div className="truncate">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase text-slate-300">
              <span>{domain}/{module}</span>
              {isCompound && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDrillDown) onDrillDown((data as any).targetSubgraphId || id, title);
                  }}
                  className="text-[8px] bg-purple-500/30 hover:bg-purple-500/60 text-purple-200 px-1 py-0.2 rounded border border-purple-400/40 flex items-center gap-0.5 cursor-pointer transition-colors"
                  title="Click to enter subgraph level"
                >
                  <Layers className="w-2.5 h-2.5" /> Subgraph ({collapsedChildCount || 0}) ↵
                </button>
              )}
            </div>
            <h4 className="text-xs font-bold text-white truncate tracking-wide">{title || action}</h4>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {isCompound && onDrillDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown((data as any).targetSubgraphId || id, title);
              }}
              title="Drill Down into Subgraph Level"
              className="p-1 hover:bg-white/10 text-purple-300 rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Code Drawer */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleExpand) onToggleExpand(id);
            }}
            title={isExpanded ? 'Hide Code Drawer' : 'Inspect Micro-Function (< 10 lines)'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isExpanded
                ? 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(251,146,60,0.5)]'
                : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-600/40 text-amber-300 hover:text-white'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>{isExpanded ? 'Hide' : 'Code'}</span>
          </button>

          {/* Copy Snippet */}
          <button
            onClick={handleCopyCode}
            title="Copy Clean TypeScript"
            className="p-1 hover:bg-white/10 text-slate-400 hover:text-slate-100 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Blender / Unreal Style Multi-Input & Multi-Output Pin Stack */}
      <div className="p-2.5 space-y-1.5 bg-[#090d14]/90">
        {Array.from({ length: maxRows }).map((_, rowIndex) => {
          const inPort = inputs[rowIndex];
          const outPort = outputs[rowIndex];
          const inStyle = inPort ? getPinStyle(inPort.typeSchema, inPort.direction) : null;
          const outStyle = outPort ? getPinStyle(outPort.typeSchema, outPort.direction) : null;

          return (
            <div key={rowIndex} className="flex items-center justify-between gap-3 min-h-[22px] relative text-xs">
              {/* Left Pin (Input) */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {inPort ? (
                  <>
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={inPort.id}
                      className={`!w-3 !h-3 !-left-[18px] !border-2 !border-[#0c1017] ${inStyle?.dot || '!bg-cyan-400'} transition-transform hover:scale-125`}
                      title={`${inPort.name}: ${inPort.typeSchema}`}
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${inStyle?.dot} shrink-0`} />
                      <span className="text-[11px] font-medium text-slate-200 truncate">{inPort.name}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${inStyle?.bg} text-slate-300`}>
                        {inStyle?.tag}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1" />
                )}
              </div>

              {/* Right Pin (Output) */}
              <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
                {outPort ? (
                  <>
                    <div className="flex items-center justify-end gap-1.5 min-w-0 text-right">
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${outStyle?.bg} text-slate-300`}>
                        {outStyle?.tag}
                      </span>
                      <span className="text-[11px] font-medium text-slate-200 truncate">{outPort.name}</span>
                      <div className={`w-2 h-2 rounded-full ${outStyle?.dot} shrink-0`} />
                    </div>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={outPort.id}
                      className={`!w-3 !h-3 !-right-[18px] !border-2 !border-[#0c1017] ${outStyle?.dot || '!bg-emerald-400'} transition-transform hover:scale-125`}
                      title={`${outPort.name}: ${outPort.typeSchema}`}
                    />
                  </>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2.5 Compound Subgraph Quick-Access Banner */}
      {isCompound && (
        <div className="px-3 py-2 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border-t border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-mono">
            <Layers className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Compound Subgraph ({collapsedChildCount || 0} nodes)</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDrillDown) onDrillDown((data as any).targetSubgraphId || id, title);
            }}
            className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:shadow-[0_0_15px_rgba(168,85,247,0.7)] transition-all cursor-pointer"
          >
            <span>Inspect Level</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. Constitutional Status Pill Strip */}
      <div className="px-3 py-1.5 bg-[#070a0f] border-t border-slate-800/80 rounded-b-xl flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          {ruleMetrics?.status === 'violated' ? (
            <XCircle className="w-3 h-3 text-rose-500" />
          ) : ruleMetrics?.status === 'warning' ? (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
          <span className={currentLines > maxLines ? 'text-rose-400 font-bold' : 'text-slate-300'}>
            {currentLines}/{maxLines} lines
          </span>
          <span className="text-slate-600">•</span>
          <span>{currentStatements}/{maxStatements} stmts</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowViolations(!showViolations);
          }}
          className={`text-[9px] underline ${
            (ruleMetrics?.violations?.length || 0) > 0 ? 'text-amber-400 hover:text-rose-400' : 'text-slate-500'
          }`}
        >
          {ruleMetrics?.violations?.length || 0} checks
        </button>
      </div>

      {/* 4. Slide-Out Micro-Code Drawer (Hidden by default, shown when isExpanded = true) */}
      {isExpanded && (
        <div className="p-3 bg-[#0a0e14] border-t border-slate-800 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-bold text-cyan-300">Constitutional Micro-Function:</span>
            <span className="text-slate-500 font-mono">Max 10 lines • Pure Functional</span>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-800">
            <MiniCodeEditor
              initialCode={code}
              onChange={(newCode) => {
                if (onCodeChange) onCodeChange(id, newCode);
              }}
            />
          </div>

          {/* Lisp Budget Meter */}
          <div className="space-y-1">
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  currentLines > maxLines
                    ? 'bg-rose-500'
                    : currentLines >= maxLines - 2
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${linePercentage}%` }}
              />
            </div>
          </div>

          {/* Lisp Diagnostics Popover if violated */}
          {(showViolations || ruleMetrics?.status === 'violated') && (ruleMetrics?.violations?.length || 0) > 0 && (
            <div className="p-2 bg-rose-950/40 rounded-lg border border-rose-800/50 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between font-semibold text-rose-400">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Clojure Spec Failure:</span>
                </span>
                {currentLines > maxLines && onSplitNode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSplitNode(id);
                    }}
                    className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/40 transition-colors"
                  >
                    <Scissors className="w-2.5 h-2.5" /> Auto-Split
                  </button>
                )}
              </div>
              {ruleMetrics?.violations?.map((v, i) => (
                <div key={i} className="text-slate-300 font-mono text-[9px] leading-relaxed">
                  <div className="text-amber-300">• {v.message}</div>
                  {v.fixSuggestion && (
                    <div className="text-cyan-300 pl-2">➔ {v.fixSuggestion}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
