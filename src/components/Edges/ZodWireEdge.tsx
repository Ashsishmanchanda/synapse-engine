import React, { useState } from 'react';
import { 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer, 
  BaseEdge 
} from '@xyflow/react';
import { CheckCircle2, AlertTriangle, X, Radio, ChevronRight } from 'lucide-react';
import { ContractCheckResult } from '../../core/contracts/zodContractValidator';
import { getPinStyle } from '../Nodes/CodeSnippetNode';

export interface ZodWireEdgeData {
  contract?: ContractCheckResult;
  isTransmitting?: boolean;
  lastPayload?: unknown;
  sourceSchema?: string;
  targetSchema?: string;
  onDisconnect?: (edgeId: string) => void;
  onInspectPayload?: (edgeId: string, payload: unknown, contract?: ContractCheckResult) => void;
}

export const ZodWireEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = (data || {}) as ZodWireEdgeData;
  const contract = edgeData.contract;
  const isTransmitting = !!edgeData.isTransmitting;
  const isMismatch = contract?.status === 'mismatch';

  // Unreal / Blender data-type wire coloring
  let strokeColor = '#f59e0b'; // amber default
  if (isMismatch) {
    strokeColor = '#f43f5e'; // rose-500 error
  } else if (isTransmitting) {
    strokeColor = '#ff6600'; // electric orange transmitting
  } else if (contract?.status === 'subtype') {
    strokeColor = '#3b82f6'; // blue-500 subtype
  } else if (edgeData.sourceSchema) {
    const pin = getPinStyle(edgeData.sourceSchema);
    strokeColor = pin.color;
  }

  const customStyle: React.CSSProperties = {
    ...style,
    stroke: strokeColor,
    strokeWidth: isHovered || isTransmitting ? 3.5 : 2.5,
    filter: isHovered
      ? `drop-shadow(0 0 10px ${strokeColor}cc)`
      : isTransmitting 
      ? 'drop-shadow(0 0 10px rgba(255, 102, 0, 0.95))' 
      : isMismatch 
      ? 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.7))' 
      : `drop-shadow(0 0 4px ${strokeColor}44)`,
    transition: 'stroke 0.2s, stroke-width 0.2s, filter 0.2s',
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={customStyle} />

      {/* Pulsing Telemetry Packet along the bezier path if transmitting */}
      {isTransmitting && (
        <circle r="5" fill="#facc15" className="animate-ping">
          <animateMotion dur="0.9s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Edge Interactive Badge in the middle */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`group relative flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono shadow-lg transition-all backdrop-blur-md cursor-pointer border ${
              isMismatch
                ? 'bg-rose-950/90 border-rose-500/80 text-rose-300 hover:bg-rose-900 shadow-rose-950/50'
                : isTransmitting
                ? 'bg-orange-950/90 border-orange-500/80 text-amber-200 hover:bg-orange-900 shadow-orange-950/60 scale-105 ring-1 ring-amber-400/50'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-amber-400/80 hover:bg-slate-850 hover:shadow-[0_0_8px_rgba(245,158,11,0.3)]'
            }`}
            onClick={() => {
              if (edgeData.onInspectPayload) {
                edgeData.onInspectPayload(id, edgeData.lastPayload, contract);
              }
            }}
            title={
              contract?.reason ||
              `Zod Contract: ${edgeData.sourceSchema || 'auto'} ➔ ${edgeData.targetSchema || 'auto'}`
            }
          >
            {/* Status Icon */}
            {isMismatch ? (
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 animate-bounce" />
            ) : isTransmitting ? (
              <Radio className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            )}

            {/* Contract Schema Badge */}
            <span className="truncate max-w-[120px]">
              {isMismatch ? 'Schema Mismatch' : (edgeData.sourceSchema ? edgeData.sourceSchema.replace(/^z\./, '') : 'Zod Wire')}
            </span>

            {/* Hover Disconnect (X) Button */}
            {isHovered && edgeData.onDisconnect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  edgeData.onDisconnect?.(id);
                }}
                className="ml-1 p-0.5 hover:bg-rose-500/30 rounded-full text-slate-400 hover:text-rose-300 transition-colors"
                title="Disconnect Wire"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
