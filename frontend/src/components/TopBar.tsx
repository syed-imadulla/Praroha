import React, { useState } from 'react';
import {
  GitBranch,
  RefreshCw,
  PanelRight,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Check,
  Plus,
  Compass,
  HelpCircle,
} from 'lucide-react';
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
    startTour,
    toggleShortcutsModal,
    loadCanonicalDemoUniverse,
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
    <header className="h-14 border-b border-[#D8CCB7] bg-[#F4EEDF] px-4 sm:px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#DDE2D2] border border-[#C8D0BE] flex items-center justify-center text-[#294B3A] shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#294B3A] tracking-tight text-base sm:text-[17px]">
                Praroha
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAE4D4] text-[#466A55] border border-[#D8CCB7]">
                Tattva 2
              </span>
              <span className="hidden sm:inline text-[11px] text-[#718875] font-sans">
                Forms hidden in formless
              </span>
            </div>
            <p className="text-[11px] text-[#718875] leading-none truncate max-w-[180px] sm:max-w-xs mt-0.5 font-sans">
              {activeProject ? activeProject.title : 'Seed → Universe · Creative Journal'}
            </p>
          </div>
        </div>

        {/* Interactive Branch Switcher Dropdown (PERS-02) */}
        <div className="relative ml-1">
          <button
            onClick={() => {
              setBranchMenuOpen(!branchMenuOpen);
              fetchBranches();
            }}
            id="branch-switcher-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F4E8] hover:bg-[#E8E0D0] border border-[#D8CCB7] text-xs text-[#294B3A] transition shadow-2xs"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#466A55]" />
            <span className="text-[#718875]">Branch:</span>
            <span className="font-mono text-[#294B3A] font-medium truncate max-w-[110px]">
              {activeProject?.branch_name || 'main'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#718875] ml-0.5" />
          </button>

          {branchMenuOpen && (
            <div
              id="branch-switcher-popover"
              className="absolute left-0 mt-2 w-72 bg-[#F8F4E8] border border-[#D8CCB7] rounded-[16px] shadow-lg p-2 z-50 animate-fade-in"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#D8CCB7]/60 mb-1.5">
                <span className="text-[11px] font-semibold text-[#466A55] uppercase tracking-wider">
                  Timeline Branches
                </span>
                <span className="text-[10px] text-[#718875]">
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
                          ? 'bg-[#DDE2D2] text-[#294B3A] font-medium border border-[#C8D0BE]'
                          : 'text-[#394840] hover:bg-[#E8E0D0]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GitBranch className={`w-3.5 h-3.5 ${isActive ? 'text-[#294B3A]' : 'text-[#718875]'}`} />
                        <span className="truncate">{branch.branch_name}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#294B3A] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Fork Form / Button */}
              <div className="pt-2 mt-1.5 border-t border-[#D8CCB7]/60">
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
                      className="w-full px-2.5 py-1 text-xs bg-white border border-[#D8CCB7] rounded-md text-[#294B3A] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setIsForking(false)}
                        className="px-2 py-0.5 text-[11px] text-[#718875] hover:text-[#294B3A]"
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
                        className="px-2.5 py-0.5 text-[11px] bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] rounded-md font-medium"
                      >
                        Fork
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsForking(true)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#294B3A] hover:bg-[#E8E0D0] rounded-lg transition font-medium"
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
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Backend & AI Provider Status */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F8F4E8] border border-[#D8CCB7] text-xs">
          <div className="flex items-center gap-1.5">
            {isHealthy ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#466A55] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#294B3A]"></span>
              </span>
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-[#B8734F]" />
            )}
            <span className="text-[#294B3A] font-medium text-[11.5px]">
              {isHealthy ? `AI: ${health?.ai_provider.resolved}` : 'Connecting...'}
            </span>
          </div>
          {isHealthy && (
            <span className="text-[10px] text-[#718875] border-l border-[#D8CCB7] pl-2 font-mono">
              {health?.storage_provider.type === 'LocalStorageProvider' ? 'Local' : 'Supabase'}
            </span>
          )}
        </div>

        {/* Instant Canonical Demo Launcher */}
        <button
          onClick={() => loadCanonicalDemoUniverse()}
          id="instant-demo-topbar-btn"
          title="Instantly generate and unfold complete Bio-City universe (DEMO-01)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[#E7C8B5] hover:bg-[#DFAFA0] text-[#A0522D] border border-[#B8734F]/30 transition font-medium shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span className="hidden md:inline">Demo Universe</span>
        </button>

        {/* 7-Stage Guided Tour Launcher */}
        <button
          onClick={() => startTour()}
          id="guided-tour-btn"
          title="Launch 7-Stage Guided Demo Tour (t)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[#DDE2D2] hover:bg-[#C8D0BE] text-[#294B3A] border border-[#C8D0BE] transition font-medium shadow-2xs"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Guided Tour</span>
        </button>

        {/* Shortcuts Modal Launcher */}
        <button
          onClick={() => toggleShortcutsModal()}
          id="keyboard-shortcuts-btn"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
          className="p-1.5 text-xs rounded-full bg-[#F8F4E8] hover:bg-[#E8E0D0] text-[#466A55] hover:text-[#294B3A] border border-[#D8CCB7] transition shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Restart Button */}
        <button
          onClick={handleReset}
          title="Start with a new seed idea"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[#F8F4E8] hover:bg-[#E8E0D0] text-[#466A55] hover:text-[#294B3A] border border-[#D8CCB7] transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Seed</span>
        </button>

        {/* Inspector Drawer Toggle */}
        <button
          onClick={() => toggleInspector()}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium border transition shadow-2xs ${
            inspectorOpen
              ? 'bg-[#355A46] text-[#F8F4E8] border-[#294B3A]'
              : 'bg-[#F8F4E8] hover:bg-[#E8E0D0] text-[#294B3A] border-[#D8CCB7]'
          }`}
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      </div>
    </header>
  );
};
