import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Cpu, 
  CornerDownLeft,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  User
} from 'lucide-react';

export default function CenterChat({
  messages,
  onSendMessage,
  onSelectNode,
  onHighlightPath,
  isAsking
}) {
  const [input, setInput] = useState('');
  const [expandedCypherIdx, setExpandedCypherIdx] = useState({});
  const [copiedIdx, setCopiedIdx] = useState(null);
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

  const toggleCypher = (idx) => {
    setExpandedCypherIdx((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const copyCypher = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Helper to format inline bold and handles (@handle)
  const renderInlineFormatted = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|@[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-medium">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-cyan-400 font-medium font-mono text-[11px] bg-cyan-950/30 px-1 py-0.5 rounded">
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
        <div key={pIdx} className="space-y-2 my-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('### ')) {
              return (
                <h4 key={lIdx} className="text-xs font-medium text-white tracking-wide uppercase mt-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span>{trimmed.replace('### ', '')}</span>
                </h4>
              );
            }

            // Bullet items
            if (trimmed.startsWith('- ')) {
              const content = trimmed.replace('- ', '');
              return (
                <div key={lIdx} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed pl-1">
                  <span className="text-[#3B82F6] font-medium mt-1 text-[8px]">•</span>
                  <div className="flex-1">
                    {renderInlineFormatted(content)}
                  </div>
                </div>
              );
            }

            // Regular conversational prose paragraph
            return (
              <p key={lIdx} className="text-xs text-gray-200 leading-relaxed font-normal">
                {renderInlineFormatted(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <section className="w-full lg:w-[38%] h-full bg-[#141927] rounded-2xl border border-white/5 flex flex-col overflow-hidden select-none">
      


      {/* Prompt Scenario Chips directly above message scroll area */}
      <div className="p-4 pb-0">
        <div className="flex items-center gap-2 flex-wrap mb-4 pb-2 border-b border-white/5">
          <button
            type="button"
            onClick={() => onSendMessage("Why did we change Payment-API timeout to 5s, and who knows this system best?")}
            disabled={isAsking}
            className="bg-[#141927] hover:bg-[#1D2232] border border-white/10 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            💳 Payment-API Timeout Lineage
          </button>
          <button
            type="button"
            onClick={() => onSendMessage("I'm Priya starting work on Checkout-UI today. Any bugs or blockers I should know?")}
            disabled={isAsking}
            className="bg-[#141927] hover:bg-[#1D2232] border border-white/10 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            🚨 Checkout-UI Blockers & SLAs
          </button>
          <button
            type="button"
            onClick={() => onSendMessage("Trace all decisions and security risks affecting Auth-Service")}
            disabled={isAsking}
            className="bg-[#141927] hover:bg-[#1D2232] border border-white/10 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            🔒 Auth-Service Risks & Decisions
          </button>
        </div>
      </div>

      {/* 2. Messages Console Stream with generous spacing (space-y-6) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={idx}
              className={`rounded-xl p-6 transition-colors space-y-3 ${
                isUser
                  ? 'bg-[#181C29] border border-white/10 max-w-[90%] ml-auto'
                  : 'bg-[#181C29] border border-white/5'
              }`}
            >
              {/* Header: Sender Info & Telemetry */}
              <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center bg-[#141927] border border-white/5 text-gray-300">
                    {isUser ? <User className="h-3 w-3" /> : <Cpu className="h-3 w-3 text-[#3B82F6]" />}
                  </div>
                  <span className="font-medium text-white text-xs">
                    {isUser ? 'Engineer Prompt' : 'CortexFlow Brain'}
                  </span>
                  {!isUser && msg.latency_ms && (
                    <span className="text-[10px] font-mono text-gray-400 px-2 py-0.5 rounded-full bg-[#101420] border border-white/5">
                      {msg.latency_ms}ms cypher
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-gray-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Body */}
              <div>
                {isUser ? (
                  <p className="text-xs text-gray-200 leading-relaxed font-normal">
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
                        ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
                        : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span className={`${isOverdue ? 'text-rose-400' : 'text-amber-400'} font-semibold tracking-wide uppercase`}>
                          {isOverdue ? 'Critical SLA Overdue Blocker' : 'Downstream Blocker Risk'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {allAffectedSystemNames.map((sysName) => (
                          <span key={sysName} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[10px] font-mono text-gray-300">
                            {sysName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-sans">
                      {primaryMsg}
                    </p>
                    {allAffectedSystemNames.length > 1 && (
                      <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="text-gray-500">Ripple blast radius:</span>
                        <span className="text-gray-300 font-mono">{allAffectedSystemNames.join(', ')}</span>
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-end text-[10px] text-gray-400 hover:text-white transition-colors">
                      <span>Click to inspect blocker path in graph →</span>
                    </div>
                  </div>
                );
              })()}

              {/* Technical Lineage (Clickable inline pills: bg-[#181C29] border border-white/5 text-cyan-400) */}
              {!isUser && ((msg.lineage && msg.lineage.length > 0) || (msg.sources && msg.sources.length > 0)) && (
                <div className="pt-2 flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="text-gray-500 font-medium font-mono">Lineage:</span>
                  {(msg.lineage && msg.lineage.length > 0
                    ? msg.lineage
                    : (msg.sources || []).map((s) => s.name || s.id)
                  ).map((item, lIdx) => {
                    const matchedSource = msg.sources?.find(
                      (s) => s.name === item || s.id === item || (s.name && item.includes(s.name))
                    );
                    const targetId = matchedSource ? matchedSource.id : item;

                    return (
                      <button
                        key={lIdx}
                        type="button"
                        onClick={() => onSelectNode(targetId)}
                        className="px-2.5 py-1 rounded-md bg-[#181C29] border border-white/5 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/30 font-mono text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                        title={`Inspect ${item}`}
                      >
                        <span>{item}</span>
                        <ArrowRight className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Collapsible Cypher Query Inspection */}
              {!isUser && msg.executed_cypher && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => toggleCypher(idx)}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 hover:text-white transition-colors"
                  >
                    {expandedCypherIdx[idx] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>Inspect FalkorDB Cypher</span>
                    <span className="text-[10px] text-gray-500">
                      ({msg.latency_ms ? `${msg.latency_ms}ms` : '<3ms'})
                    </span>
                  </button>

                  {expandedCypherIdx[idx] && (
                    <div className="mt-2 relative rounded-xl bg-[#0B0E16] border border-white/5 p-4 font-mono text-[11px] text-gray-300">
                      <button
                        type="button"
                        onClick={() => copyCypher(msg.executed_cypher, idx)}
                        className="flat-pill-btn absolute top-2 right-2 p-1.5 bg-[#181C29] hover:bg-[#202536] text-gray-400 hover:text-white transition-colors"
                        title="Copy Cypher query"
                      >
                        {copiedIdx === idx ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <pre className="pr-8 whitespace-pre-wrap leading-relaxed text-gray-400">
                        {msg.executed_cypher}
                      </pre>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}

        {/* Loading Skeleton Indicator */}
        {isAsking && (
          <div className="rounded-xl bg-[#181C29] border border-white/5 p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#141927] border border-white/5 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-[#3B82F6] animate-pulse" />
                </div>
                <span className="font-medium text-white text-xs">CortexFlow Brain</span>
                <span className="text-[10px] font-mono text-gray-400 px-2 py-0.5 rounded-full bg-[#101420] border border-white/5">
                  loading...
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-500 animate-pulse">executing Cypher</span>
            </div>

            <div className="space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-white/10 skeleton-shimmer" />
              <div className="h-3 w-full rounded bg-white/5 skeleton-shimmer" />
              <div className="h-3 w-4/5 rounded bg-white/5 skeleton-shimmer" />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-ping" />
              <span className="font-mono text-[11px] text-gray-300">
                loading multi-hop reasoning & blast radius from FalkorDB...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Command Input Field */}
      <div className="p-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask CortexFlow brain (e.g. 'Why did we change Payment-API timeout?')..."
            className="w-full h-11 rounded-full bg-[#181C29] border border-white/5 pl-4 pr-28 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="submit"
              disabled={!input.trim() || isAsking}
              className="h-8 px-3.5 rounded-full bg-[#3B82F6] hover:bg-[#2B6CB7] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>{isAsking ? 'loading...' : 'Ask'}</span>
              <CornerDownLeft className="h-3 w-3" />
            </button>
          </div>
        </form>
      </div>

    </section>
  );
}
