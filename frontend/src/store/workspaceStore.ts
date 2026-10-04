import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, StageType, SystemHealthData } from '../types';

interface WorkspaceState {
  activeStage: StageType;
  unlockedStages: StageType[];
  seedText: string;
  activeProject: Project | null;
  inspectorOpen: boolean;
  inspectorTab: 'dna' | 'provenance';
  health: SystemHealthData | null;
  isSyncing: boolean;

  // Actions
  setActiveStage: (stage: StageType) => void;
  unlockStage: (stage: StageType) => void;
  setSeedText: (seed: string) => void;
  setActiveProject: (project: Project | null) => void;
  toggleInspector: (open?: boolean) => void;
  setInspectorTab: (tab: 'dna' | 'provenance') => void;
  setHealth: (health: SystemHealthData | null) => void;
  setSyncing: (syncing: boolean) => void;
  resetWorkspace: () => void;
}

const DEFAULT_STAGES: StageType[] = ['seed'];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeStage: 'seed',
      unlockedStages: DEFAULT_STAGES,
      seedText: '',
      activeProject: null,
      inspectorOpen: false,
      inspectorTab: 'dna',
      health: null,
      isSyncing: false,

      setActiveStage: (stage) => set({ activeStage: stage }),
      unlockStage: (stage) =>
        set((state) => ({
          unlockedStages: state.unlockedStages.includes(stage)
            ? state.unlockedStages
            : [...state.unlockedStages, stage],
        })),
      setSeedText: (seedText) => set({ seedText }),
      setActiveProject: (activeProject) => set({ activeProject }),
      toggleInspector: (open) =>
        set((state) => ({
          inspectorOpen: typeof open === 'boolean' ? open : !state.inspectorOpen,
        })),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setHealth: (health) => set({ health }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      resetWorkspace: () =>
        set({
          activeStage: 'seed',
          unlockedStages: DEFAULT_STAGES,
          seedText: '',
          activeProject: null,
          inspectorOpen: false,
          inspectorTab: 'dna',
        }),
    }),
    {
      name: 'seed-unfold-workspace',
      partialize: (state) => ({
        activeStage: state.activeStage,
        unlockedStages: state.unlockedStages,
        seedText: state.seedText,
        activeProject: state.activeProject,
        inspectorTab: state.inspectorTab,
      }),
    }
  )
);
