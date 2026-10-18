import React, { useState } from 'react';
import { 
  Terminal, 
  Clock, 
  FileText, 
  Check, 
  Send, 
  AlertTriangle
} from 'lucide-react';

export default function LeftPanel({
  commitments,
  staleDocs,
  onIngest,
  onApproveDoc,
  onSelectNode,
  onHighlightPath,
  isIngesting,
  isApprovingDoc,
  isLoading
}) {
  const [sourceType, setSourceType] = useState('slack');
  const [channelOrTitle, setChannelOrTitle] = useState('#eng-backend');
  const [text, setText] = useState('');

  const handleIngestSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onIngest({
      source_type: sourceType,
      channel_or_title: channelOrTitle,
      text: text.trim()
    });
    setText('');
  };

  const getInitials = (handle) => {
    if (!handle) return 'CF';
    return handle.replace('@', '').slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-full lg:w-[26%] lg:min-w-[320px] h-full bg-[#141414] rounded-2xl flex flex-col overflow-hidden select-none">
      
      {/* Scrollable Container with tightened vertical padding for 1080p demo viewports */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* ================================================================= */}
        {/* SECTION 1: INGESTION COMMAND CENTER */}
        {/* ================================================================= */}
        <section aria-labelledby="ingest-title" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="ingest-title" className="text-sm font-semibold tracking-wide uppercase text-white">
              Live Ingestion
            </h2>
            <span className="text-xs font-sans text-blue-200 px-2.5 py-0.5 rounded-full bg-[#021538] border border-white/5 font-medium">
              {isIngesting ? 'Ingesting...' : 'Cypher MERGE'}
            </span>
          </div>

          {/* Ingestion Card with tightened p-3.5 padding and rows={2} */}
          <form onSubmit={handleIngestSubmit} className="bg-[#0B1528] rounded-xl p-3 space-y-2.5 shadow-md">
            <div className="flex items-center gap-2">
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="bg-[#021538] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none transition-colors border border-white/5 font-sans"
              >
                <option value="slack">Slack</option>
                <option value="bug">Bug Ticket</option>
                <option value="doc">Document</option>
              </select>

              <input
                type="text"
                value={channelOrTitle}
                onChange={(e) => setChannelOrTitle(e.target.value)}
                placeholder="#channel or title"
                className="flex-1 bg-[#021538] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-blue-200/70 focus:outline-none transition-colors border border-white/5 font-sans"
              />
            </div>

            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste engineering consensus, architectural updates, or bug commitments..."
              className="w-full bg-[#021538] rounded-lg p-2.5 text-xs text-white placeholder-blue-200/70 leading-relaxed resize-none focus:outline-none transition-colors border border-white/5 font-sans"
            />

            {/* Ingest to Brain button */}
            <button
              type="submit"
              disabled={isIngesting || !text.trim()}
              className="w-full rounded-[8px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs py-2 transition-colors flex items-center justify-center gap-2 shadow-sm border-0 disabled:opacity-40 disabled:pointer-events-none font-sans cursor-pointer"
            >
              <span className="font-sans">{isIngesting ? 'Ingesting...' : 'Ingest to Brain'}</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>

        {/* ================================================================= */}
        {/* SECTION 2: COMMITMENT ROWS (Tightened p-3 cards) */}
        {/* ================================================================= */}
        <section aria-labelledby="commitments-title" className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="commitments-title" className="text-sm font-semibold tracking-wide uppercase text-white font-sans">
                Active Commitments
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>
            <span className="text-xs font-sans text-gray-300">
              {isLoading ? '...' : `${commitments?.length || 0} issues`}
            </span>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-[#0B1528] shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-[#021538] skeleton-shimmer" />
                      <div className="h-3 w-16 rounded bg-white/10 skeleton-shimmer" />
                      <div className="h-4 w-14 rounded bg-[#021538] skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="h-3 w-3/4 rounded bg-white/10 skeleton-shimmer" />
                </div>
              ))
            ) : commitments && commitments.length > 0 ? (
              commitments.map((comm, idx) => {
                const isOverdue = comm.remaining_hours <= 0;

                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => onHighlightPath([comm.person_id, comm.ticket_id, 'sys_auth', 'sys_check', 'sys_pay'])}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onHighlightPath([comm.person_id, comm.ticket_id, 'sys_auth', 'sys_check', 'sys_pay']);
                    }}
                    className="p-3 rounded-xl bg-[#0B1528] hover:bg-[#0F1D36] transition-colors cursor-pointer group space-y-1.5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar, Name, and Bug Tag */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-[#021538] text-blue-100 font-semibold text-[11px] flex items-center justify-center shrink-0 border border-white/5">
                          {getInitials(comm.person_handle)}
                        </div>
                        <span className="text-xs font-semibold text-white group-hover:text-blue-200 transition-colors truncate">
                          {comm.person_handle}
                        </span>
                        <span className="bg-[#021538] text-blue-100 px-2 py-0.5 rounded text-[11px] font-mono shrink-0 font-medium border border-blue-500/20">
                          {comm.ticket_name}
                        </span>
                      </div>

                      {/* Status indicator (Time) */}
                      <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
                        <span className={`h-2 w-2 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-400'}`} />
                        <span className={isOverdue ? 'text-rose-300 font-semibold text-xs' : 'text-amber-300 font-semibold text-xs'}>
                          {isOverdue ? 'OVERDUE' : `${comm.remaining_hours}h left`}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-blue-50 leading-relaxed font-normal">
                      {comm.ticket_title}
                    </p>

                    {comm.blocked_downstream_systems?.length > 0 && (
                      <div className="flex items-center justify-start pt-0.5 text-xs font-mono">
                        <span className={isOverdue ? 'text-rose-300 flex items-center gap-1.5 font-medium text-[11px]' : 'text-blue-200 flex items-center gap-1.5 font-medium text-[11px]'}>
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>
                            blocks: {comm.blocked_downstream_systems.join(', ')}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center rounded-xl bg-[#0B1528] shadow-md text-xs text-blue-100 font-normal">
                No active commitments pending SLA expiry.
              </div>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: KNOWLEDGE DRIFT (Tightened p-3 cards) */}
        {/* ================================================================= */}
        <section aria-labelledby="drift-title" className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="drift-title" className="text-sm font-semibold tracking-wide uppercase text-white font-sans">
                Knowledge Drift
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>
            <span className="text-xs font-sans text-gray-300 px-2.5 py-0.5 rounded-full bg-[#021538] border border-white/5 font-medium">
              {isLoading ? '...' : `${staleDocs?.length || 0} Stale`}
            </span>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="p-3 rounded-xl bg-[#0B1528] shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-28 rounded bg-white/10 skeleton-shimmer" />
                </div>
                <div className="h-10 w-full rounded-lg bg-[#021538] skeleton-shimmer" />
              </div>
            ) : staleDocs && staleDocs.length > 0 ? (
              staleDocs.map((doc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#0B1528] shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white font-sans">
                      {doc.doc_name}
                    </span>
                    <span className="text-[11px] font-mono text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 font-medium border border-amber-500/30">
                      stale
                    </span>
                  </div>

                  <p className="text-xs text-blue-50 leading-relaxed italic bg-[#021538] p-2.5 rounded-lg border border-white/5 font-sans">
                    "{doc.doc_content}"
                  </p>

                  <div className="text-[11px] text-blue-100 font-sans font-normal">
                    Contradicted by <strong className="text-white font-mono font-semibold">{doc.contradicted_by_decision}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onApproveDoc(
                        doc.doc_id,
                        doc.doc_id === 'doc_arch'
                          ? "Payment-API uses REST with a 5-second fail-fast timeout window."
                          : `Approved consensus update aligned with ${doc.contradicted_by_decision || 'active architectural decisions'}.`
                      )
                    }
                    disabled={isApprovingDoc}
                    className="w-full py-2 bg-[#021538] hover:bg-[#010e24] text-white rounded-[8px] text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm border border-white/10 font-sans cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-sans">{isApprovingDoc ? 'Healing...' : 'Approve & Auto-Heal Doc'}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-3 text-center rounded-xl bg-[#0B1528] shadow-md text-xs text-blue-100 flex items-center justify-center gap-2 font-normal">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>All documents in sync with decisions</span>
              </div>
            )}
          </div>
        </section>

      </div>
    </aside>
  );
}
