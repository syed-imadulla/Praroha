import React from 'react';
import { Sparkles, Compass, Shield, ArrowRight, Layers, Database, HardDrive } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

const CANONICAL_SEED = 'A child discovers a forgotten city beneath the ocean.';

export const WorkspaceCanvas: React.FC = () => {
  const {
    seedText,
    setSeedText,
    health,
    inspectorOpen,
    toggleInspector,
  } = useWorkspaceStore();

  const handleUseDemo = () => {
    setSeedText(CANONICAL_SEED);
  };

  return (
    <main
      className={`flex-1 overflow-y-auto transition-all duration-300 p-6 md:p-10 flex flex-col items-center justify-start ${
        inspectorOpen ? 'mr-0 md:mr-80 lg:mr-96' : ''
      }`}
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero Title & Philosophy */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tattva: Forms Hidden in the Formless</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-100 font-sans">
            Unfold One Seed into a Universe
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Enter an incomplete, raw premise. Seed Unfold extracts its latent DNA, branches into exactly three distinct creative worlds, and lets you steer its progressive unfolding.
          </p>
        </div>

        {/* Primary Seed Input Canvas Card */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-5 border border-canvas-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 opacity-60" />

          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>The Creative Seed</span>
            </label>
            <button
              onClick={handleUseDemo}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 transition"
            >
              Use Canonical Demo Seed
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              placeholder="e.g. A solitary cartographer maps islands that vanish when not being observed..."
              className="w-full bg-canvas-deep/90 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition font-sans text-sm md:text-base resize-none shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Immutable input guarantee — raw seed is never discarded or mutated</span>
            </div>

            <button
              onClick={() => toggleInspector(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Inspect Workspace Shell</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Architecture & Engine Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Layers className="w-4 h-4" />
              <span>AI Provider Engine</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Provider: <span className="text-cyan-300 font-bold">{health?.ai_provider.resolved || 'mock'}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Zero-latency mock provider active with canonical underwater city fixtures.
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
