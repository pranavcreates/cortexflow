import React from 'react';
import { Cpu, Activity, ShieldCheck, Send, Sparkles } from 'lucide-react';

export default function MainSkeleton() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#141414] text-white select-none font-sans relative">
      
      {/* =================================================================== */}
      {/* 1. Header Navbar Skeleton (Full Width) */}
      {/* =================================================================== */}
      <header className="w-full flex items-center justify-between px-6 py-3 bg-[#0A1222] border-b border-[#1B2D4F] shrink-0">
        
        {/* Left: Brand Identity Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#021538] flex items-center justify-center text-gray-400">
            <Cpu className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-tight text-base font-sans">CortexFlow</span>
            <span className="text-xs text-blue-200 font-sans -mt-0.5">
              Self-Healing Company Brain
            </span>
          </div>
        </div>

        {/* Center: Telemetry Readout Skeleton */}
        <div className="hidden md:flex items-center gap-2 text-xs bg-[#021538] rounded-full px-4 py-1.5 text-blue-100 font-sans font-medium shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Connecting to FalkorDB...</span>
        </div>

        {/* Right: Actions & Identity Skeleton */}
        <div className="flex items-center space-x-4">
          {/* Action Buttons Skeleton */}
          <div className="h-7 w-20 rounded-lg bg-[#021538] skeleton-shimmer" />
          <div className="h-7 w-16 rounded-lg bg-[#021538] skeleton-shimmer" />
          
          {/* Identity Dropdown Skeleton */}
          <div className="h-8 w-36 rounded-lg bg-[#021538] skeleton-shimmer" />
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. Main 3-Section Bento Skeleton Layout */}
      {/* =================================================================== */}
      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row gap-4 p-4">
        
        {/* ----------------------------------------------------------------- */}
        {/* Left Panel Skeleton: Ingestion, Commitments, Drift */}
        {/* ----------------------------------------------------------------- */}
        <aside className="w-full lg:w-[26%] lg:min-w-[320px] h-full bg-[#141414] rounded-2xl flex flex-col overflow-hidden p-6 space-y-6">
          
          {/* Single Section Loading Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              <span className="text-xs font-sans font-medium text-blue-200">
                Loading workspace telemetry...
              </span>
            </div>
          </div>

          {/* Section 1: Ingestion Skeleton */}
          <section className="space-y-3">
            <div className="h-3.5 w-24 rounded bg-white/10 skeleton-shimmer" />
            <div className="bg-[#0B1528] rounded-xl p-5 space-y-3 shadow-md">
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-[#021538] skeleton-shimmer" />
                <div className="h-8 flex-1 rounded-lg bg-[#021538] skeleton-shimmer" />
              </div>
              <div className="h-16 w-full rounded-lg bg-[#021538] skeleton-shimmer" />
              <div className="h-9 w-full rounded-full bg-[#021538] flex items-center justify-center gap-2 text-xs text-blue-300 font-sans font-medium border border-white/5">
                <Send className="h-3.5 w-3.5 text-blue-400" />
                <span>Ingest Knowledge</span>
              </div>
            </div>
          </section>

          {/* Section 2: Commitments Skeleton */}
          <section className="space-y-3">
            <div className="h-3.5 w-32 rounded bg-white/10 skeleton-shimmer" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0B1528] shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-[#021538] skeleton-shimmer" />
                      <div className="h-3 w-16 rounded bg-white/10 skeleton-shimmer" />
                      <div className="h-4 w-14 rounded bg-[#021538] skeleton-shimmer" />
                    </div>
                    <div className="h-3 w-12 rounded bg-white/10 skeleton-shimmer" />
                  </div>
                  <div className="h-3 w-3/4 rounded bg-white/10 skeleton-shimmer" />
                  <div className="h-2.5 w-1/2 rounded bg-white/5 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Knowledge Drift Skeleton */}
          <section className="space-y-3">
            <div className="h-3.5 w-28 rounded bg-white/10 skeleton-shimmer" />
            <div className="p-4 rounded-xl bg-[#0B1528] shadow-md space-y-3">
              <div className="h-3 w-28 rounded bg-white/10 skeleton-shimmer" />
              <div className="h-12 w-full rounded-lg bg-[#021538] skeleton-shimmer" />
              <div className="h-8 w-full rounded-full bg-[#021538] skeleton-shimmer" />
            </div>
          </section>

        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* Center Panel Skeleton: AI Agent Reasoning Console */}
        {/* ----------------------------------------------------------------- */}
        <section className="w-full lg:w-[38%] h-full bg-[#141414] rounded-2xl flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Single Section Loading Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-xs font-sans font-medium text-blue-200">
                  Loading AI reasoning console...
                </span>
              </div>
            </div>

            {/* Agent welcome message skeleton */}
            <div className="rounded-xl p-6 bg-[#0B1528] shadow-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#021538] flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-[#3B82F6]" />
                  </div>
                  <span className="font-semibold text-white text-xs font-sans">CortexFlow Brain</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-white/10 skeleton-shimmer" />
                <div className="h-3 w-full rounded bg-white/5 skeleton-shimmer" />
                <div className="h-3 w-5/6 rounded bg-white/5 skeleton-shimmer" />
              </div>
            </div>

          </div>

          {/* Bottom input skeleton */}
          <div className="px-6 pb-4 pt-1">
            <div className="h-[52px] rounded-[10px] bg-[#042254] shadow-sm flex items-center px-4 justify-between border border-white/5">
              <span className="text-xs text-blue-200/60 font-sans">Ask CortexFlow Brain a question...</span>
              <div className="h-[36px] px-4 rounded-[8px] bg-[#021538] border border-white/10 flex items-center justify-center text-xs text-blue-200 font-sans font-medium">
                Send
              </div>
            </div>
          </div>

        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Right Panel Skeleton: Concentric 3-Ring Visualizer */}
        {/* ----------------------------------------------------------------- */}
        <section className="w-full lg:w-[36%] h-full bg-[#141414] rounded-2xl flex flex-col overflow-hidden relative">
          
          {/* Filter Bar Skeleton */}
          <div className="px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center bg-[#042254] rounded-full p-1 gap-1 shadow-md">
              {['ALL', 'Systems', 'People', 'Truth'].map((f, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs font-sans font-medium ${
                    idx === 0 ? 'bg-[#021538] text-white' : 'text-blue-200'
                  }`}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Concentric Circular Static Canvas */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 680 640" className="w-full h-full">
              {/* Concentric Guide Rings */}
              <circle cx="340" cy="320" r="265" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <circle cx="340" cy="320" r="175" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <circle cx="340" cy="320" r="85" fill="none" stroke="rgba(255,255,255,0.08)" />

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
                    opacity="0.3"
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
                    opacity="0.3"
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
                    opacity="0.3"
                  />
                );
              })}
            </svg>

            {/* Central Badge Overlay (Single Unified Loading Indicator) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div className="px-4 py-2 rounded-full bg-[#042254]/90 border border-white/10 backdrop-blur-md flex items-center gap-2.5 shadow-2xl">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-xs font-sans font-medium text-white tracking-wide">
                  Loading graph topology...
                </span>
              </div>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}
