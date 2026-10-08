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
    <header className="h-15 sm:h-16 border-b border-[#D8CCB7] bg-[#F4EEDF] px-4 sm:px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#DDE2D2] border border-[#C8D0BE] flex items-center justify-center text-[#294B3A] shadow-2xs">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#294B3A] tracking-tight text-lg sm:text-xl">
                Praroha
              </span>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAE4D4] text-[#355A46] border border-[#D8CCB7]">
                Tattva 2
              </span>
              <span className="hidden sm:inline text-xs text-[#5F6D63] font-sans font-medium">
                Forms hidden in formless
              </span>
            </div>
            <p className="text-xs text-[#394840] font-medium leading-none truncate max-w-[200px] sm:max-w-xs mt-1 font-sans">
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full min-h-[38px] bg-[#F8F4E8] hover:bg-[#E8E0D0] border border-[#D8CCB7] text-xs sm:text-[13px] text-[#294B3A] transition shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#355A46]"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#355A46]" />
            <span className="text-[#5F6D63] font-medium">Branch:</span>
            <span className="font-mono text-[#294B3A] font-semibold truncate max-w-[120px]">
              {activeProject?.branch_name || 'main'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5F6D63] ml-0.5" />
          </button>

          {branchMenuOpen && (
            <div
              id="branch-switcher-popover"
              className="absolute left-0 mt-2 w-72 bg-[#F8F4E8] border border-[#D8CCB7] rounded-[16px] shadow-lg p-2 z-50 animate-fade-in"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#D8CCB7]/60 mb-1.5">
                <span className="text-xs font-bold text-[#294B3A] uppercase tracking-wider">
                  Timeline Branches
                </span>
                <span className="text-xs text-[#5F6D63] font-medium font-mono">
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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full min-h-[38px] bg-[#F8F4E8] border border-[#D8CCB7] text-xs sm:text-[13px]">
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#466A55] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#294B3A]"></span>
              </span>
            ) : (
              <AlertCircle className="w-4 h-4 text-[#B8734F]" />
            )}
            <span className="text-[#294B3A] font-semibold">
              {isHealthy ? `AI: ${health?.ai_provider.resolved}` : 'Connecting...'}
            </span>
          </div>
          {isHealthy && (
            <span className="text-xs text-[#5F6D63] border-l border-[#D8CCB7] pl-2 font-mono font-medium">
              {health?.storage_provider.type === 'LocalStorageProvider' ? 'Local' : 'Supabase'}
            </span>
          )}
        </div>

        {/* Instant Canonical Demo Launcher */}
        <button
          onClick={() => loadCanonicalDemoUniverse()}
          id="instant-demo-topbar-btn"
          title="Instantly generate and unfold complete Bio-City universe (DEMO-01)"
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 min-h-[38px] text-xs sm:text-[13px] rounded-full bg-[#E9DDBF] hover:bg-[#DFCFA7] text-[#805B20] border border-[#D8C79D] transition font-semibold shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#805B20]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span className="hidden md:inline">Demo Universe</span>
        </button>

        {/* 7-Stage Guided Tour Launcher */}
        <button
          onClick={() => startTour()}
          id="guided-tour-btn"
          title="Launch 7-Stage Guided Demo Tour (t)"
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 min-h-[38px] text-xs sm:text-[13px] rounded-full bg-[#DDE2D2] hover:bg-[#C8D0BE] text-[#294B3A] border border-[#C8D0BE] transition font-semibold shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#294B3A]"
        >
          <Compass className="w-4 h-4" />
          <span className="hidden lg:inline">Guided Tour</span>
        </button>

        {/* Shortcuts Modal Launcher */}
        <button
          onClick={() => toggleShortcutsModal()}
          id="keyboard-shortcuts-btn"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F8F4E8] hover:bg-[#E8E0D0] text-[#355A46] hover:text-[#294B3A] border border-[#D8CCB7] transition shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#355A46]"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Restart Button */}
        <button
          onClick={handleReset}
          title="Start with a new seed idea"
          className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs sm:text-[13px] rounded-full bg-[#F8F4E8] hover:bg-[#E8E0D0] text-[#355A46] hover:text-[#294B3A] border border-[#D8CCB7] transition font-medium shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#355A46]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Seed</span>
        </button>

        {/* Inspector Drawer Toggle */}
        <button
          onClick={() => toggleInspector()}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] text-xs sm:text-[13px] rounded-full font-semibold border transition shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#355A46] ${
            inspectorOpen
              ? 'bg-[#355A46] text-[#F8F4E8] border-[#294B3A]'
              : 'bg-[#F8F4E8] hover:bg-[#E8E0D0] text-[#294B3A] border-[#D8CCB7]'
          }`}
        >
          <PanelRight className="w-4 h-4" />
          <span>Inspect</span>
        </button>
      </div>
    </header>
  );
};
