import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';
import { Project, SeedDNARead, StageType, SystemHealthData } from '../types';

interface WorkspaceState {
  activeStage: StageType;
  unlockedStages: StageType[];
  seedText: string;
  activeProject: Project | null;
  seedDNA: SeedDNARead | null;
  isExtracting: boolean;
  extractionStep: string;
  inspectorOpen: boolean;
  inspectorTab: 'dna' | 'provenance';
  health: SystemHealthData | null;
  isSyncing: boolean;

  // Actions
  setActiveStage: (stage: StageType) => void;
  unlockStage: (stage: StageType) => void;
  setSeedText: (seed: string) => void;
  setActiveProject: (project: Project | null) => void;
  setSeedDNA: (seedDNA: SeedDNARead | null) => void;
  setExtracting: (isExtracting: boolean, step?: string) => void;
  extractSeedDNA: (customSeed?: string) => Promise<boolean>;
  toggleInspector: (open?: boolean) => void;
  setInspectorTab: (tab: 'dna' | 'provenance') => void;
  setHealth: (health: SystemHealthData | null) => void;
  setSyncing: (syncing: boolean) => void;
  resetWorkspace: () => void;
}

const DEFAULT_STAGES: StageType[] = ['seed'];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeStage: 'seed',
      unlockedStages: DEFAULT_STAGES,
      seedText: '',
      activeProject: null,
      seedDNA: null,
      isExtracting: false,
      extractionStep: '',
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
      setSeedDNA: (seedDNA) => set({ seedDNA }),
      setExtracting: (isExtracting, step = '') =>
        set({ isExtracting, extractionStep: step }),

      extractSeedDNA: async (customSeed?: string) => {
        const state = get();
        const seedToUse = (customSeed !== undefined ? customSeed : state.seedText).trim();
        if (!seedToUse) return false;

        set({
          isExtracting: true,
          extractionStep: 'Analyzing creative premise & narrative intent...',
        });

        try {
          let project = state.activeProject;
          if (!project) {
            const createRes = await apiClient.createProject('Seed World Project', seedToUse);
            if (!createRes.success || !createRes.data) {
              throw new Error(createRes.error?.message || 'Failed to initialize project');
            }
            project = createRes.data;
            set({ activeProject: project });
          }

          // Step animation progression timeouts
          const stepTimer1 = setTimeout(() => {
            if (get().isExtracting) {
              set({ extractionStep: 'Distilling implicit themes & core tensions...' });
            }
          }, 800);

          const stepTimer2 = setTimeout(() => {
            if (get().isExtracting) {
              set({ extractionStep: 'Identifying world entities & boundary constraints...' });
            }
          }, 1600);

          const stepTimer3 = setTimeout(() => {
            if (get().isExtracting) {
              set({ extractionStep: 'Finalizing Seed DNA contract...' });
            }
          }, 2400);

          const dnaRes = await apiClient.extractDNA(project.id, seedToUse);
          clearTimeout(stepTimer1);
          clearTimeout(stepTimer2);
          clearTimeout(stepTimer3);

          if (!dnaRes.success || !dnaRes.data) {
            throw new Error(dnaRes.error?.message || 'Extraction failed');
          }

          set((s) => ({
            seedDNA: dnaRes.data,
            seedText: seedToUse,
            unlockedStages: s.unlockedStages.includes('understand')
              ? s.unlockedStages
              : [...s.unlockedStages, 'understand'],
            activeStage: 'understand',
            inspectorOpen: true,
            inspectorTab: 'dna',
            isExtracting: false,
            extractionStep: '',
          }));
          return true;
        } catch (err) {
          console.error('Failed to extract Seed DNA:', err);
          set({ isExtracting: false, extractionStep: '' });
          return false;
        }
      },

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
          seedDNA: null,
          isExtracting: false,
          extractionStep: '',
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
        seedDNA: state.seedDNA,
        inspectorTab: state.inspectorTab,
      }),
    }
  )
);
