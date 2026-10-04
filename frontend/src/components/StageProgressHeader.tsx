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
    <nav className="border-b border-canvas-border bg-canvas-deep/80 px-4 py-2 overflow-x-auto select-none">
      <div className="flex items-center min-w-max mx-auto justify-start md:justify-center gap-1">
        {STAGES.map((stage, idx) => {
          const unlocked = isUnlocked(stage.id);
          const current = isCurrent(stage.id);
          const completed = isCompleted(stage.id);

          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mx-0.5" />
              )}
              <button
                id={`stage-nav-${stage.id}`}
                onClick={() => {
                  if (unlocked) {
                    setActiveStage(stage.id);
                  }
                }}
                disabled={!unlocked}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  current
                    ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/60 shadow-glow-cyan'
                    : completed
                    ? 'bg-canvas-card hover:bg-slate-800 text-slate-300 border border-canvas-border hover:border-slate-600'
                    : 'bg-transparent text-slate-600 border border-transparent cursor-not-allowed opacity-50'
                }`}
              >
                {/* Stage status indicator icon */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    current
                      ? 'bg-cyan-500 text-black shadow-glow-cyan'
                      : completed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {completed ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : !unlocked ? (
                    <Lock className="w-2.5 h-2.5" />
                  ) : (
                    stage.number
                  )}
                </div>

                <div className="text-left">
                  <div className="leading-tight font-semibold tracking-wide">
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden lg:block leading-none">
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
