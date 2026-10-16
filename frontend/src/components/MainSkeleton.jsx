import React from 'react';
import { Cpu, Activity, ShieldCheck, Lock, FastForward, RotateCcw, Send, Sparkles } from 'lucide-react';

export default function MainSkeleton() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0B0E16] text-white p-4 gap-4 select-none">
      
      {/* =================================================================== */}
      {/* 1. Header Navbar Skeleton */}
      {/* =================================================================== */}
      <header className="h-14 bg-[#141927] rounded-2xl border border-white/5 px-6 flex items-center justify-between shrink-0">
        
        {/* Left: Brand Identity Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#181C29] border border-white/5 flex items-center justify-center text-gray-400">
            <Cpu className="h-4 w-4 text-[#3B82F6] animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white tracking-tight text-sm">CortexFlow</span>
              <span className="text-[10px] font-mono text-gray-400 px-2 py-0.5 rounded-full bg-[#181C29] border border-white/5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-ping" />
                <span>loading...</span>
              </span>
            </div>
            <span className="text-xs text-gray-500 -mt-0.5">
              Self-Healing Company Brain
            </span>
          </div>
        </div>

        {/* Center: Telemetry Readout Skeleton */}
        <div className="hidden md:flex items-center gap-3 text-xs bg-[#181C29] border border-white/5 rounded-full px-4 py-1.5 text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse" />
            <span className="text-gray-300 font-mono text-xs">loading...</span>
          </div>

          <span className="text-white/10">|</span>

          <div className="h-3 w-16 rounded bg-white/5 skeleton-shimmer" />

          <span className="text-white/10">·</span>

          <div className="h-3 w-16 rounded bg-white/5 skeleton-shimmer" />

          <span className="text-white/10">|</span>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400">
            <Activity className="h-3.5 w-3.5 text-[#3B82F6] animate-pulse" />
            <span>loading...</span>
          </div>
        </div>

        {/* Right: Controls & Actions Skeleton */}
        <div className="flex items-center gap-2.5">
          {/* Role Pill Skeleton */}
          <div className="flex items-center bg-[#181C29] border border-white/5 rounded-full p-1 gap-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141927] border border-white/5 text-gray-400 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" />
              <span>loading...</span>
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="h-8 w-24 rounded-full bg-[#181C29] border border-white/5 skeleton-shimmer" />
          <div className="h-8 w-16 rounded-full bg-[#181C29] border border-white/5 skeleton-shimmer" />
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. Main 3-Section Bento Skeleton Layout */}
      {/* =================================================================== */}
      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row gap-4">
        
        {/* ----------------------------------------------------------------- */}
        {/* Left Panel Skeleton: Ingestion, Commitments, Drift */}
        {/* ----------------------------------------------------------------- */}
        <aside className="w-full lg:w-[26%] lg:min-w-[320px] h-full bg-[#545454] rounded-2xl border border-white/5 flex flex-col overflow-hidden p-6 space-y-8">
          
          {/* Section 1: Ingestion Skeleton */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-white/10 skeleton-shimmer" />
              <span className="text-[10px] font-mono text-gray-500">loading...</span>
            </div>

            <div className="bg-[#181C29] border border-white/5 rounded-xl p-6 space-y-4">
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-[#101420] border border-white/5 skeleton-shimmer" />
                <div className="h-8 flex-1 rounded-lg bg-[#101420] border border-white/5 skeleton-shimmer" />
              </div>
              <div className="h-20 w-full rounded-lg bg-[#101420] border border-white/5 skeleton-shimmer" />
              <div className="h-9 w-full rounded-full bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center gap-2 text-xs text-indigo-300 font-medium">
                <Send className="h-3.5 w-3.5 animate-pulse" />
                <span>loading...</span>
              </div>
            </div>
          </section>

          {/* Section 2: Commitments Skeleton */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-32 rounded bg-white/10 skeleton-shimmer" />
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                  loading...
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">loading...</span>
            </div>

            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 rounded-xl bg-[#181C29] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-[#141927] border border-white/5 skeleton-shimmer" />
                      <div className="h-3 w-16 rounded bg-white/10 skeleton-shimmer" />
                      <div className="h-4 w-14 rounded bg-[#475569]/30 border border-white/5 skeleton-shimmer" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-500">loading...</span>
                  </div>
                  <div className="h-3 w-3/4 rounded bg-white/5 skeleton-shimmer" />
                  <div className="h-2.5 w-1/2 rounded bg-white/5 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Knowledge Drift Skeleton */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 rounded bg-white/10 skeleton-shimmer" />
              <span className="text-[10px] font-mono text-gray-500">loading...</span>
            </div>

            <div className="p-6 rounded-xl bg-[#181C29] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-white/10 skeleton-shimmer" />
                <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  loading...
                </span>
              </div>
              <div className="h-14 w-full rounded-lg bg-[#101420] border border-white/5 skeleton-shimmer" />
              <div className="h-8 w-full rounded-full bg-[#101420] border border-white/5 skeleton-shimmer" />
            </div>
          </section>

        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* Center Panel Skeleton: AI Agent Reasoning Console */}
        {/* ----------------------------------------------------------------- */}
        <section className="w-full lg:w-[38%] h-full bg-[#545454] rounded-2xl border border-white/5 flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Agent welcome message skeleton */}
            <div className="rounded-xl p-6 bg-[#181C29] border border-white/5 space-y-4">
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
                <span className="text-[10px] font-mono text-gray-500">loading...</span>
              </div>

              <div className="space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-white/10 skeleton-shimmer" />
                <div className="h-3 w-full rounded bg-white/5 skeleton-shimmer" />
                <div className="h-3 w-5/6 rounded bg-white/5 skeleton-shimmer" />
                <div className="h-3 w-4/6 rounded bg-white/5 skeleton-shimmer" />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="text-gray-500 text-[10px] font-medium">Lineage:</span>
                <div className="h-5 w-20 rounded-full bg-[#101420] border border-white/5 skeleton-shimmer" />
                <div className="h-5 w-24 rounded-full bg-[#101420] border border-white/5 skeleton-shimmer" />
              </div>

              <div className="h-7 w-48 rounded bg-[#101420] border border-white/5 flex items-center px-3 gap-2">
                <span className="text-[11px] font-mono text-gray-500">loading Cypher query...</span>
              </div>
            </div>

            {/* Pulsing loading radar bubble */}
            <div className="rounded-xl bg-[#181C29] border border-white/5 p-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3B82F6]" />
              </span>
              <span className="font-mono text-[11px] text-gray-300">
                loading graph topology & multi-hop reasoning from FalkorDB...
              </span>
            </div>

          </div>

          {/* Bottom input skeleton */}
          <div className="p-4 border-t border-white/5">
            <div className="h-11 rounded-full bg-[#181C29] border border-white/5 flex items-center px-4 justify-between">
              <span className="text-xs text-gray-600 font-mono">loading input console...</span>
              <div className="h-8 w-16 rounded-full bg-[#3B82F6]/30 border border-[#3B82F6]/40 flex items-center justify-center text-xs text-white/50">
                loading...
              </div>
            </div>
          </div>

        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Right Panel Skeleton: Concentric 3-Ring Visualizer */}
        {/* ----------------------------------------------------------------- */}
        <section className="w-full lg:w-[36%] h-full bg-[#545454] rounded-2xl border border-white/5 flex flex-col overflow-hidden relative">
          
          {/* Filter Bar Skeleton */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between z-10">
            <div className="flex items-center bg-[#181C29] border border-white/5 rounded-full p-1 gap-1">
              {['ALL', 'Systems', 'People', 'Truth'].map((f, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    idx === 0 ? 'bg-[#141927] text-white border border-white/5' : 'text-gray-600'
                  }`}
                >
                  {f}
                </div>
              ))}
            </div>

            <span className="text-[10px] font-mono text-gray-500">loading...</span>
          </div>

          {/* Concentric Circular Radar Skeleton Canvas */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 680 640" className="w-full h-full">
              {/* Concentric Guide Rings */}
              <circle cx="340" cy="320" r="265" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <circle cx="340" cy="320" r="175" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <circle cx="340" cy="320" r="85" fill="none" stroke="rgba(255,255,255,0.08)" />

              {/* Shimmering Radar Pulse */}
              <circle cx="340" cy="320" r="130" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1.5">
                <animate attributeName="r" values="30;270" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Ring 1 Placeholders (Indigo) */}
              {[0, 120, 240].map((angle, i) => {
                const rad = (angle * Math.PI) / 180 - Math.PI / 2;
                const x = 340 + 85 * Math.cos(rad);
                const y = 320 + 85 * Math.sin(rad);
                return (
                  <circle
                    key={`r1-${i}`}
                    cx={x}
                    cy={y}
                    r="12"
                    fill="#6366F1"
                    opacity="0.35"
                    className="animate-pulse"
                  />
                );
              })}

              {/* Ring 2 Placeholders (Sky Blue) */}
              {[45, 135, 225, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180 - Math.PI / 4;
                const x = 340 + 175 * Math.cos(rad);
                const y = 320 + 175 * Math.sin(rad);
                return (
                  <circle
                    key={`r2-${i}`}
                    cx={x}
                    cy={y}
                    r="10"
                    fill="#0EA5E9"
                    opacity="0.35"
                    className="animate-pulse"
                  />
                );
              })}

              {/* Ring 3 Placeholders (Amber / Crimson / Emerald) */}
              {[20, 70, 130, 180, 240, 290, 340].map((angle, i) => {
                const rad = (angle * Math.PI) / 180 - Math.PI / 6;
                const x = 340 + 265 * Math.cos(rad);
                const y = 320 + 265 * Math.sin(rad);
                const fills = ['#10B981', '#F59E0B', '#F43F5E'];
                return (
                  <circle
                    key={`r3-${i}`}
                    cx={x}
                    cy={y}
                    r="8"
                    fill={fills[i % fills.length]}
                    opacity="0.35"
                    className="animate-pulse"
                  />
                );
              })}
            </svg>

            {/* Central Badge Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-full bg-[#141927]/90 border border-white/10 backdrop-blur-md flex items-center gap-2 shadow-2xl">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-ping" />
                <span className="text-xs font-mono text-gray-300">
                  loading graph topology from FalkorDB...
                </span>
              </div>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}
