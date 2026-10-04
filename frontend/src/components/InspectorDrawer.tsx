import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dna, GitCommit, Info, Sparkles, Globe } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedDnaViewer } from './SeedDnaViewer';

export const InspectorDrawer: React.FC = () => {
  const {
    inspectorOpen,
    inspectorTab,
    toggleInspector,
    setInspectorTab,
    seedDNA,
    worlds,
  } = useWorkspaceStore();

  return (
    <AnimatePresence>
      {inspectorOpen && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-14 right-0 bottom-0 w-80 md:w-96 bg-canvas-panel/95 backdrop-blur-xl border-l border-canvas-border shadow-2xl flex flex-col z-20"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-canvas-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold text-slate-100 text-sm">
                Workspace Inspector
              </h2>
            </div>
            <button
              onClick={() => toggleInspector(false)}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-canvas-border bg-canvas-card/40">
            <button
              onClick={() => setInspectorTab('dna')}
              className={`flex-1 py-2 px-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                inspectorTab === 'dna'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>DNA</span>
            </button>

            <button
              onClick={() => setInspectorTab('worlds')}
              className={`flex-1 py-2 px-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                inspectorTab === 'worlds'
                  ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Worlds ({worlds.length})</span>
            </button>

            <button
              onClick={() => setInspectorTab('provenance')}
              className={`flex-1 py-2 px-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                inspectorTab === 'provenance'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Lineage</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inspectorTab === 'dna' && (
              seedDNA ? (
                <SeedDnaViewer dnaRecord={seedDNA} compact={true} />
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-canvas-card/60 border border-canvas-border text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-medium mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Seed DNA Parameters</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Extracted intent, tone, entities, and constraints will appear here as structured chips and exportable JSON once the understanding pass runs.
                    </p>
                  </div>
                </div>
              )
            )}

            {inspectorTab === 'worlds' && (
              worlds.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center justify-between">
                    <span>Batch ID: {worlds[0]?.batch_id.slice(0, 8)}...</span>
                    <span className="font-mono">{worlds[0]?.model_used}</span>
                  </div>

                  {worlds.map((w, idx) => {
                    const accents = [
                      { border: 'border-cyan-500/40', badge: 'bg-cyan-500/10 text-cyan-400' },
                      { border: 'border-emerald-500/40', badge: 'bg-emerald-500/10 text-emerald-400' },
                      { border: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-400' },
                    ];
                    const currentAccent = accents[idx % accents.length];

                    return (
                      <div
                        key={w.id || idx}
                        className={`p-3.5 rounded-xl bg-slate-900/60 border ${currentAccent.border} space-y-2 text-xs`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${currentAccent.badge}`}>
                            Candidate 0{w.candidate_index || idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {w.archetype}
                          </span>
                        </div>

                        <div className="font-bold text-slate-100 text-sm">
                          {w.title}
                        </div>

                        <p className="text-slate-300 text-[11.5px] italic leading-relaxed">
                          "{w.concept}"
                        </p>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-semibold">Tension: </span>
                            <span className="text-slate-300">{w.core_tension}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold">Trade-offs: </span>
                            <span className="text-slate-300">{w.trade_offs}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <Globe className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-xs font-semibold text-slate-300">
                    No World Candidates Available
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Switch to Stage 3 (Three Worlds) and generate candidates to inspect and compare them here.
                  </p>
                </div>
              )
            )}

            {inspectorTab === 'provenance' && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-canvas-card/60 border border-canvas-border text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>Causal Provenance Lineage</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Every character, location, rule, and scene maintains an explicit parent-child edge back to its generating world candidate and seed.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="text-slate-500 font-mono text-[10px] uppercase">
                    Graph Engine
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">
                    DAG Relationships: derived_from, constrained_by, selected_by
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Traceability visualization activates in Phase 6.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-canvas-border bg-canvas-panel text-[11px] text-slate-500 text-center font-mono">
            Seed Unfold Inspector • Phase 3 Candidates
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
