import React, { useState, useMemo, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2 
} from 'lucide-react';
import NodeInspector from './NodeInspector';

export default function RightGraph({
  nodes,
  edges,
  highlightedIds,
  selectedNodeId,
  onSelectNode,
  onClearHighlight
}) {
  const [filter, setFilter] = useState('ALL');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const containerRef = useRef(null);

  const WIDTH = 680;
  const HEIGHT = 640;
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Concentric spatial reference tracks
  const R1 = 85;   // Ring 1: Core Systems
  const R2 = 175;  // Ring 2: People & Ownership
  const R3 = 265;  // Ring 3: Context & Decisions

  // Compute 2D node coordinates
  const positionedNodes = useMemo(() => {
    const ring1Nodes = nodes.filter((n) => n.ring === 1 || n.label === 'System');
    const ring2Nodes = nodes.filter((n) => n.ring === 2 || n.label === 'Person');
    const ring3Nodes = nodes.filter((n) => (n.ring === 3 || !n.ring) && n.label !== 'System' && n.label !== 'Person');

    const result = {};

    ring1Nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / (ring1Nodes.length || 1) - Math.PI / 2;
      result[node.id] = {
        ...node,
        x: cx + R1 * Math.cos(angle),
        y: cy + R1 * Math.sin(angle),
      };
    });

    ring2Nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / (ring2Nodes.length || 1) - Math.PI / 4;
      result[node.id] = {
        ...node,
        x: cx + R2 * Math.cos(angle),
        y: cy + R2 * Math.sin(angle),
      };
    });

    ring3Nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / (ring3Nodes.length || 1) - Math.PI / 6;
      result[node.id] = {
        ...node,
        x: cx + R3 * Math.cos(angle),
        y: cy + R3 * Math.sin(angle),
      };
    });

    return result;
  }, [nodes]);

  // Compute 1-hop neighbor IDs for hovered node
  const neighborIds = useMemo(() => {
    if (!hoveredNodeId) return new Set();
    const set = new Set([hoveredNodeId]);
    edges.forEach((e) => {
      if (e.source === hoveredNodeId) set.add(e.target);
      if (e.target === hoveredNodeId) set.add(e.source);
    });
    return set;
  }, [hoveredNodeId, edges]);

  // Extract initials for person nodes
  const getInitials = (name) => {
    if (!name) return 'CF';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Semantic node colors
  const getNodeFill = (node) => {
    const isLocked = node.locked || node.properties?.sensitivity === 'restricted';
    const status = node.properties?.status;
    const kind = node.properties?.kind;

    if (isLocked) return '#94A3B8';
    if (status === 'degraded' || kind === 'bug') return '#F43F5E';
    if (status === 'stale') return '#F59E0B';
    if (node.label === 'System') return '#6366F1';
    if (node.label === 'Person') return '#0EA5E9';
    return '#10B981';
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || (e.target.tagName === 'circle' && e.target.id?.startsWith('ring-guide'))) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const hoveredNode = hoveredNodeId ? nodes.find((n) => n.id === hoveredNodeId) : null;

  return (
    <section className="w-full lg:w-[36%] h-full bg-[#141927] rounded-2xl border border-white/5 flex flex-col overflow-hidden relative select-none">
      
      {/* 1. Top Segmented Filter Bar (Clean background hover shift) */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-2 z-10">
        
        {/* Pill-shaped Segmented Filter Bar */}
        <div 
          role="radiogroup" 
          aria-label="Filter Graph Layers"
          className="flex items-center bg-[#181C29] border border-white/5 rounded-full p-1 text-xs font-medium"
        >
          {['ALL', 'Systems', 'People', 'Truth', 'Drift', 'Blockers'].map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full transition-colors text-xs ${
                filter === f
                  ? 'bg-[#141927] text-white font-medium border border-white/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View Zoom & Center Controls */}
        <div className="flex items-center bg-[#181C29] border border-white/5 rounded-full p-1 text-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#141927] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#141927] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              onClearHighlight();
            }}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#141927] transition-colors"
            title="Reset Topology View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas (Ultra-clean, zero neon glow) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full select-none"
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} transform-origin="center">
            
            {/* 3 Concentric Spatial Reference Rings */}
            <g className="transition-opacity duration-300">
              <circle
                id="ring-guide-1"
                cx={cx}
                cy={cy}
                r={R1}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={cx} y={cy - R1 - 8} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="SF Mono, monospace">
                R1 · CORE SYSTEMS
              </text>

              <circle
                id="ring-guide-2"
                cx={cx}
                cy={cy}
                r={R2}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={cx} y={cy - R2 - 8} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="SF Mono, monospace">
                R2 · OWNERSHIP & PEOPLE
              </text>

              <circle
                id="ring-guide-3"
                cx={cx}
                cy={cy}
                r={R3}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={cx} y={cy - R3 - 8} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="SF Mono, monospace">
                R3 · DECISIONS & TICKETS
              </text>
            </g>

            {/* Graph Edges (Thin, ultra-clean lines) */}
            <g>
              {edges.map((edge, idx) => {
                const sNode = positionedNodes[edge.source];
                const tNode = positionedNodes[edge.target];
                if (!sNode || !tNode) return null;

                const isHighlighted =
                  highlightedIds.includes(edge.source) &&
                  highlightedIds.includes(edge.target);

                const isNeighbor =
                  hoveredNodeId &&
                  (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

                const isContradiction = edge.type === 'CONTRADICTS';
                const isOverdueCommitment = edge.type === 'COMMITTED_TO' && edge.properties?.remaining_hours <= 0;

                let strokeColor = 'rgba(255, 255, 255, 0.08)';
                let strokeWidth = 1;
                let strokeDash = undefined;

                if (isContradiction) {
                  strokeColor = '#F59E0B';
                  strokeWidth = 1.5;
                  strokeDash = '3 3';
                } else if (isOverdueCommitment) {
                  strokeColor = '#F43F5E';
                  strokeWidth = 1.5;
                } else if (isHighlighted || isNeighbor) {
                  strokeColor = '#06B6D4';
                  strokeWidth = 1.5;
                }

                return (
                  <line
                    key={idx}
                    x1={sNode.x}
                    y1={sNode.y}
                    x2={tNode.x}
                    y2={tNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    className="transition-all duration-300 pointer-events-none"
                  />
                );
              })}
            </g>

            {/* Graph Nodes */}
            <g>
              {Object.values(positionedNodes).map((node) => {
                if (filter === 'Systems' && node.label !== 'System') return null;
                if (filter === 'People' && node.label !== 'Person') return null;
                if (filter === 'Truth' && (node.properties?.status === 'stale' || node.properties?.status === 'degraded')) return null;
                if (filter === 'Drift' && node.properties?.status !== 'stale') return null;
                if (filter === 'Blockers' && node.properties?.status !== 'degraded' && node.properties?.kind !== 'bug') return null;

                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedIds.includes(node.id);
                const isHovered = hoveredNodeId === node.id;
                const isConnected = hoveredNodeId ? neighborIds.has(node.id) : true;

                const fill = getNodeFill(node);
                const radius = node.label === 'System' ? 17 : node.label === 'Person' ? 14 : 11;

                const opacity = hoveredNodeId ? (isConnected ? 1 : 0.2) : 1;

                return (
                  <g
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{ opacity }}
                    className="cursor-pointer transition-opacity duration-200"
                  >
                    {/* Clean Selection Ring */}
                    {(isSelected || isHighlighted) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius + 5}
                        fill="none"
                        stroke={fill}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={fill}
                      stroke={isSelected || isHighlighted || isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth={isSelected || isHighlighted || isHovered ? 2 : 1}
                    />

                    {/* Node Interior */}
                    {node.label === 'Person' && (
                      <text
                        x={node.x}
                        y={node.y + 3.5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="-apple-system, sans-serif"
                        className="pointer-events-none select-none"
                      >
                        {getInitials(node.properties?.name)}
                      </text>
                    )}

                    {/* Node Label Below */}
                    <text
                      x={node.x}
                      y={node.y + radius + 12}
                      textAnchor="middle"
                      fill={isSelected || isHovered ? '#FFFFFF' : '#9CA3AF'}
                      fontSize="9.5"
                      fontWeight={isSelected ? '500' : '400'}
                      fontFamily="-apple-system, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {node.properties?.name || node.id}
                    </text>
                  </g>
                );
              })}
            </g>

          </g>
        </svg>

        {/* Loading overlay when nodes are not yet loaded */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="px-4 py-2 rounded-full bg-[#141927]/90 border border-white/10 backdrop-blur-md flex items-center gap-2 shadow-2xl">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-ping" />
              <span className="text-xs font-mono text-gray-300">
                loading...
              </span>
            </div>
          </div>
        )}

        {/* Hover Popover Tooltip */}
        {hoveredNode && !selectedNode && (
          <div className="absolute top-4 left-4 bg-[#181C29] border border-white/5 rounded-xl p-4 text-xs pointer-events-none z-20 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {hoveredNode.properties?.name || hoveredNode.id}
              </span>
              <span className="text-[10px] font-mono text-gray-400 px-2 py-0.5 rounded-full bg-[#101420] border border-white/5">
                {hoveredNode.label}
              </span>
            </div>
            {hoveredNode.properties?.role && (
              <div className="text-gray-400 text-xs">
                {hoveredNode.properties.role} · {hoveredNode.properties.team}
              </div>
            )}
            {hoveredNode.properties?.status && (
              <div className="text-[11px] text-gray-400">
                Status: <strong className={hoveredNode.properties.status === 'degraded' ? 'text-rose-400' : 'text-gray-300'}>
                  {hoveredNode.properties.status}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Slide-Up Node Inspector Drawer */}
        <NodeInspector
          node={selectedNode}
          edges={edges}
          allNodes={nodes}
          onClose={() => onSelectNode(null)}
          onSelectNode={onSelectNode}
        />

      </div>
    </section>
  );
}
