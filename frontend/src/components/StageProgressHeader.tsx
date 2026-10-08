import React from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const currentStageIndex = STAGES.findIndex((s) => s.id === activeStage);
  const currentStage = STAGES[currentStageIndex] || STAGES[0];

  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrevStage = () => {
    if (currentStageIndex > 0) {
      const prevStage = STAGES[currentStageIndex - 1];
      if (isUnlocked(prevStage.id)) {
        setActiveStage(prevStage.id);
      }
    }
  };

  const handleNextStage = () => {
    if (currentStageIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentStageIndex + 1];
      if (isUnlocked(nextStage.id)) {
        setActiveStage(nextStage.id);
      }
    }
  };

  if (isMobile) {
    return (
      <nav
        className="border-b border-[#D8CCB7] bg-[#F8F4E8] px-4 py-2 select-none shrink-0"
        aria-label="Seed Unfold Mobile Stage Navigation"
      >
        <div className="flex items-center justify-between">
          {/* Previous Stage Button */}
          <button
            type="button"
            onClick={handlePrevStage}
            disabled={currentStageIndex === 0}
            className="w-11 h-11 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[#294B3A] flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
            aria-label="Previous stage"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Stage Presentation */}
          <div className="flex flex-col items-center text-center px-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#718875] leading-none">
              Stage {currentStage.number} of 7
            </span>
            <span className="font-serif font-bold text-lg text-[#294B3A] leading-tight mt-0.5">
              {currentStage.label}
            </span>
            <span className="text-xs text-[#5F6D63] leading-none mt-0.5">
              {currentStage.description}
            </span>

            {/* 7 Interactive Stage Dots */}
            <div className="flex items-center justify-center gap-0.5 mt-1.5">
              {STAGES.map((stg) => {
                const stgUnlocked = isUnlocked(stg.id);
                const isCur = isCurrent(stg.id);
                const isComp = isCompleted(stg.id);

                return (
                  <button
                    key={stg.id}
                    id={`stage-nav-${stg.id}`}
                    type="button"
                    onClick={() => {
                      if (stgUnlocked) {
                        setActiveStage(stg.id);
                      }
                    }}
                    disabled={!stgUnlocked}
                    className="w-10 h-10 min-h-[40px] flex items-center justify-center rounded-full transition focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
                    aria-label={`Stage ${stg.number}: ${stg.label}`}
                    title={`Stage ${stg.number}: ${stg.label}`}
                  >
                    <span
                      className={`rounded-full transition-all ${
                        isCur
                          ? 'w-2.5 h-2.5 bg-[#294B3A] ring-2 ring-[#294B3A]/30'
                          : isComp
                          ? 'w-2 h-2 bg-[#718875]'
                          : 'w-2 h-2 bg-[#D8CCB7]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Stage Button */}
          <button
            type="button"
            onClick={handleNextStage}
            disabled={
              currentStageIndex === STAGES.length - 1 ||
              !isUnlocked(STAGES[currentStageIndex + 1]?.id)
            }
            className="w-11 h-11 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[#294B3A] flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
            aria-label="Next stage"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="border-b border-[#D8CCB7] bg-[#F8F4E8] px-4 sm:px-8 py-2.5 select-none shrink-0"
      aria-label="Seed Unfold Stage Navigation"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {STAGES.map((stage, idx) => {
          const unlocked = isUnlocked(stage.id);
          const current = isCurrent(stage.id);
          const completed = isCompleted(stage.id);

          return (
            <React.Fragment key={stage.id}>
              {/* 1px Connector Line between stages */}
              {idx > 0 && (
                <div
                  className={`flex-1 h-px mx-1.5 sm:mx-3 transition-colors ${
                    completed || current ? 'bg-[#A3B8A8]' : 'bg-[#D8CCB7]'
                  }`}
                  aria-hidden="true"
                />
              )}

              <button
                id={`stage-nav-${stage.id}`}
                onClick={() => {
                  if (unlocked) {
                    setActiveStage(stage.id);
                  }
                }}
                disabled={!unlocked}
                className={`relative flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl min-h-[44px] transition-all focus:outline-none focus:ring-2 focus:ring-[#355A46] ${
                  current
                    ? 'text-[#294B3A]'
                    : completed
                    ? 'text-[#294B3A] hover:text-[#355A46]'
                    : 'text-[#718875] opacity-60 cursor-not-allowed'
                }`}
                aria-current={current ? 'step' : undefined}
                aria-label={`Stage ${stage.number}: ${stage.label}`}
              >
                {/* Indicator circle (number or checkmark) */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all shrink-0 ${
                    current
                      ? 'bg-[#294B3A] text-[#F8F4E8] shadow-xs ring-2 ring-[#294B3A]/20'
                      : completed
                      ? 'bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]'
                      : 'bg-[#F2EBDD] text-[#718875] border border-[#D8CCB7]'
                  }`}
                >
                  {completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stage.number}
                </div>

                {/* Stage Label & Optional Description */}
                <div className="text-left">
                  <div
                    className={`text-xs sm:text-[13px] tracking-tight whitespace-nowrap transition-colors ${
                      current ? 'font-bold text-[#294B3A]' : 'font-medium'
                    }`}
                  >
                    {stage.label}
                  </div>
                  {/* Description only on wide desktop */}
                  <div
                    className={`text-[11px] leading-tight hidden xl:block whitespace-nowrap ${
                      current ? 'text-[#355A46] font-medium' : 'text-[#718875]'
                    }`}
                  >
                    {stage.description}
                  </div>
                </div>

                {/* Editorial Green Underline for Current Stage */}
                {current && (
                  <div
                    className="absolute -bottom-2.5 left-1 right-1 h-0.5 bg-[#294B3A] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
