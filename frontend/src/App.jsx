import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LeftPanel from './components/LeftPanel';
import CenterChat from './components/CenterChat';
import RightGraph from './components/RightGraph';
import MainSkeleton from './components/MainSkeleton';
import { RotateCcw, FastForward, ShieldCheck } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: [],
    stats: { total_nodes: 0, total_edges: 0, restricted_hidden_count: 0 },
    active_commitments: [],
    stale_documents: [],
  });

  const [role, setRole] = useState('senior');
  const [latencyMs, setLatencyMs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [isAsking, setIsAsking] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isApprovingDoc, setIsApprovingDoc] = useState(false);

  // Initial welcome message (zero mock data, clean connectivity status)
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: "### cortexflow.brain_online\n" +
            "Self-healing knowledge graph connected to FalkorDB (`cortexflow_brain`).\n\n" +
            "- **Graph Engine**: Real-time Cypher traversals on port 6379.\n" +
            "- **Live Ingestion**: Ingest Slack discussions, architectural decisions, or bug tickets in the Left Panel to execute live `MERGE` queries.\n" +
            "- **Multi-Hop Lineage**: Ask any architectural question below to trace dependency paths, ownership weights, and proactive blast radius alerts.",
      sources: [],
      executed_cypher: '',
      latency_ms: null,
      highlighted_ids: [],
      proactive_alerts: [],
    },
  ]);

  // Fetch full graph state
  const fetchGraph = useCallback(async (currentRole = role) => {
    try {
      const res = await fetch(`${API_BASE}/graph?role=${currentRole}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGraphData(data);
      if (data.latency_ms !== undefined && data.latency_ms !== null) {
        setLatencyMs(data.latency_ms);
      }
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch graph from FalkorDB:', err);
      setIsConnected(false);
    }
  }, [role]);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      await fetchGraph(role);
      // Smooth initial transition so skeleton is shown gracefully
      setTimeout(() => {
        if (isMounted) setInitialLoading(false);
      }, 500);
    };
    initializeApp();

    const interval = setInterval(() => {
      fetchGraph(role);
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchGraph, role]);

  // Keyboard shortcut listener (Escape to clear inspection)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setHighlightedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle role switch (Senior vs Intern RBAC)
  const handleRoleChange = async (newRole) => {
    setIsSwitchingRole(true);
    setRole(newRole);
    await fetchGraph(newRole);
    setTimeout(() => setIsSwitchingRole(false), 350);
  };

  // Handle sending a query to AI agent
  const handleSendMessage = async (question) => {
    setIsAsking(true);

    // Append user message immediately
    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: question,
      },
    ]);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.answer,
          sources: data.sources,
          lineage: data.lineage || [],
          executed_cypher: data.executed_cypher,
          latency_ms: data.latency_ms,
          highlighted_ids: data.highlighted_ids,
          proactive_alerts: data.proactive_alerts,
        },
      ]);

      setLatencyMs(data.latency_ms);
      if (data.highlighted_ids && data.highlighted_ids.length > 0) {
        setHighlightedIds(data.highlighted_ids);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `### query.error\n${err.message}`,
          sources: [],
          executed_cypher: '',
          latency_ms: 0,
          highlighted_ids: [],
          proactive_alerts: [],
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Ingest live event into graph
  const handleIngest = async (payload) => {
    setIsIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      await fetchGraph(role);

      if (data.created_node_ids && data.created_node_ids.length > 0) {
        setHighlightedIds(data.created_node_ids);
        setSelectedNodeId(data.created_node_ids[0]);
      }

      setLatencyMs(data.latency_ms);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `### ingest.merge_completed\n` +
                `- **Source Event**: ${payload.source_type} (${payload.channel_or_title})\n` +
                `- **Payload**: "${payload.text}"\n` +
                `- **Created / Merged Nodes**: \`${data.created_node_ids.join(', ')}\`\n` +
                (data.affected_system_id ? `- **Affected System**: \`${data.affected_system_id}\`\n` : '') +
                (data.flagged_stale_docs?.length > 0 ? `- **Contradicted Docs Flagged**: \`${data.flagged_stale_docs.join(', ')}\`\n` : '') +
                `FalkorDB topology successfully updated in real time via live Cypher MERGE.`,
          sources: (data.created_node_ids || []).map((id) => ({ id, name: id, type: payload.source_type })),
          executed_cypher: data.executed_cypher,
          latency_ms: data.latency_ms,
          highlighted_ids: data.created_node_ids,
          proactive_alerts: [],
        },
      ]);
    } catch (err) {
      alert(`Ingest failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Simulate time decay (+4h)
  const handleSimulateTime = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/simulate-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 4 }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      await fetchGraph(role);

      const overdueList = data.updated_commitments?.filter((c) => c.is_overdue) || [];
      const overdueIds = overdueList.map((c) => c.ticket_id);
      const highlightSet = new Set([...overdueIds, 'p_arjun', 'b_402', 'sys_auth', 'sys_check']);
      setHighlightedIds(Array.from(highlightSet));
      setLatencyMs(data.latency_ms);

      const commitmentLines = (data.updated_commitments || []).map((c) => {
        const statusTag = c.is_overdue ? '**CRITICAL OVERDUE (0h remaining)**' : `**${c.remaining_hours}h left**`;
        return `  - **${c.person}** (${c.handle}) on **${c.ticket_name}**: ${statusTag} (Source: \`${c.source_doc}\`)`;
      }).join('\n');

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `### simulation.clock_advanced\n` +
                `Graph clock advanced by **+${data.hours_advanced} hours** in FalkorDB:\n\n` +
                `- **Updated Commitments**:\n${commitmentLines}\n\n` +
                `- **Blast Radius**: Overdue tickets continue to degrade upstream dependencies and block downstream client applications.\n\n` +
                `Proactive blocker alerts elevated to Critical priority.`,
          sources: (data.updated_commitments || []).map((c) => ({ id: c.ticket_id, name: c.ticket_name, type: 'Ticket' })),
          executed_cypher: data.executed_cypher,
          latency_ms: data.latency_ms,
          highlighted_ids: Array.from(highlightSet),
          proactive_alerts: data.alerts || [],
        },
      ]);
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Approve & Auto-heal stale document
  const handleApproveDoc = async (docId, newContent) => {
    setIsApprovingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/approve-doc-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId, new_content: newContent }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      await fetchGraph(role);
      setHighlightedIds([data.doc_id, 'dec_new', 'sys_pay']);
      setSelectedNodeId(data.doc_id);
      setLatencyMs(data.latency_ms);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `### doc.healed\n` +
                `- **Document Synced**: \`${data.doc_name}\` updated with active consensus:\n` +
                `  *"${data.new_content}"*\n` +
                `- **Status Changed**: \`stale\` → \`${data.new_status}\`\n` +
                `- **Edge Pruned**: \`[:CONTRADICTS]\` relationship deleted in FalkorDB graph.\n\n` +
                `Knowledge drift successfully resolved.`,
          sources: [
            { id: data.doc_id, name: data.doc_name, type: 'Document' },
            { id: 'dec_new', name: 'Decision-02', type: 'Decision' },
          ],
          executed_cypher: data.executed_cypher,
          latency_ms: data.latency_ms,
          highlighted_ids: [data.doc_id, 'dec_new', 'sys_pay'],
          proactive_alerts: [],
        },
      ]);
    } catch (err) {
      alert(`Auto-heal failed: ${err.message}`);
    } finally {
      setIsApprovingDoc(false);
    }
  };

  // Reset graph to clean baseline state
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await fetchGraph(role);
      setHighlightedIds([]);
      setSelectedNodeId(null);
      setLatencyMs(data.latency_ms);

      setMessages([
        {
          sender: 'agent',
          text: "### cortexflow.reset\n" +
                `Graph re-seeded in FalkorDB to clean baseline state (${data.nodes} nodes, ${data.edges} edges).\n\n` +
                "- `Arch_Doc_v1.md` reset to `stale`.\n" +
                "- `@Arjun` reset to 4h remaining SLA on `Bug-402`.\n" +
                "- System ready for live query execution and multi-hop reasoning.",
          sources: [],
          executed_cypher: data.executed_cypher,
          latency_ms: data.latency_ms,
          highlighted_ids: [],
          proactive_alerts: [],
        },
      ]);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Render Skeleton Screen during initial boot / connection phase
  if (initialLoading) {
    return <MainSkeleton />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#141414] text-white p-4 gap-4 relative">
      
      {/* 1. Top Bento Header (Navbar) */}
      <Navbar
        stats={graphData.stats}
        latencyMs={latencyMs}
        role={role}
        onRoleChange={handleRoleChange}
        onSimulateTime={handleSimulateTime}
        onReset={handleReset}
        isSimulating={isSimulating}
        isResetting={isResetting}
        isConnected={isConnected}
      />

      {/* 2. Main 3-Section Bento Box Layout (Padding gaps between rounded-2xl panels) */}
      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row gap-4">
        
        {/* Left Bento: Knowledge Operations (26%) */}
        <LeftPanel
          commitments={graphData.active_commitments}
          staleDocs={graphData.stale_documents}
          onIngest={handleIngest}
          onApproveDoc={handleApproveDoc}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            setHighlightedIds([id]);
          }}
          onHighlightPath={(ids) => setHighlightedIds(ids)}
          isIngesting={isIngesting}
          isApprovingDoc={isApprovingDoc}
          isLoading={!isConnected}
        />

        {/* Center Bento: Agent Reasoning Console (38%) */}
        <CenterChat
          messages={messages}
          onSendMessage={handleSendMessage}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            setHighlightedIds([id]);
          }}
          onHighlightPath={(ids) => setHighlightedIds(ids)}
          isAsking={isAsking}
        />

        {/* Right Bento: Brain Topology Visualizer (36%) */}
        <RightGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          highlightedIds={highlightedIds}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onClearHighlight={() => {
            setHighlightedIds([]);
            setSelectedNodeId(null);
          }}
        />

      </main>

      {/* Action Transition Overlays (in-between operations) */}
      {isResetting && (
        <div className="fixed inset-0 z-50 bg-[#141414]/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="bg-[#042254] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <RotateCcw className="h-6 w-6 text-[#3B82F6] animate-spin" />
            <div className="text-sm font-medium text-white">Re-seeding FalkorDB Brain...</div>
            <div className="text-xs font-mono text-gray-400">loading... (17 canonical nodes & 26 relationships)</div>
          </div>
        </div>
      )}

      {isSimulating && (
        <div className="fixed inset-0 z-50 bg-[#141414]/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="bg-[#042254] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <FastForward className="h-6 w-6 text-amber-400 animate-pulse" />
            <div className="text-sm font-medium text-white">Advancing Time Decay Clock (+4h)...</div>
            <div className="text-xs font-mono text-gray-400">loading... (re-evaluating SLA commitments & blast radius)</div>
          </div>
        </div>
      )}

      {isSwitchingRole && (
        <div className="fixed inset-0 z-50 bg-[#141414]/75 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="bg-[#042254] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#3B82F6] animate-pulse" />
            <div className="text-xs font-medium text-white">Switching Security Clearance...</div>
            <div className="text-[10px] font-mono text-gray-400">loading... (applying {role.toUpperCase()} RBAC policies)</div>
          </div>
        </div>
      )}

    </div>
  );
}
