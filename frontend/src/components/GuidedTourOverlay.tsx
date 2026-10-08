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
  tattvaConnection: string;
  technicalFeat: string;
  icon: React.ReactNode;
  accentColor: string;
}

const TOUR_STEPS: TourStepData[] = [
  {
    stageNumber: 1,
    stageName: 'Seed',
    tattvaTitle: 'Stage 1: Seed — Formless Creative Potential',
    subtitle: 'The Raw Creative Spark',
    description:
      'The challenge asks us to explore how a small seed contains the potential for richer forms. Praroha begins with a compact, unconditioned creative premise—the formless starting condition from which all macro-scale forms will emerge.',
    tattvaConnection:
      'Forms hidden in formless: The entire macro-scale universe is latent within this small starting seed.',
    technicalFeat: 'Deterministic canonical presets, freeform seed capture, and instant demo bootstrap.',
    icon: <Sparkles className="w-5 h-5 text-[#805B20]" />,
    accentColor: 'border-[#C59A55]/30 text-[#805B20]',
  },
  {
    stageNumber: 2,
    stageName: 'Understand',
    tattvaTitle: 'Stage 2: Understand — Seed DNA Distillation',
    subtitle: 'Uncovering the Hidden Structure',
    description:
      'Before generating worlds, the system analyzes the seed to distill its foundational semantic DNA—core premise, implicit themes, key entities, negative constraints, and tone.',
    tattvaConnection:
      'Forms hidden in formless: Revealing the inherent rules and latent structure buried within the formless seed.',
    technicalFeat: 'Pydantic v2 strict schema enforcement and negative boundary preservation.',
    icon: <Cpu className="w-5 h-5 text-[#294B3A]" />,
    accentColor: 'border-[#294B3A]/30 text-[#294B3A]',
  },
  {
    stageNumber: 3,
    stageName: '3 Worlds',
    tattvaTitle: 'Stage 3: 3 Worlds — Latent Manifestations',
    subtitle: 'Exactly Three Creative Archetypes',
    description:
      'From the distilled Seed DNA, the generative engine reveals three distinct, high-contrast manifestations (Mythic, Ecological Bio-City, Relic Capsule) eliminating cognitive overload.',
    tattvaConnection:
      'Forms hidden in formless: Demonstrating how one seed can unfold into multiple divergent, coherent forms.',
    technicalFeat: 'High-contrast prompt design preventing archetype convergence or generic overlap.',
    icon: <Layers className="w-5 h-5 text-[#355A46]" />,
    accentColor: 'border-[#355A46]/30 text-[#355A46]',
  },
  {
    stageNumber: 4,
    stageName: 'Choose',
    tattvaTitle: 'Stage 4: Choose — Human Creative Direction',
    subtitle: 'Human-in-the-Loop Choice Gate',
    description:
      'Creation is not autonomous autopilot. The creator commits to a single trajectory, recording their creative rationale before any downstream expansion is unlocked.',
    tattvaConnection:
      'Forms hidden in formless: Initial human agency selecting which latent form will be brought into full manifestation.',
    technicalFeat: 'Architectural choice gate rejecting unauthorized downstream expansion attempts.',
    icon: <Compass className="w-5 h-5 text-[#B8734F]" />,
    accentColor: 'border-[#B8734F]/30 text-[#B8734F]',
  },
  {
    stageNumber: 5,
    stageName: 'Unfold',
    tattvaTitle: 'Stage 5: Unfold — Selected World Becomes a Universe',
    subtitle: '4-Layer Mini-Universe Codex',
    description:
      'The selected form expands into a complete mini-universe: World Bible (canon facts, physics rules, locations), grounded characters, socio-emotional dynamics, and narrative scenes.',
    tattvaConnection:
      'Forms hidden in formless: The compact seed has now unfolded into a rich, visible multi-dimensional universe.',
    technicalFeat: 'Atomic multi-table transaction persistence with strict foreign key integrity.',
    icon: <CheckCircle2 className="w-5 h-5 text-[#294B3A]" />,
    accentColor: 'border-[#294B3A]/30 text-[#294B3A]',
  },
  {
    stageNumber: 6,
    stageName: 'Trace',
    tattvaTitle: 'Stage 6: Trace — Causal Lineage Back to Seed',
    subtitle: 'Multi-Lane Provenance DAG',
    description:
      'Every downstream entity remains provably connected back to its origin. The interactive DAG reveals exact ancestor paths and causal lineage without leaking raw model reasoning tokens.',
    tattvaConnection:
      'Forms hidden in formless: Proving that every single manifest atom originated directly from the unmanifest seed.',
    technicalFeat: 'Dynamic topological DAG layout with ancestor path glow and zoom/pan controls.',
    icon: <Activity className="w-5 h-5 text-[#466A55]" />,
    accentColor: 'border-[#466A55]/30 text-[#466A55]',
  },
  {
    stageNumber: 7,
    stageName: 'Refine',
    tattvaTitle: 'Stage 7: Refine — Evolve while Preserving Continuity',
    subtitle: 'Versioned Refinement, Forking & Storage',
    description:
      'The unfolded universe lives. Creators refine characters and scenes with immutable version logs, fork isolated timeline branches with complete ID remapping, and export portable project bundles.',
    tattvaConnection:
      'Forms hidden in formless: Continuous evolutionary unfolding while preserving the identity of the original seed.',
    technicalFeat: 'Immutable entity revisions with visual diffs, branch isolation, and object storage snapshots.',
    icon: <GitBranch className="w-5 h-5 text-[#6A4B67]" />,
    accentColor: 'border-[#6A4B67]/30 text-[#6A4B67]',
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
          className="pointer-events-auto w-full max-w-lg bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-2xl overflow-hidden text-[#294B3A]"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-5 border-b border-[#D8CCB7] bg-[#F2EBDD] flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FAF6EE] border border-[#D8CCB7] shadow-xs">
                {currentStepData.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/40 font-bold min-h-[26px] inline-flex items-center">
                    Tattva 2: Forms Hidden in Formless
                  </span>
                  <span className="text-xs font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#FAF6EE] text-[#394840] border border-[#D8CCB7] font-semibold min-h-[26px] inline-flex items-center">
                    Stage {currentStepData.stageNumber} of 7 • {currentStepData.stageName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#294B3A] mt-1.5 leading-snug">
                  {currentStepData.tattvaTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={closeTour}
              className="min-w-[44px] min-h-[44px] rounded-lg text-[#5F6D63] hover:text-[#294B3A] hover:bg-[#FAF6EE] transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
              title="Close Tour (Escape)"
              aria-label="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-[#5F6D63] uppercase tracking-wider mb-1.5">
                {currentStepData.subtitle}
              </p>
              <p className="text-sm sm:text-[15px] text-[#394840] leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Tattva 2 Connection Pill */}
            <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#D8CCB7] flex items-start gap-3 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#805B20] shrink-0 mt-0.5" />
              <div className="text-[13px] leading-relaxed">
                <span className="text-[#805B20] font-bold">Tattva 2 Connection: </span>
                <span className="text-[#294B3A] font-medium">{currentStepData.tattvaConnection}</span>
              </div>
            </div>

            {/* Technical Feat Pill */}
            <div className="p-3 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] flex items-start gap-3 shadow-xs">
              <Shield className="w-4 h-4 text-[#294B3A] shrink-0 mt-0.5" />
              <div className="text-[13px] leading-relaxed">
                <span className="text-[#294B3A] font-bold">Technical Feat: </span>
                <span className="text-[#394840]">{currentStepData.technicalFeat}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-[#D8CCB7] bg-[#F2EBDD] flex items-center justify-between gap-4">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5" aria-label={`Step ${tourStep + 1} of ${TOUR_STEPS.length}`}>
              {TOUR_STEPS.map((s, idx) => (
                <div
                  key={s.stageNumber}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === tourStep
                      ? 'w-7 bg-[#294B3A]'
                      : idx < tourStep
                      ? 'w-2.5 bg-[#466A55]'
                      : 'w-2.5 bg-[#D8CCB7]'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={prevTourStep}
                disabled={isFirst}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border border-[#D8CCB7] text-[#394840] hover:text-[#294B3A] hover:bg-[#FAF6EE] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={isLast ? closeTour : nextTourStep}
                className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[#294B3A] hover:bg-[#355A46] text-[#F8F4E8] shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
              >
                {isLast ? 'Finish Tour' : 'Next Stage'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
