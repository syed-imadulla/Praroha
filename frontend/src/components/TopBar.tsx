import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  ChevronDown,
  Check,
  Plus,
  BookOpen,
  Search,
  MoreHorizontal,
  Compass,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Layers,
  Database,
  Globe,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SearchModal } from './SearchModal';

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
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const branchMenuRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target as Node)) {
        setBranchMenuOpen(false);
      }
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBranchMenuOpen(false);
        setOverflowMenuOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleReset = () => {
    if (window.confirm('Start a new seed? This will reset current workspace progress.')) {
      resetWorkspace();
    }
  };

  const projectTitle = activeProject?.title || 'The Sunken City';
  const branchName = activeProject?.branch_name || 'main';

  return (
    <>
      <header className="h-[68px] sm:h-[72px] border-b border-[#D8CCB7] bg-[#F8F4E8] px-2.5 sm:px-6 flex items-center justify-between select-none z-30 shrink-0">
        {/* Left Side: Brand & Project Identity */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0">
          {/* Mobile Navigation Drawer Trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-nav'))}
            className="lg:hidden w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center text-[#294B3A] hover:bg-[#EAE4D4] focus:outline-none focus:ring-2 focus:ring-[#294B3A] shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          {/* Botanical PRAROHA Mark */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#DDE2D2] border border-[#C8D0BE] flex items-center justify-center text-[#294B3A] shadow-2xs">
              <svg
                className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#294B3A]"
                viewBox="0 0 36 36"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
                <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-[#294B3A] tracking-[0.14em] text-base sm:text-xl leading-none">
                PRAROHA
              </span>
              <span className="text-[11px] sm:text-xs text-[#718875] font-sans leading-none mt-1">
                Seed → Universe
              </span>
            </div>
          </div>

          {/* Subtle Vertical Divider */}
          <div className="h-7 sm:h-8 w-px bg-[#D8CCB7] mx-1 sm:mx-2.5 hidden sm:block shrink-0" aria-hidden="true" />

          {/* Project Thumbnail & Branch Selector (Visible on tablet & desktop) */}
          <div className="relative min-w-0 hidden sm:block" ref={branchMenuRef}>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Project Thumbnail Icon/Image */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-[#EAE4D4] border border-[#D8CCB7] overflow-hidden flex items-center justify-center text-[#355A46] shrink-0 shadow-2xs">
                <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* Title & Branch Popover Trigger */}
              <button
                type="button"
                id="branch-switcher-btn"
                onClick={() => {
                  setBranchMenuOpen(!branchMenuOpen);
                  fetchBranches();
                }}
                className="text-left group flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-[#355A46] rounded-md px-1 py-0.5 transition"
                aria-expanded={branchMenuOpen}
                aria-label="Select project branch"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-serif font-bold text-xs sm:text-base text-[#294B3A] group-hover:text-[#355A46] transition truncate max-w-[85px] sm:max-w-[170px] md:max-w-[220px]">
                      {projectTitle}
                    </span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#718875] group-hover:text-[#294B3A] transition shrink-0" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#718875] font-mono leading-none mt-0.5 flex items-center gap-1 truncate">
                    <span><strong className="text-[#294B3A] font-semibold">{branchName}</strong></span>
                    <span>•</span>
                    <span className="text-[#5F6D63]">TATTVA 2</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Branch Switcher Popover */}
            {branchMenuOpen && (
              <div
                id="branch-switcher-popover"
                className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-xl p-2.5 z-50 animate-fade-in"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#D8CCB7]/60 mb-1.5">
                  <span className="text-xs font-bold text-[#294B3A] uppercase tracking-wider font-mono">
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
                        type="button"
                        onClick={async () => {
                          await switchBranch(branch.id);
                          setBranchMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-xl text-xs transition ${
                          isActive
                            ? 'bg-[#DDE2D2] text-[#294B3A] font-semibold border border-[#C8D0BE]'
                            : 'text-[#394840] hover:bg-[#EAE4D4]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{branch.branch_name}</span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#294B3A] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Fork New Branch Input/Button */}
                <div className="pt-2 mt-1.5 border-t border-[#D8CCB7]/60">
                  {isForking ? (
                    <div className="space-y-1.5 p-1">
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
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#D8CCB7] rounded-lg text-[#294B3A] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsForking(false)}
                          className="px-2.5 py-1 text-xs text-[#718875] hover:text-[#294B3A]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (newBranchName.trim()) {
                              await forkBranch(newBranchName.trim());
                              setNewBranchName('');
                              setIsForking(false);
                              setBranchMenuOpen(false);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] rounded-lg font-semibold"
                        >
                          Fork
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsForking(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 min-h-[40px] text-xs text-[#294B3A] hover:bg-[#EAE4D4] rounded-xl transition font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#355A46]" />
                      <span>+ Fork New Branch</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Maximum 3 Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Utility 1: Search (Desktop & Tablet, ⌘K) */}
          <button
            type="button"
            id="global-search-btn"
            onClick={() => setSearchModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl min-h-[44px] bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] text-[#718875] hover:text-[#294B3A] text-xs transition shadow-2xs group focus:outline-none focus:ring-2 focus:ring-[#355A46]"
            aria-label="Search universe"
          >
            <Search className="w-4 h-4 text-[#718875] group-hover:text-[#294B3A]" />
            <span className="text-[#718875] group-hover:text-[#294B3A] hidden xl:inline">Search universe...</span>
            <kbd className="hidden xl:inline ml-1 px-1.5 py-0.5 rounded bg-[#E8E0D0] text-[10px] font-mono font-bold text-[#5F6D63] border border-[#D8CCB7]">⌘K</kbd>
          </button>

          {/* Utility 2: Inspect Drawer Toggle */}
          <button
            type="button"
            id="inspect-drawer-toggle-btn"
            onClick={() => toggleInspector()}
            className={`flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto p-2 sm:px-4 min-h-[36px] sm:min-h-[44px] rounded-full sm:rounded-xl text-xs sm:text-sm font-semibold border transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#355A46] ${
              inspectorOpen
                ? 'bg-[#355A46] text-[#F8F4E8] border-[#294B3A]'
                : 'bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border-[#D8CCB7]'
            }`}
            aria-expanded={inspectorOpen}
            aria-label="Toggle causal inspector drawer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Inspect</span>
          </button>

          {/* Utility 3: Workspace Overflow Menu (•••) */}
          <div className="relative" ref={overflowMenuRef}>
            <button
              type="button"
              id="workspace-overflow-menu-btn"
              onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#294B3A] hover:bg-[#355A46] text-[#F8F4E8] flex items-center justify-center transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
              aria-label="Workspace Menu"
              aria-expanded={overflowMenuOpen}
            >
              <MoreHorizontal className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            {/* Overflow Dropdown Card */}
            {overflowMenuOpen && (
              <div
                id="workspace-overflow-popover"
                className="absolute right-0 mt-2 w-76 sm:w-80 bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-xl p-2.5 z-50 animate-fade-in"
                role="menu"
              >
                {/* Section 1: Workspace Actions */}
                <div className="px-3 pt-1.5 pb-1 text-[11px] font-mono uppercase tracking-wider text-[#718875] font-semibold">
                  Workspace
                </div>

                <button
                  type="button"
                  id="overflow-search-btn"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    setSearchModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#EAE4D4] text-[#294B3A] text-xs sm:text-sm font-medium transition text-left"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-[#355A46]" />
                    <span>Search Universe</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#EAE4D4] border border-[#D8CCB7] text-[10px] font-mono text-[#5F6D63]">⌘K</kbd>
                </button>

                <button
                  type="button"
                  id="guided-tour-btn"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    startTour();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#EAE4D4] text-[#294B3A] text-xs sm:text-sm font-medium transition text-left"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-[#355A46]" />
                    <span>Guided Tour</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#EAE4D4] border border-[#D8CCB7] text-[10px] font-mono text-[#5F6D63]">T</kbd>
                </button>

                <button
                  type="button"
                  id="keyboard-shortcuts-btn"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    toggleShortcutsModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#EAE4D4] text-[#294B3A] text-xs sm:text-sm font-medium transition text-left"
                  role="menuitem"
                  title="Keyboard Shortcuts"
                  aria-label="Keyboard Shortcuts"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#355A46]" />
                    <span>Keyboard Shortcuts</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#EAE4D4] border border-[#D8CCB7] text-[10px] font-mono text-[#5F6D63]">⌘/</kbd>
                </button>

                <button
                  type="button"
                  id="instant-demo-topbar-btn"
                  onClick={async () => {
                    setOverflowMenuOpen(false);
                    await loadCanonicalDemoUniverse();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#EAE4D4] text-[#805B20] text-xs sm:text-sm font-medium transition text-left"
                  role="menuitem"
                  title="Load Canonical Demo Universe"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#C59A55]" />
                    <span>Demo Universe</span>
                  </div>
                  <span className="text-[11px] text-[#805B20] font-mono bg-[#E9DDBF] border border-[#D8C79D] px-1.5 py-0.5 rounded">Bio-City</span>
                </button>

                <button
                  type="button"
                  id="new-seed-btn"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    handleReset();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#EAE4D4] text-[#294B3A] text-xs sm:text-sm font-medium transition text-left"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-[#355A46]" />
                    <span>New Seed / Reset</span>
                  </div>
                </button>

                {/* Section 2: System Diagnostics */}
                <div className="my-2 border-t border-[#D8CCB7]" />
                <div className="px-3 pt-1 pb-1 text-[11px] font-mono uppercase tracking-wider text-[#718875] font-semibold">
                  System Diagnostics
                </div>

                <div className="px-3 py-2 min-h-[40px] flex items-center justify-between text-xs text-[#5F6D63]">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#718875]" />
                    <span>AI Provider</span>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-[#294B3A] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#355A46]"></span>
                    {health?.ai_provider.resolved ? health.ai_provider.resolved.toUpperCase() : 'GEMINI'}
                  </span>
                </div>

                <div className="px-3 py-2 min-h-[40px] flex items-center justify-between text-xs text-[#5F6D63]">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-[#718875]" />
                    <span>Database</span>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-[#294B3A] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#355A46]"></span>
                    {health?.storage_provider.type === 'LocalStorageProvider' ? 'Local' : 'Supabase'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Universe Search Dialog */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};
