import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  CornerDownLeft,
  Sparkles,
  AlertTriangle,
  User,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';

export default function CenterChat({
  messages,
  onSendMessage,
  onSelectNode,
  onHighlightPath,
  isAsking,
  currentUser
}) {
  const [input, setInput] = useState('');
  const [expandedRagIdx, setExpandedRagIdx] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isAsking) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const toggleRag = (idx) => {
    setExpandedRagIdx((prev) => ({
      ...prev,
      [idx]: prev[idx] === undefined ? false : !prev[idx] // open by default if undefined or toggle
    }));
  };

  // Helper to format inline bold and handles (@handle)
  const renderInlineFormatted = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|@[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-cyan-300 font-semibold font-mono text-xs bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Render text as clean conversational prose with support for markdown headings and bullets
  const renderMessageContent = (text) => {
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    const paragraphs = cleanText.split('\n\n');

    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      return (
        <div key={pIdx} className="space-y-2.5 my-2.5">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('### ')) {
              return (
                <h4 key={lIdx} className="text-sm font-semibold text-white tracking-wide uppercase mt-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                  <span>{trimmed.replace('### ', '')}</span>
                </h4>
              );
            }

            // Bullet items
            if (trimmed.startsWith('- ')) {
              const content = trimmed.replace('- ', '');
              return (
                <div key={lIdx} className="flex items-start gap-2.5 text-sm text-gray-100 leading-relaxed pl-1">
                  <span className="text-[#3B82F6] font-bold mt-1 text-[10px]">•</span>
                  <div className="flex-1">
                    {renderInlineFormatted(content)}
                  </div>
                </div>
              );
            }

            // Regular conversational prose paragraph
            return (
              <p key={lIdx} className="text-sm text-gray-100 leading-relaxed font-normal">
                {renderInlineFormatted(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <section className="w-full lg:w-[38%] h-full bg-[#141414] rounded-2xl flex flex-col overflow-hidden select-none">
      
      {/* 1. Active Session Context Bar */}
      <div className="px-4 py-2.5 bg-[#042254] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0">{currentUser?.avatar || '👨‍💻'}</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-xs truncate">
                {currentUser?.name || 'Arjun Mehta'}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-[#021538] px-1.5 py-0.5 rounded border border-cyan-500/20">
                {currentUser?.handle || '@Arjun'}
              </span>
            </div>
            <span className="text-[11px] text-blue-200/80 truncate">
              {currentUser?.role || 'Senior Backend Eng'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#021538] text-blue-100 border border-blue-400/20">
            {currentUser?.team || 'Backend Dev'}
          </span>
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
            currentUser?.clearance === 'intern'
              ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
          }`}>
            <ShieldCheck className="h-3 w-3" />
            <span>{currentUser?.clearance || 'senior'}</span>
          </span>
        </div>
      </div>

      {/* 2. Team-Specific 1-Click Scenario Chips (2x2 Grid for 1080p Viewports) */}
      <div className="p-4 pb-0">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => onSendMessage("I'm designing the Checkout-UI loading state for 30s based on Arch_Doc_v1.md. Does this follow our active rules?")}
            disabled={isAsking}
            title="Design/Frontend: UX vs Backend Rule Check"
            className="h-9 w-full bg-[#021538] hover:bg-[#031d4d] text-blue-100 hover:text-white font-medium text-xs px-3 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 truncate"
          >
            🎨 UX vs Backend Rule Check (30s Spinner)
          </button>
          
          <button
            type="button"
            onClick={() => onSendMessage("Our QA E2E regression tests on Checkout-UI are failing on 10s timeouts and OAuth login. Is this a test script issue or backend rule change?")}
            disabled={isAsking}
            title="QA/SecOps: QA E2E Test Failure Triage"
            className="h-9 w-full bg-[#021538] hover:bg-[#031d4d] text-blue-100 hover:text-white font-medium text-xs px-3 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 truncate"
          >
            🧪 QA E2E Test Failure Triage
          </button>
          
          <button
            type="button"
            onClick={() => onSendMessage("Can we deploy Checkout-UI to production right now, or does it violate upstream blocker rules?")}
            disabled={isAsking}
            title="Backend Dev: Pre-Deploy Governance Audit"
            className="h-9 w-full bg-[#021538] hover:bg-[#031d4d] text-blue-100 hover:text-white font-medium text-xs px-3 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 truncate"
          >
            🚨 Pre-Deploy Governance Audit
          </button>
          
          <button
            type="button"
            onClick={() => onSendMessage("What happens across Design, QA, and Backend if @Arjun misses the Bug-402 SLA today?")}
            disabled={isAsking}
            title="Architecture: Bus Factor & SLA Risk Audit"
            className="h-9 w-full bg-[#021538] hover:bg-[#031d4d] text-blue-100 hover:text-white font-medium text-xs px-3 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 truncate"
          >
            🚌 Bus Factor & SLA Risk Audit
          </button>
        </div>
      </div>

      {/* 3. Messages Console Stream with generous spacing (space-y-6) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const isRagOpen = expandedRagIdx[idx] !== false; // default open for high impact

          return (
            <div
              key={idx}
              className={`rounded-xl p-6 transition-colors space-y-3 shadow-md ${
                isUser
                  ? 'bg-[#0B1528] max-w-[90%] ml-auto'
                  : 'bg-[#0B1528]'
              }`}
            >
              {/* Header: Sender Info & Telemetry */}
              <div className="flex items-center justify-between text-xs text-blue-100 pb-2.5 border-b border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-[#021538] text-gray-200">
                    {isUser ? <User className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5 text-[#3B82F6]" />}
                  </div>
                  <span className="font-semibold text-white text-sm">
                    {isUser 
                      ? `${msg.user_context?.name || 'Engineer'} (${msg.user_context?.handle || '@User'})` 
                      : 'CortexFlow Brain'}
                  </span>
                  {!isUser && msg.latency_ms && (
                    <span className="text-xs font-mono text-blue-100 px-2.5 py-0.5 rounded-full bg-[#021538] border border-blue-500/20 font-medium">
                      {msg.latency_ms}ms cypher
                    </span>
                  )}
                </div>

                {/* Compliance Verdict Badge on Agent Responses */}
                {!isUser && msg.compliance_verdict && (
                  <div className="flex items-center gap-2">
                    {msg.compliance_verdict === 'VIOLATION' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-xs tracking-wider font-mono">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>RULE VIOLATION</span>
                      </span>
                    )}
                    {msg.compliance_verdict === 'WARNING' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs tracking-wider font-mono">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        <span>BLOCKER WARNING</span>
                      </span>
                    )}
                    {msg.compliance_verdict === 'COMPLIANT' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs tracking-wider font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>COMPLIANT</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div>
                {isUser ? (
                  <p className="text-sm text-white leading-relaxed font-normal">
                    {msg.text}
                  </p>
                ) : (
                  renderMessageContent(msg.text)
                )}
              </div>

              {/* Proactive Blocker / Warning Consolidated Banner */}
              {!isUser && msg.proactive_alerts && msg.proactive_alerts.length > 0 && (() => {
                const isOverdue = msg.proactive_alerts.some((a) => a.severity === 'CRITICAL_OVERDUE');
                const allAffectedSystemNames = [...new Set(msg.proactive_alerts.map((a) => a.system_name || a.system_id).filter(Boolean))];
                const allAlertIds = [...new Set(msg.proactive_alerts.flatMap((a) => [a.system_id, a.bug_id]).filter(Boolean))];
                const primaryAlert = msg.proactive_alerts.find((a) => a.severity === 'CRITICAL_OVERDUE') || msg.proactive_alerts[0];
                const primaryMsg = primaryAlert.message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '').trim();

                return (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onHighlightPath(allAlertIds)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onHighlightPath(allAlertIds);
                    }}
                    className={`mt-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      isOverdue
                        ? 'bg-rose-500/15 border-rose-500/40 hover:border-rose-500/60'
                        : 'bg-amber-500/15 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span className={`${isOverdue ? 'text-rose-300' : 'text-amber-300'} font-bold tracking-wide uppercase text-xs`}>
                          {isOverdue ? 'Critical SLA Overdue Blocker' : 'Downstream Blocker Risk'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {allAffectedSystemNames.map((sysName) => (
                          <span key={sysName} className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-xs font-mono text-gray-100 font-medium">
                            {sysName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-100 leading-relaxed font-sans font-normal">
                      {primaryMsg}
                    </p>
                    {allAffectedSystemNames.length > 1 && (
                      <p className="text-xs text-gray-300 mt-2 flex items-center gap-1.5">
                        <span className="text-gray-400 font-medium">Ripple blast radius:</span>
                        <span className="text-gray-100 font-mono font-medium">{allAffectedSystemNames.join(', ')}</span>
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center justify-end text-xs text-blue-200 hover:text-white transition-colors font-medium">
                      <span>Click to inspect blocker path in graph →</span>
                    </div>
                  </div>
                );
              })()}

              {/* Collapsible Vector RAG vs. FalkorDB GraphRAG Comparison Drawer */}
              {!isUser && msg.vector_rag_comparison && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleRag(idx)}
                    className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#021538] hover:bg-[#031d4d] text-xs font-medium text-cyan-300 transition-colors border border-cyan-500/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-white">
                        ⚡ Vector RAG vs. FalkorDB GraphRAG
                      </span>
                      <span className="text-[11px] text-cyan-200 font-mono">
                        (Why Vector RAG Fails)
                      </span>
                    </div>
                    {isRagOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {isRagOpen && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#0B0E16] border border-white/10 text-xs space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Vector RAG Column */}
                        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-rose-300 font-bold uppercase font-mono text-[11px]">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Standard Vector RAG (Failure Mode)</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-sans">
                            {msg.vector_rag_comparison.vector_rag_result}
                          </p>
                        </div>

                        {/* FalkorDB GraphRAG Column */}
                        <div className="p-3 rounded-lg bg-blue-950/25 border border-blue-500/30 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase font-mono text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                            <span>FalkorDB Multi-Hop GraphRAG (Ground Truth)</span>
                          </div>
                          <p className="text-xs text-gray-200 leading-relaxed font-sans">
                            {msg.vector_rag_comparison.falkordb_graphrag_result}
                          </p>
                        </div>
                      </div>

                      {/* Rot Prevented Banner */}
                      <div className="p-2.5 rounded-lg bg-emerald-950/25 border border-emerald-500/25 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-200">
                          <strong className="text-white font-semibold">Knowledge Rot Prevented: </strong>
                          <span>{msg.vector_rag_comparison.rot_prevented}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}

        {/* Loading Skeleton Indicator */}
        {isAsking && (
          <div className="rounded-xl bg-[#0B1528] shadow-md p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#021538] flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-[#3B82F6]" />
                </div>
                <span className="font-semibold text-white text-xs font-sans">CortexFlow Brain</span>
                <span className="text-[10px] font-sans font-medium text-blue-200 px-2 py-0.5 rounded-full bg-[#021538]">
                  Reasoning
                </span>
              </div>
              <span className="text-[11px] font-sans font-medium text-blue-200">executing Cypher on FalkorDB</span>
            </div>

            <div className="space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-white/10 skeleton-shimmer" />
              <div className="h-3 w-full rounded bg-white/5 skeleton-shimmer" />
              <div className="h-3 w-4/5 rounded bg-white/5 skeleton-shimmer" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Bottom Command Input Field */}
      <div className="px-6 pb-4 pt-1">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask CortexFlow brain as ${currentUser?.handle || '@Arjun'}...`}
            className="w-full h-[52px] rounded-[10px] bg-[#042254] pl-4 pr-28 text-sm text-white placeholder-blue-200/70 focus:outline-none transition-colors shadow-sm border border-white/10 focus:border-[#3B82F6] font-sans"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="submit"
              disabled={!input.trim() || isAsking}
              className="h-[38px] px-4 rounded-[8px] bg-[#3B82F6] hover:bg-[#2B6CB7] text-white text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer font-sans"
            >
              <span className="font-sans">{isAsking ? 'Thinking...' : 'Ask'}</span>
              <CornerDownLeft className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

    </section>
  );
}
