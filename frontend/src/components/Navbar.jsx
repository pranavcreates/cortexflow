import React, { useState, useRef, useEffect } from 'react';
import { 
  Cpu, 
  FastForward, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  Activity,
  ChevronDown
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
  isConnected,
  currentUser,
  onUserChange,
  users
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-[#0A1222] border-b border-[#1B2D4F] shrink-0 select-none">
      
      {/* 1. Left Group: Brand & Product Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#021538] flex items-center justify-center text-gray-200">
            <Cpu className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-tight text-base font-sans">CortexFlow</span>
              <span className="text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-[#021538] font-medium">
                falkordb
              </span>
            </div>
            <span className="text-xs text-blue-200 font-medium -mt-0.5 font-sans">
              Self-Healing Company Brain
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center Group: Telemetry Readout */}
      <div className="hidden md:flex items-center gap-3 text-xs bg-[#021538] rounded-full px-4 py-1.5 text-blue-100 font-sans shadow-sm">
        {!isConnected ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full h-2 w-2 bg-amber-400" />
            <span className="text-amber-300 font-medium text-xs font-sans tracking-wide">
              Connecting to FalkorDB...
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              <span className="text-white font-semibold text-xs font-sans">
                FalkorDB Online
              </span>
            </div>

            <span className="text-white/20">|</span>

            <div className="flex items-center gap-1 text-xs font-sans text-blue-100 font-medium">
              <span>{stats?.total_nodes ?? 17} nodes</span>
            </div>

            <span className="text-white/20">·</span>

            <div className="flex items-center gap-1 text-xs font-sans text-blue-100 font-medium">
              <span>{stats?.total_edges ?? 26} edges</span>
            </div>

            <span className="text-white/20">|</span>

            <div className="flex items-center gap-1.5 text-xs font-sans text-blue-100 font-medium">
              <Activity className="h-3.5 w-3.5 text-[#3B82F6]" />
              <span>{latencyMs !== null && latencyMs !== undefined ? `${latencyMs}ms` : '14ms'}</span>
            </div>
          </>
        )}
      </div>

      {/* 3. Right Group: Actions & Identity */}
      <div className="flex items-center space-x-4">
        
        {/* Fast-Forward Button */}
        <button
          type="button"
          onClick={onSimulateTime}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#021538] hover:bg-[#031d4d] text-white transition-colors disabled:opacity-50 cursor-pointer font-sans shadow-sm"
          title="Fast-forward graph clock by 4 hours to test SLA commitment decay"
        >
          <FastForward className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-sans">{isSimulating ? 'Simulating...' : '+4h Decay'}</span>
        </button>

        {/* Reset Graph Button */}
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#021538] hover:bg-[#031d4d] text-gray-200 hover:text-white transition-colors disabled:opacity-50 cursor-pointer font-sans shadow-sm"
          title="Reset graph to seed state"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline font-sans">{isResetting ? 'Resetting...' : 'Reset'}</span>
        </button>

        {/* Masked indicator shown automatically when in Intern role */}
        {role === 'intern' && (
          <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-sans text-purple-200 px-3 py-1.5 rounded-lg bg-[#021538] font-medium shadow-sm">
            <Lock className="h-3.5 w-3.5 text-purple-300" />
            <span>{stats?.restricted_hidden_count || 2} Masked</span>
          </span>
        )}

        {/* Enterprise Identity Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#021538] hover:bg-[#031d4d] text-xs font-medium text-white transition-all shadow-sm cursor-pointer"
            title="Switch active logged-in team persona & clearance"
          >
            <span className="text-sm">{currentUser?.avatar || '👨‍💻'}</span>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white leading-none text-xs font-sans">
                  {currentUser?.handle || '@Arjun'}
                </span>
                <span className={`text-[9px] font-sans font-semibold px-1.5 py-0.5 rounded-full ${
                  currentUser?.clearance === 'intern'
                    ? 'bg-purple-500/25 text-purple-200'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {currentUser?.clearance === 'intern' ? 'INTERN' : 'SENIOR'}
                </span>
              </div>
              <span className="text-[10px] text-blue-200/80 font-normal leading-none mt-1 font-sans">
                {currentUser?.team || 'Backend Dev'}
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-blue-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0B1528] shadow-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-md">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-sans font-medium tracking-wider text-blue-200/70 border-b border-white/10 flex items-center justify-between">
                <span>Enterprise Identity</span>
                <span>Role Clearance</span>
              </div>
              {(users || []).map((u) => {
                const isActive = currentUser?.id === u.id;
                const isIntern = u.clearance === 'intern';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onUserChange(u.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#3B82F6] text-white font-medium shadow-sm'
                        : 'text-gray-200 hover:bg-[#021538] hover:text-white'
                    }`}
                  >
                    <span className="text-base shrink-0">{u.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold truncate font-sans">{u.name}</span>
                        <span className={`text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : isIntern 
                              ? 'bg-purple-900/40 text-purple-200' 
                              : 'bg-emerald-900/40 text-emerald-300'
                        }`}>
                          {isIntern ? 'Intern RBAC' : 'Senior'}
                        </span>
                      </div>
                      <div className={`text-[11px] truncate font-sans mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-300'}`}>
                        {u.role} · <span className="font-medium">{u.team}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
