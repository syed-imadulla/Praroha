import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileEdit,
  Sparkles,
  ShieldCheck,
  Dna,
  Lock,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { WorldCandidateCard } from './WorldCandidateCard';
import { WorldCandidateRead } from '../types';

export const WorldSelectionCanvas: React.FC = () => {
  const {
    activeProject,
    worlds,
    seedDNA,
    selectedWorldId,
    selectedWorldRationale,
    isSelectingWorld,
    setSelectedWorldId,
    setSelectedWorldRationale,
    confirmWorldSelection,
    setActiveStage,
    toggleInspector,
    setInspectorTab,
  } = useWorkspaceStore();

  const [localRationale, setLocalRationale] = useState<string>(selectedWorldRationale || '');

  // Check if Stage 5 has commenced
  const isStage5Begun =
    activeProject?.status !== undefined &&
    ['unfolding', 'unfolded', 'bible_generated', 'characters_generated', 'scenes_generated'].includes(
      activeProject.status
    );

  // Active selected candidate object
  const chosenCandidate = worlds.find((w) => w.id === selectedWorldId) || null;

  const handleSelectCandidate = (candidate: WorldCandidateRead) => {
    if (isStage5Begun) return;
    setSelectedWorldId(candidate.id);
  };

  const handleConfirmLock = async () => {
    if (!selectedWorldId || isStage5Begun) return;
    setSelectedWorldRationale(localRationale);
    await confirmWorldSelection(selectedWorldId, localRationale);
  };

  const handleBackToStage3 = () => {
    setActiveStage('worlds');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 py-4 sm:py-6 px-2 sm:px-4">
      {/* Top Header & Human-in-the-Loop Choice Gate Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-canvas-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Stage 4 / 07 — Choice Gate
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3 h-3" />
              Human-in-the-Loop
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-slate-100 tracking-tight">
            Human World Selection & Creative Commitment
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Choose which of the three contrasting worlds becomes your project's canonical foundation. All subsequent generative unfolding (bible, characters, and scenes) will anchor strictly to this choice.
          </p>
        </div>

        {/* Back and Status Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToStage3}
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            title="Return to candidate comparison without locking"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stage 3</span>
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
            <button
              type="button"
              onClick={() => {
                setInspectorTab('dna');
                toggleInspector(true);
              }}
              className="text-cyan-400 hover:underline text-[11px] font-medium"
            >
              View DNA Full
            </button>
          </div>
        </div>
      )}

      {/* Stage 5 Unfolding Lock Banner */}
      {isStage5Begun && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Direction Frozen:</strong> Stage 5 universe unfolding has already begun. The selected world is locked to preserve narrative consistency. To explore another candidate, branch the project.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveStage('unfold')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            Go to Stage 5
          </button>
        </div>
      )}

      {/* 3-Column Comparative Grid with Glow & Dim Hierarchy */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">
            {isStage5Begun ? 'Selected canon world direction:' : 'Select one world direction to activate:'}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {isStage5Begun
              ? 'Direction locked (Stage 5 active)'
              : selectedWorldId
              ? '1 direction active (switchable before Stage 5)'
              : 'No direction chosen yet'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {worlds.map((candidate, idx) => {
            const isSelected = selectedWorldId === candidate.id;
            const isDimmed = selectedWorldId !== null && !isSelected;

            return (
              <WorldCandidateCard
                key={candidate.id || idx}
                candidate={candidate}
                index={idx}
                isSelected={isSelected}
                isDimmed={isDimmed}
                isSelectable={!isStage5Begun}
                actionLabel={isSelected ? 'Selected Direction' : 'Select This Direction'}
                onSelect={handleSelectCandidate}
                selectionDisabled={isStage5Begun}
              />
            );
          })}
        </div>
      </div>

      {/* Selection Confirmation & Creator Rationale Drawer / Panel */}
      <AnimatePresence>
        {chosenCandidate ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-6 rounded-2xl glass-card border border-cyan-500/40 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chosen World Direction</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>{chosenCandidate.title}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-normal">
                    {chosenCandidate.archetype}
                  </span>
                  {chosenCandidate.divergence_archetype && (
                    <span className="text-[10.5px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300">
                      {chosenCandidate.divergence_archetype}
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmLock}
                  disabled={isSelectingWorld}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  title="Lock this creative world direction and proceed to Stage 5 Unfolding"
                >
                  <Lock className={`w-4 h-4 ${isSelectingWorld ? 'animate-spin' : ''}`} />
                  <span>{isSelectingWorld ? 'Locking Direction...' : 'Confirm & Lock Direction (Proceed to Stage 5)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Creator Notes / Rationale Input */}
            <div className="space-y-2">
              <label
                htmlFor="creator-rationale"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"
              >
                <FileEdit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Creator Notes & Creative Rationale (Optional)</span>
              </label>
              <p className="text-xs text-slate-400 leading-relaxed">
                Why did you select this world? What thematic angles, character motivations, or aesthetic details should the AI prioritize during Stage 5 unfolding?
              </p>
              <textarea
                id="creator-rationale"
                rows={3}
                value={localRationale}
                onChange={(e) => setLocalRationale(e.target.value)}
                placeholder="e.g., Focus on the symbiotic bioluminescent biology and the ethical dilemma of harvesting the ancient coral core..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-200 placeholder-slate-500 text-xs sm:text-sm font-sans transition-all resize-y"
              />
            </div>

            {/* Decision Provenance Note */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11.5px] text-slate-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Locking records a permanent provenance checkpoint in the project DAG. You can still switch candidates within this batch until Stage 5 unfolding commences.
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 rounded-2xl glass-card border border-slate-800 text-center space-y-3">
            <Compass className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-slate-200">
              No Direction Selected Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click <strong>"Select This Direction"</strong> on any of the three cards above to review details, record your rationale, and confirm your world choice.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
