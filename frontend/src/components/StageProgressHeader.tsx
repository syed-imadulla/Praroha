import React from 'react';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { StageDefinition, StageType } from '../types';

const STAGES: StageDefinition[] = [
  { id: 'seed', number: 1, label: 'Seed', description: 'Raw Idea' },
  { id: 'understand', number: 2, label: 'Understand', description: 'Seed DNA' },
  { id: 'worlds', number: 3, label: '3 Worlds', description: 'Latent Directions' },
  { id: 'choose', number: 4, label: 'Choose', description: 'Human Gate' },
  { id: 'unfold', number: 5, label: 'Unfold', description: 'Universe Expansion' },
  { id: 'trace', number: 6, label: 'Trace', description: 'Causal Lineage' },
  { id: 'refine', number: 7, label: 'Refine', description: 'Branch & Save' },
];

export const StageProgressHeader: React.FC = () => {
  const { activeStage, unlockedStages, activeProject, setActiveStage } = useWorkspaceStore();

  const isUnlocked = (stageId: StageType) => {
    if (unlockedStages.includes(stageId)) return true;
    if (stageId === 'unfold') {
      return (
        activeProject?.status === 'world_selected' ||
        activeProject?.status === 'unfolding' ||
        activeProject?.status === 'universe_unfolded'
      );
    }
    if (stageId === 'trace' || stageId === 'refine') {
      return activeProject?.status === 'universe_unfolded';
    }
    return false;
  };

  const isCurrent = (stageId: StageType) => activeStage === stageId;
  const isCompleted = (stageId: StageType) => {
    const currentIndex = STAGES.findIndex((s) => s.id === activeStage);
    const stageIndex = STAGES.findIndex((s) => s.id === stageId);
    return isUnlocked(stageId) && stageIndex < currentIndex;
  };

  return (
    <nav
      className="border-b border-[#D8CCB7] bg-[#F8F4E8] px-3 sm:px-6 py-2 overflow-x-auto select-none shrink-0"
      aria-label="Seed Unfold Stage Navigation"
    >
      <div className="flex items-center min-w-max mx-auto justify-start md:justify-center gap-1 sm:gap-1.5">
        {STAGES.map((stage, idx) => {
          const unlocked = isUnlocked(stage.id);
          const current = isCurrent(stage.id);
          const completed = isCompleted(stage.id);

          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <ChevronRight className="w-4 h-4 text-[#C8BAA5] shrink-0 mx-0.5" />
              )}
              <button
                id={`stage-nav-${stage.id}`}
                onClick={() => {
                  if (unlocked) {
                    setActiveStage(stage.id);
                  }
                }}
                disabled={!unlocked}
                className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-full min-h-[44px] text-sm font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-[#355A46] focus:ring-offset-2 ${
                  current
                    ? 'bg-[#355A46] text-[#F8F4E8] border border-[#294B3A] shadow-xs'
                    : completed
                    ? 'bg-[#EAE4D4] hover:bg-[#DDE2D2] text-[#294B3A] border border-[#D8CCB7]'
                    : 'bg-[#F2EBDD]/60 text-[#5F6D63] border border-[#D8CCB7]/50 cursor-not-allowed opacity-75'
                }`}
                aria-current={current ? 'step' : undefined}
                aria-label={`Stage ${stage.number}: ${stage.label}`}
              >
                {/* Stage status indicator icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    current
                      ? 'bg-[#F8F4E8] text-[#294B3A]'
                      : completed
                      ? 'bg-[#DDE2D2] text-[#294B3A]'
                      : 'bg-[#E8E0D0] text-[#5F6D63]'
                  }`}
                >
                  {completed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : !unlocked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    stage.number
                  )}
                </div>

                <div className="text-left">
                  <div className="leading-tight font-sans font-semibold tracking-tight text-sm">
                    {stage.label}
                  </div>
                  <div
                    className={`text-xs hidden xl:block leading-none mt-0.5 ${
                      current ? 'text-[#DDE2D2]' : 'text-[#5F6D63]'
                    }`}
                  >
                    {stage.description}
                  </div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
