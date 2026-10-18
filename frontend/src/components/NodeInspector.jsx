import React from 'react';
import { 
  X, 
  ArrowRight,
  ArrowLeft,
  Shield
} from 'lucide-react';

export default function NodeInspector({ 
  node, 
  edges, 
  allNodes, 
  onClose, 
  onSelectNode 
}) {
  if (!node) return null;

  const props = node.properties || {};
  const isRestricted = props.sensitivity === 'restricted' || node.locked;

  // Find incoming and outgoing edges
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  const outbound = connectedEdges.filter((e) => e.source === node.id);
  const inbound = connectedEdges.filter((e) => e.target === node.id);

  const getNodeName = (id) => {
    const found = allNodes.find((n) => n.id === id);
    return found ? found.properties?.name || found.id : id;
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-[#042254] rounded-2xl shadow-2xl p-6 text-xs z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
      
      {/* 1. Header: Title, Label & Dismiss */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-white text-base tracking-tight">
            {props.name || node.id}
          </span>
          
          <span className="text-xs font-mono text-blue-100 px-2.5 py-0.5 rounded-full bg-[#021538] border border-blue-500/20 font-medium">
            {node.label} · R{node.ring || 3}
          </span>

          {isRestricted && (
            <span className="text-xs font-mono text-purple-200 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-1 font-medium">
              <Shield className="h-3.5 w-3.5 text-purple-300" />
              <span>Restricted</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-blue-200 hover:text-white bg-[#021538] hover:bg-[#010e24] transition-colors border border-white/5"
          title="Close inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Key Attributes Inspection */}
      <div className="py-3 space-y-2 text-sm text-blue-100">
        {node.label === 'Person' && (
          <div className="flex items-center gap-4 text-blue-200 text-xs md:text-sm">
            <span>Handle: <strong className="text-[#3B82F6] font-mono font-semibold">{props.handle}</strong></span>
            <span>Role: <strong className="text-white font-medium">{props.role}</strong></span>
            <span>Team: <strong className="text-white font-medium">{props.team}</strong></span>
          </div>
        )}

        {node.label === 'System' && (
          <div className="flex items-center gap-4 text-blue-200 text-xs md:text-sm">
            <span>Tier: <strong className="text-white font-semibold">{props.tier}</strong></span>
            <span>
              Health:{' '}
              <strong className={props.status === 'degraded' ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {props.status}
              </strong>
            </span>
          </div>
        )}

        {node.label === 'Ticket' && (
          <div className="flex items-center gap-4 text-blue-200 text-xs md:text-sm">
            <span>Kind: <strong className="text-white font-semibold">{props.kind}</strong></span>
            <span>Status: <strong className="text-white font-semibold">{props.status}</strong></span>
            {props.remaining_hours !== undefined && (
              <span>
                SLA:{' '}
                <strong className={`font-mono font-semibold ${props.remaining_hours <= 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                  {props.remaining_hours <= 0 ? 'OVERDUE (0h)' : `${props.remaining_hours}h left`}
                </strong>
              </span>
            )}
          </div>
        )}

        {(props.title || props.content) && (
          <div className="bg-[#021538] border border-white/5 p-3.5 rounded-lg text-blue-50 text-xs md:text-sm leading-relaxed font-normal">
            {props.title || props.content}
          </div>
        )}
      </div>

      {/* 3. Graph Lineage Relationships */}
      <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
        
        {/* Outbound Edges */}
        <div>
          <span className="text-blue-200 flex items-center gap-1.5 mb-1.5 font-semibold text-xs uppercase tracking-wide">
            <ArrowRight className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Outbound ({outbound.length})</span>
          </span>
          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
            {outbound.map((edge, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectNode(edge.target)}
                className="w-full text-left truncate text-blue-100 hover:text-white bg-[#021538] hover:bg-[#062d6e] px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-white/5 text-xs font-medium"
              >
                <span className="text-[#3B82F6] font-mono text-xs">{edge.type}</span>
                <span className="text-gray-400">→</span>
                <span className="truncate">{getNodeName(edge.target)}</span>
              </button>
            ))}
            {outbound.length === 0 && <span className="text-gray-400 italic text-xs">None</span>}
          </div>
        </div>

        {/* Inbound Edges */}
        <div>
          <span className="text-blue-200 flex items-center gap-1.5 mb-1.5 font-semibold text-xs uppercase tracking-wide">
            <ArrowLeft className="h-3.5 w-3.5 text-gray-300" />
            <span>Inbound ({inbound.length})</span>
          </span>
          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
            {inbound.map((edge, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectNode(edge.source)}
                className="w-full text-left truncate text-blue-100 hover:text-white bg-[#021538] hover:bg-[#062d6e] px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-white/5 text-xs font-medium"
              >
                <span className="text-gray-300 font-mono text-xs">{edge.type}</span>
                <span className="text-gray-400">←</span>
                <span className="truncate">{getNodeName(edge.source)}</span>
              </button>
            ))}
            {inbound.length === 0 && <span className="text-gray-400 italic text-xs">None</span>}
          </div>
        </div>
      </div>

    </div>
  );
}
