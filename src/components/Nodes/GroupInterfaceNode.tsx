import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { LogIn, LogOut, Plus, Trash2 } from 'lucide-react';
import { PortDefinition } from '../../types';

export interface GroupInterfaceNodeData extends Record<string, unknown> {
  id: string;
  kind: 'input' | 'output';
  title: string;
  ports: PortDefinition[];
  onAddPort?: (kind: 'input' | 'output') => void;
  onRemovePort?: (kind: 'input' | 'output', portId: string) => void;
}

export const GroupInterfaceNode: React.FC<NodeProps<any>> = ({ data }) => {
  const { kind, title, ports = [], onAddPort, onRemovePort } = data as GroupInterfaceNodeData;
  const isInput = kind === 'input';

  return (
    <div className="w-64 rounded-xl bg-synapse-panel/95 backdrop-blur-md border border-synapse-purple/60 shadow-lg shadow-purple-950/30 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-synapse-purple/15 border-b border-synapse-purple/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInput ? (
            <LogIn className="w-4 h-4 text-synapse-purple" />
          ) : (
            <LogOut className="w-4 h-4 text-synapse-purple" />
          )}
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-display">{title}</h4>
            <p className="text-[9px] text-slate-400 font-mono">
              {isInput ? 'Incoming parent ports' : 'Outgoing parent ports'}
            </p>
          </div>
        </div>

        {onAddPort && (
          <button
            onClick={() => onAddPort(kind)}
            className="p-1 hover:bg-synapse-purple/30 text-synapse-purple rounded transition-colors"
            title="Add External Interface Port"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ports List */}
      <div className="p-2 space-y-2">
        {ports.length === 0 ? (
          <div className="text-[10px] font-mono text-slate-500 italic text-center py-2">
            No boundary pins exposed yet.
          </div>
        ) : (
          ports.map((port) => (
            <div
              key={port.id}
              className="relative flex items-center justify-between px-2.5 py-1.5 bg-synapse-card rounded border border-synapse-border/80 text-xs font-mono"
            >
              {/* If Group Inputs: Handle is on RIGHT (feeds internal nodes) */}
              {isInput && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={port.id}
                  className="!w-2.5 !h-2.5 !bg-synapse-purple !border-synapse-panel"
                />
              )}

              <div className="truncate">
                <span className="text-synapse-purple font-semibold">{port.name}</span>
                <span className="text-[10px] text-slate-400 pl-1 font-sans">({port.typeSchema})</span>
              </div>

              {/* If Group Outputs: Handle is on LEFT (receives internal nodes) */}
              {!isInput && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port.id}
                  className="!w-2.5 !h-2.5 !bg-synapse-purple !border-synapse-panel"
                />
              )}

              {onRemovePort && (
                <button
                  onClick={() => onRemovePort(kind, port.id)}
                  className="text-slate-500 hover:text-synapse-crimson transition-colors ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
