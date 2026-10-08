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
    activeProject,
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

  // Auto-generate on first arrival if worlds are empty (or belong to a different project) and DNA exists
  useEffect(() => {
    const hasCurrentWorlds =
      worlds.length > 0 && (!activeProject || worlds.every((w) => w.project_id === activeProject.id));
    if (!hasCurrentWorlds && !isGeneratingWorlds && seedDNA && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      generateWorlds();
    }
  }, [worlds, isGeneratingWorlds, seedDNA, activeProject, generateWorlds]);

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
    <div className="w-full space-y-6 sm:space-y-8 py-2">
      {/* Top Header & Stage Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8CCB7]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A]">
              <Globe className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#466A55]">
              Stage 3 / 07 — Divergent Worlds
            </span>
            {/* Triad Balance Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[11px] font-mono text-[#294B3A]">
              <span className="text-[#294B3A] font-semibold">1 Familiar</span>
              <span className="text-[#D8CCB7]">•</span>
              <span className="text-[#6A4B67] font-semibold">1 Radical</span>
              <span className="text-[#D8CCB7]">•</span>
              <span className="text-[#B8734F] font-semibold">1 Inverse</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#294B3A] tracking-tight">
            Divergent Worlds Engine
            <span className="sr-only">Three Contrasting Creative Worlds</span>
          </h2>
          <p className="text-[#466A55] text-xs sm:text-sm max-w-2xl">
            Synthesizes exactly three intentional exploration archetypes (Familiar, Radical, Inverse) with 4-metric exploration profiles anchored to your accepted Seed Potential.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isGeneratingWorlds}
            className="px-4 py-2.5 rounded-full bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7] text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-2xs"
            title="Generate a fresh set of three world candidates"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGeneratingWorlds ? 'animate-spin text-[#355A46]' : 'text-[#466A55]'}`} />
            <span>{isGeneratingWorlds ? 'Creating Worlds...' : 'Create Again'}</span>
          </button>
        </div>
      </div>

      {/* Grounding Reminder: Seed DNA Anchor Strip */}
      {seedDNA && (
        <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-[#466A55] font-semibold">
            <Dna className="w-4 h-4 text-[#355A46] shrink-0" />
            <span className="text-[#294B3A] font-medium">Seed DNA Anchor:</span>
            <span className="text-[#466A55] italic line-clamp-1">"{seedDNA.dna.premise}"</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#718875] font-mono">Tone:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EAE4D4] border border-[#D8CCB7] text-[#294B3A] text-[11px]">
              {seedDNA.dna.tone}
            </span>
            <button
              type="button"
              onClick={() => {
                setInspectorTab('dna');
                toggleInspector(true);
              }}
              className="text-[#355A46] hover:underline text-[11px] font-semibold ml-2"
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
            className="w-full py-16 px-6 rounded-2xl bg-[#F8F4E8] border border-[#D8CCB7] flex flex-col items-center justify-center text-center space-y-6 shadow-xs"
          >
            {/* Branching icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#DDE2D2] border border-[#C8D0BE] flex items-center justify-center">
              <Globe className="w-8 h-8 text-[#294B3A] animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-serif font-bold text-[#294B3A]">
                Divergent Worlds Engine Running
              </h3>
              <p className="text-xs text-[#466A55] font-mono animate-pulse">
                {worldBranchingStep || 'Synthesizing Divergence Triad (Familiar / Radical / Inverse)...'}
              </p>
            </div>

            {/* Candidate archetypes pulse indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-2">
              <div className="p-3 rounded-xl bg-[#DDE2D2] border border-[#C8D0BE] text-[11px] text-[#294B3A] flex items-center gap-2 font-medium">
                <Compass className="w-3.5 h-3.5 text-[#294B3A]" />
                <span>1. Familiar (High Fidelity)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE8EE] border border-[#D1BECD] text-[11px] text-[#6A4B67] flex items-center gap-2 font-medium">
                <Zap className="w-3.5 h-3.5 text-[#6A4B67]" />
                <span>2. Radical (Paradigm Shift)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F5E6DC] border border-[#E2BFAC] text-[11px] text-[#B8734F] flex items-center gap-2 font-medium">
                <Orbit className="w-3.5 h-3.5 text-[#B8734F]" />
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
            {/* 3-Column Responsive Comparison Grid (desktop: 3 cols, tablet/mobile: stacked 1 col) */}
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

            {/* Bottom Guidance Banner and Stage Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] shadow-2xs">
              <div className="flex items-center gap-2 text-[#466A55] text-xs">
                <Info className="w-4 h-4 text-[#355A46] shrink-0" />
                <span>
                  Compare the three archetypes side-by-side. In <strong className="text-[#294B3A]">Stage 4: World Selection</strong>, you will choose one world to progressively unfold into bible, characters, and scenes.
                </span>
              </div>
              <button
                type="button"
                data-testid="bottom-proceed-to-stage4-btn"
                onClick={handleProceedToStage4}
                disabled={isGeneratingWorlds}
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>Proceed to Selection (Stage 4)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-4">
            <Globe className="w-12 h-12 text-[#466A55] mx-auto" />
            <h3 className="text-base font-serif font-bold text-[#294B3A]">
              No Worlds Generated Yet
            </h3>
            <p className="text-xs text-[#466A55] max-w-sm mx-auto">
              Extract Seed DNA first, then trigger the Divergent Worlds Engine to synthesize the triad.
            </p>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-5 py-2 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold text-xs inline-flex items-center gap-2 shadow-xs transition"
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
