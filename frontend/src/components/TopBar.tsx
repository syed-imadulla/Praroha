import React, { useState } from 'react';
import { GitBranch, RefreshCw, PanelRight, Sparkles, AlertCircle, ChevronDown, Check, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const TopBar: React.FC = () => {
  const {
    activeProject,
    health,
    inspectorOpen,
    toggleInspector,
    resetWorkspace,
    projectBranches,
    fetchBranches,
    switchBranch,
    forkBranch,
  } = useWorkspaceStore();

  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const handleReset = () => {
    if (window.confirm('Start a new seed? This will reset the current workspace progress.')) {
      resetWorkspace();
    }
  };

  const isHealthy = health?.status === 'healthy';

  return (
    <header className="h-14 border-b border-canvas-border bg-canvas-panel/90 backdrop-blur-md px-4 flex items-center justify-between select-none z-30">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 tracking-tight text-sm md:text-base font-sans">
                Seed Unfold
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                Praroha
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none truncate max-w-[200px] md:max-w-xs">
              {activeProject ? activeProject.title : 'Human-Guided Creative Engine'}
            </p>
          </div>
        </div>

        {/* Interactive Branch Switcher Dropdown (PERS-02) */}
        <div className="relative">
          <button
            onClick={() => {
              setBranchMenuOpen(!branchMenuOpen);
              fetchBranches();
            }}
            id="branch-switcher-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-canvas-card hover:bg-neutral-800 border border-canvas-border text-xs text-slate-300 transition"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Branch:</span>
            <span className="font-mono text-cyan-300 font-medium truncate max-w-[120px]">
              {activeProject?.branch_name || 'main'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {branchMenuOpen && (
            <div id="branch-switcher-popover" className="absolute left-0 mt-2 w-72 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-800 mb-1.5">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Timeline Branches
                </span>
                <span className="text-[10px] text-neutral-500">
                  {projectBranches.length} branch(es)
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {projectBranches.map((branch) => {
                  const isActive = branch.id === activeProject?.id;
                  return (
                    <button
                      key={branch.id}
                      onClick={async () => {
                        await switchBranch(branch.id);
                        setBranchMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        isActive
                          ? 'bg-cyan-950/70 text-cyan-300 font-medium border border-cyan-800/40'
                          : 'text-neutral-300 hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GitBranch className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-neutral-500'}`} />
                        <span className="truncate">{branch.branch_name}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Fork Form / Button */}
              <div className="pt-2 mt-1.5 border-t border-neutral-800">
                {isForking ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="New branch name..."
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newBranchName.trim()) {
                          await forkBranch(newBranchName.trim());
                          setNewBranchName('');
                          setIsForking(false);
                          setBranchMenuOpen(false);
                        } else if (e.key === 'Escape') {
                          setIsForking(false);
                        }
                      }}
                      className="w-full px-2 py-1 text-xs bg-neutral-950 border border-cyan-500/50 rounded-md text-neutral-200 outline-none"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setIsForking(false)}
                        className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-neutral-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (newBranchName.trim()) {
                            await forkBranch(newBranchName.trim());
                            setNewBranchName('');
                            setIsForking(false);
                            setBranchMenuOpen(false);
                          }
                        }}
                        className="px-2 py-0.5 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                      >
                        Fork
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsForking(true)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-cyan-400 hover:bg-cyan-950/40 rounded-lg transition font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Fork New Branch</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Status Badges & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Backend & AI Provider Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-canvas-card border border-canvas-border text-xs">
          <div className="flex items-center gap-1.5">
            {isHealthy ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-slate-300 font-medium">
              {isHealthy ? `AI: ${health?.ai_provider.resolved}` : 'Connecting...'}
            </span>
          </div>
          {isHealthy && (
            <span className="text-[10px] text-slate-500 border-l border-slate-700 pl-2">
              {health?.storage_provider.type === 'LocalStorageProvider' ? 'Local Storage' : 'Supabase Storage'}
            </span>
          )}
        </div>

        {/* Restart Button */}
        <button
          onClick={handleReset}
          title="Start with a new seed idea"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Seed</span>
        </button>

        {/* Inspector Drawer Toggle */}
        <button
          onClick={() => toggleInspector()}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium border transition ${
            inspectorOpen
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-glow-cyan'
              : 'bg-canvas-card hover:bg-slate-800 text-slate-300 border-canvas-border'
          }`}
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      </div>
    </header>
  );
};
