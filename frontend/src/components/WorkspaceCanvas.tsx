import React from 'react';
import { Layers, Database, HardDrive, Compass, ArrowLeft } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedInputCanvas } from './SeedInputCanvas';
import { SeedDnaViewer } from './SeedDnaViewer';
import { WorldCandidatesCanvas } from './WorldCandidatesCanvas';
import { WorldSelectionCanvas } from './WorldSelectionCanvas';

export const WorkspaceCanvas: React.FC = () => {
  const {
    activeStage,
    setActiveStage,
    health,
    inspectorOpen,
    seedDNA,
  } = useWorkspaceStore();

  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStage]);

  return (
    <main
      ref={mainRef}
      className={`flex-1 overflow-y-auto transition-all duration-300 p-6 md:p-10 flex flex-col items-center justify-start ${
        inspectorOpen ? 'mr-0 md:mr-80 lg:mr-96' : ''
      }`}
    >
      <div className={`w-full ${activeStage === 'worlds' || activeStage === 'choose' ? 'max-w-7xl' : 'max-w-4xl'} space-y-8`}>
        {/* Dynamic Stage Canvas View */}
        {activeStage === 'seed' && <SeedInputCanvas />}

        {activeStage === 'understand' && <SeedDnaViewer dnaRecord={seedDNA} />}

        {activeStage === 'worlds' && <WorldCandidatesCanvas />}

        {activeStage === 'choose' && <WorldSelectionCanvas />}

        {activeStage !== 'seed' && activeStage !== 'understand' && activeStage !== 'worlds' && activeStage !== 'choose' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-sans capitalize">
              Stage: {activeStage}
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Universe unfolding will activate in Phase 5 (Stage-by-Stage Unfolding Pipeline).
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStage('choose')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to World Selection</span>
              </button>
            </div>
          </div>
        )}

        {/* Architecture & Engine Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-canvas-border/60">
          <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Layers className="w-4 h-4" />
              <span>AI Provider Engine</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Configured: <span className="text-cyan-300 font-bold">{health?.ai_provider.configured || 'gemini'}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Resolved: <span className="text-slate-200 font-mono">{health?.ai_provider.resolved || 'mock'}</span> with automatic fallback.
            </p>
          </div>

          <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Database className="w-4 h-4" />
              <span>Persistence Layer</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Engine: <span className="text-emerald-300 font-bold">SQLModel / SQLite</span>
            </p>
            <p className="text-[11px] text-slate-400">
              PostgreSQL/Supabase target with local SQLite fallback for offline execution.
            </p>
          </div>

          <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold">
              <HardDrive className="w-4 h-4" />
              <span>Cloud Object Storage</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Storage: <span className="text-violet-300 font-bold">{health?.storage_provider.type || 'LocalStorage'}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Binary assets strictly separated from database; stored in local ./uploads/ directory.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
