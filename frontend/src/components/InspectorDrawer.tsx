import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dna, GitCommit, Info, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedDnaViewer } from './SeedDnaViewer';

export const InspectorDrawer: React.FC = () => {
  const {
    inspectorOpen,
    inspectorTab,
    toggleInspector,
    setInspectorTab,
    activeStage,
    seedDNA,
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
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-canvas-border bg-canvas-card/40">
            <button
              onClick={() => setInspectorTab('dna')}
              className={`flex-1 py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
                inspectorTab === 'dna'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Seed DNA</span>
            </button>
            <button
              onClick={() => setInspectorTab('provenance')}
              className={`flex-1 py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
                inspectorTab === 'provenance'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Traceability DAG</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inspectorTab === 'dna' ? (
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
                      Extracted intent, tone, entities, and constraints will appear here as structured chips and exportable JSON once the understanding pass runs in Stage 1.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                    <div className="text-slate-500 font-mono text-[10px] uppercase">
                      Current Stage Context
                    </div>
                    <div className="text-slate-200 font-semibold uppercase font-mono tracking-wider">
                      {activeStage}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Seed DNA parameters remain immutable across all subsequent stages to guarantee thematic coherence.
                    </div>
                  </div>
                </div>
              )
            ) : (
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
            Seed Unfold Inspector • Phase 2 DNA
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
