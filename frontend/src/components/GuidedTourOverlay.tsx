import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '../store/workspaceStore';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Layers,
  Cpu,
  CheckCircle2,
  GitBranch,
  Shield,
  Activity,
} from 'lucide-react';

interface TourStepData {
  stageNumber: number;
  stageName: string;
  tattvaTitle: string;
  subtitle: string;
  description: string;
  technicalFeat: string;
  icon: React.ReactNode;
  accentColor: string;
}

const TOUR_STEPS: TourStepData[] = [
  {
    stageNumber: 1,
    stageName: 'Seed',
    tattvaTitle: 'Avyakta (Starting Formless Potential)',
    subtitle: 'The Raw Creative Spark',
    description:
      'The creative journey begins in the formless realm. A raw, unconditioned user premise enters the system without premature structure or hallucinated boundaries.',
    technicalFeat: 'Deterministic canonical presets, freeform seed capture, and instant demo bootstrap.',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    accentColor: 'from-amber-500/20 to-amber-900/10 border-amber-500/30 text-amber-400',
  },
  {
    stageNumber: 2,
    stageName: 'Understand',
    tattvaTitle: 'Tattva 1: Bija (First Manifestation)',
    subtitle: 'Semantic Seed DNA Distillation',
    description:
      'The raw seed crystallizes into its foundational semantic DNA—distilling core premise, implicit themes, key entities, negative constraints, aesthetic tone, and domain keywords.',
    technicalFeat: 'Pydantic v2 strict schema enforcement and negative boundary preservation.',
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    accentColor: 'from-cyan-500/20 to-cyan-900/10 border-cyan-500/30 text-cyan-400',
  },
  {
    stageNumber: 3,
    stageName: '3 Worlds',
    tattvaTitle: 'Tattva 2: Srishti (Latent Forms)',
    subtitle: 'Exactly Three Creative Archetypes',
    description:
      'From the distilled Seed DNA, the engine branches into exactly three contrasting creative archetypes (Mythic, Ecological Bio-City, Time Capsule) eliminating cognitive overload.',
    technicalFeat: 'High-contrast prompt design preventing archetype convergence or generic overlap.',
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    accentColor: 'from-indigo-500/20 to-indigo-900/10 border-indigo-500/30 text-indigo-400',
  },
  {
    stageNumber: 4,
    stageName: 'Choose',
    tattvaTitle: 'Tattva 3: Sankalpa (Creative Commitment)',
    subtitle: 'Human-in-the-Loop Choice Gate',
    description:
      'Creation is not autonomous autopilot. The creator commits to a single trajectory, recording their creative rationale before any downstream expansion is unlocked.',
    technicalFeat: 'Architectural choice gate rejecting unauthorized downstream expansion attempts.',
    icon: <Compass className="w-5 h-5 text-purple-400" />,
    accentColor: 'from-purple-500/20 to-purple-900/10 border-purple-500/30 text-purple-400',
  },
  {
    stageNumber: 5,
    stageName: 'Unfold',
    tattvaTitle: 'Tattva 4: Vistara (Universe Expansion)',
    subtitle: '4-Layer Mini-Universe Codex',
    description:
      'The chosen world expands into a rich mini-universe: World Bible (geography, timeline, canon facts), Cast Members, Socio-Emotional Relationships, and Pivotal Narrative Scenes.',
    technicalFeat: 'Atomic multi-table transaction persistence with strict foreign key integrity.',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    accentColor: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400',
  },
  {
    stageNumber: 6,
    stageName: 'Trace',
    tattvaTitle: 'Tattva 5: Sambandha (Causal Lineage)',
    subtitle: 'Multi-Lane Provenance DAG',
    description:
      'Every downstream entity remains provably connected back to its origin. The interactive DAG reveals exact ancestor paths and causal lineage without leaking raw model CoT.',
    technicalFeat: 'Dynamic topological DAG layout with ancestor path glow and zoom/pan controls.',
    icon: <Activity className="w-5 h-5 text-sky-400" />,
    accentColor: 'from-sky-500/20 to-sky-900/10 border-sky-500/30 text-sky-400',
  },
  {
    stageNumber: 7,
    stageName: 'Refine',
    tattvaTitle: 'Tattva 6: Parinamana & Dharana (Transformation & Persistence)',
    subtitle: 'Versioned Refinement, Forking & Storage',
    description:
      'The unfolded universe lives. Creators refine character motivations, fork isolated timeline branches with complete ID remapping, and export portable project bundles.',
    technicalFeat: 'Immutable entity revisions with visual diffs, branch isolation, and object storage snapshots.',
    icon: <GitBranch className="w-5 h-5 text-rose-400" />,
    accentColor: 'from-rose-500/20 to-rose-900/10 border-rose-500/30 text-rose-400',
  },
];

export const GuidedTourOverlay: React.FC = () => {
  const { tourOpen, tourStep, nextTourStep, prevTourStep, closeTour } = useWorkspaceStore();

  if (!tourOpen) return null;

  const currentStepData = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 flex items-end justify-center sm:justify-end p-4 sm:p-8">
        <motion.div
          key={tourStep}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-lg bg-[#0e131f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-5 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                {currentStepData.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    Stage {currentStepData.stageNumber} of 7 • {currentStepData.stageName}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mt-1">
                  {currentStepData.tattvaTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={closeTour}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Tour (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-3.5">
            <div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                {currentStepData.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Technical Feat Pill */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="text-emerald-400 font-semibold">Technical Feat: </span>
                <span className="text-white/70">{currentStepData.technicalFeat}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-white/5 bg-black/30 flex items-center justify-between gap-4">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <div
                  key={s.stageNumber}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === tourStep
                      ? 'w-6 bg-cyan-400'
                      : idx < tourStep
                      ? 'w-2 bg-cyan-600/50'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevTourStep}
                disabled={isFirst}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <button
                onClick={isLast ? closeTour : nextTourStep}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                {isLast ? 'Finish Tour' : 'Next Stage'}
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
