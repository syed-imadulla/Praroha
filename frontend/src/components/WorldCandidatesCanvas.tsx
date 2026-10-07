import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  RotateCw,
  Sparkles,
  ArrowRight,
  Dna,
  Info,
  Zap,
  Orbit,
  Compass,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { WorldCandidateCard } from './WorldCandidateCard';
import { WorldCandidateRead } from '../types';

export const WorldCandidatesCanvas: React.FC = () => {
  const {
    worlds,
    isGeneratingWorlds,
    worldBranchingStep,
    generateWorlds,
    seedDNA,
    setActiveStage,
    unlockStage,
    toggleInspector,
    setInspectorTab,
  } = useWorkspaceStore();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const hasTriggeredRef = React.useRef(false);

  // Auto-generate on first arrival if worlds are empty and DNA exists
  useEffect(() => {
    if (worlds.length === 0 && !isGeneratingWorlds && seedDNA && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      generateWorlds();
    }
  }, [worlds.length, isGeneratingWorlds, seedDNA, generateWorlds]);

  const handleRegenerate = async () => {
    await generateWorlds();
  };

  const handleSelectCandidate = (candidate: WorldCandidateRead) => {
    setSelectedCandidateId(candidate.id);
    setInspectorTab('worlds');
    toggleInspector(true);
  };

  const handleProceedToStage4 = () => {
    unlockStage('choose');
    setActiveStage('choose');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 py-4 sm:py-6 px-2 sm:px-4">
      {/* Top Header & Stage Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-canvas-border">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Globe className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Stage 3 / 07 — Divergent Worlds
            </span>
            {/* Triad Balance Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10.5px] font-mono text-slate-400">
              <span className="text-cyan-400">1 Familiar</span>
              <span>•</span>
              <span className="text-violet-400">1 Radical</span>
              <span>•</span>
              <span className="text-rose-400">1 Inverse</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-slate-100 tracking-tight">
            Divergent Worlds Engine
            <span className="sr-only">Three Contrasting Creative Worlds</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Synthesizes exactly three intentional exploration archetypes (Familiar, Radical, Inverse) with 4-metric exploration profiles anchored to your accepted Seed Potential.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isGeneratingWorlds}
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Generate a fresh set of three world candidates"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGeneratingWorlds ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isGeneratingWorlds ? 'Synthesizing Worlds...' : 'Re-generate'}</span>
          </button>

          <button
            type="button"
            onClick={handleProceedToStage4}
            disabled={isGeneratingWorlds || worlds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Proceed to Selection (Stage 4)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grounding Reminder: Seed DNA Anchor Strip */}
      {seedDNA && (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Dna className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300 font-medium">Seed DNA Anchor:</span>
            <span className="text-slate-400 italic line-clamp-1">"{seedDNA.dna.premise}"</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-500 font-mono">Tone:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px]">
              {seedDNA.dna.tone}
            </span>
            <button
              type="button"
              onClick={() => {
                setInspectorTab('dna');
                toggleInspector(true);
              }}
              className="text-cyan-400 hover:underline text-[11px] font-medium ml-2"
            >
              View DNA Full
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isGeneratingWorlds ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full py-20 px-6 rounded-2xl glass-card border border-canvas-border flex flex-col items-center justify-center text-center space-y-6"
          >
            {/* Pulsing branching node animation */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-24 h-24 rounded-full bg-cyan-500/10 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-glow-cyan">
                <Globe className="w-8 h-8 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-bold text-slate-200">
                Divergent Worlds Engine Running
              </h3>
              <p className="text-xs text-cyan-400 font-mono animate-pulse">
                {worldBranchingStep || 'Synthesizing Divergence Triad (Familiar / Radical / Inverse)...'}
              </p>
            </div>

            {/* Candidate archetypes pulse indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-2">
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>1. Familiar (High Fidelity)</span>
              </div>
              <div className="p-3 rounded-lg bg-violet-950/30 border border-violet-800/40 text-[11px] text-violet-300 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                <span>2. Radical (Paradigm Shift)</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 flex items-center gap-2">
                <Orbit className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>3. Inverse (Subversion)</span>
              </div>
            </div>
          </motion.div>
        ) : worlds.length === 3 ? (
          <motion.div
            key="candidates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* 3-Column Responsive Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {worlds.map((candidate, idx) => (
                <WorldCandidateCard
                  key={candidate.id || idx}
                  candidate={candidate}
                  index={idx}
                  isSelected={selectedCandidateId === candidate.id}
                  onSelect={handleSelectCandidate}
                  selectionDisabled={false}
                />
              ))}
            </div>

            {/* Bottom Guidance Banner */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Compare the three archetypes side-by-side. In <strong>Stage 4: World Selection</strong>, you will choose one world to progressively unfold into bible, characters, and scenes.
                </span>
              </div>
              <button
                type="button"
                onClick={handleProceedToStage4}
                className="text-cyan-400 hover:text-cyan-300 font-semibold whitespace-nowrap flex items-center gap-1 text-xs"
              >
                <span>Continue to Stage 4</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="p-12 text-center rounded-2xl glass-card border border-canvas-border space-y-4">
            <Globe className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              No Worlds Generated Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Extract Seed DNA first, then trigger the Divergent Worlds Engine to synthesize the triad.
            </p>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Worlds Now</span>
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
