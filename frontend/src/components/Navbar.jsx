import React from 'react';
import { 
  Cpu, 
  FastForward, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  Activity
} from 'lucide-react';

export default function Navbar({ 
  stats, 
  latencyMs, 
  role, 
  onRoleChange, 
  onSimulateTime, 
  onReset, 
  isSimulating, 
  isResetting,
  isConnected 
}) {
  return (
    <header className="h-14 bg-[#042254] rounded-2xl px-6 flex items-center justify-between shrink-0 select-none shadow-md">
      
      {/* 1. Left: Brand & Product Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#021538] flex items-center justify-center text-gray-200">
            <Cpu className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white tracking-tight text-sm">CortexFlow</span>
              <span className="text-[10px] font-mono text-blue-200 px-2 py-0.5 rounded-full bg-[#021538]">
                falkordb
              </span>
            </div>
            <span className="text-xs text-blue-200/80 -mt-0.5">
              Self-Healing Company Brain
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Telemetry Readout */}
      <div className="hidden md:flex items-center gap-3 text-xs bg-[#021538] rounded-full px-4 py-1.5 text-blue-100">
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className={isConnected ? 'text-white font-medium text-xs' : 'text-amber-400 font-medium text-xs'}>
            {isConnected ? 'FalkorDB Online' : 'loading...'}
          </span>
        </div>

        <span className="text-white/20">|</span>

        <div className="flex items-center gap-1 text-[11px] font-mono text-blue-200">
          <span>{isConnected ? `${stats?.total_nodes ?? 0} nodes` : 'loading...'}</span>
        </div>

        <span className="text-white/20">·</span>

        <div className="flex items-center gap-1 text-[11px] font-mono text-blue-200">
          <span>{isConnected ? `${stats?.total_edges ?? 0} edges` : 'loading...'}</span>
        </div>

        <span className="text-white/20">|</span>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-200">
          <Activity className="h-3.5 w-3.5 text-[#3B82F6]" />
          <span>{latencyMs !== null && latencyMs !== undefined ? `${latencyMs}ms` : 'loading...'}</span>
        </div>
      </div>

      {/* 3. Right: Controls & Actions */}
      <div className="flex items-center gap-2.5">
        
        {/* Role Toggle Switcher */}
        <div 
          role="radiogroup" 
          aria-label="Security Role"
          className="flex items-center bg-[#021538] rounded-full p-1 text-xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={role === 'senior'}
            onClick={() => onRoleChange('senior')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors font-medium text-xs ${
              role === 'senior'
                ? 'bg-[#042254] text-white shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Senior</span>
          </button>
          
          <button
            type="button"
            role="radio"
            aria-checked={role === 'intern'}
            onClick={() => onRoleChange('intern')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors font-medium text-xs ${
              role === 'intern'
                ? 'bg-[#042254] text-white shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5 text-purple-300" />
            <span>Intern (RBAC)</span>
          </button>
        </div>

        {/* Masked indicator if in Intern role */}
        {role === 'intern' && (
          <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono text-purple-200 px-2.5 py-1 rounded-full bg-[#021538]">
            <Lock className="h-3 w-3 text-purple-300" />
            <span>{stats?.restricted_hidden_count || 2} Masked</span>
          </span>
        )}

        {/* Fast-Forward Button */}
        <button
          type="button"
          onClick={onSimulateTime}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#021538] hover:bg-[#010e24] text-blue-100 hover:text-white transition-colors disabled:opacity-50"
          title="Fast-forward graph clock by 4 hours to test SLA commitment decay"
        >
          <FastForward className={`h-3.5 w-3.5 text-amber-400 ${isSimulating ? 'animate-pulse' : ''}`} />
          <span>{isSimulating ? 'loading...' : '+4h Decay'}</span>
        </button>

        {/* Reset Graph Button */}
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#021538] hover:bg-[#010e24] text-blue-100 hover:text-white transition-colors disabled:opacity-50"
          title="Reset graph to seed state"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isResetting ? 'loading...' : 'Reset'}</span>
        </button>

      </div>
    </header>
  );
}
