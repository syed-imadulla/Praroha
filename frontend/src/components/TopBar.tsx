import { GitBranch, RefreshCw, PanelRight, Sparkles, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const TopBar: React.FC = () => {
  const {
    activeProject,
    health,
    inspectorOpen,
    toggleInspector,
    resetWorkspace,
  } = useWorkspaceStore();

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

        {/* Branch Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-canvas-card border border-canvas-border text-xs text-slate-300">
          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Branch:</span>
          <span className="font-mono text-cyan-300 font-medium">prime / main</span>
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
