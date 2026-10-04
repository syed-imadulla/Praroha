import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';
import { Project, SeedDNARead, StageType, SystemHealthData, WorldCandidateRead, WorldSelectionRead } from '../types';

interface WorkspaceState {
  activeStage: StageType;
  unlockedStages: StageType[];
  seedText: string;
  activeProject: Project | null;
  seedDNA: SeedDNARead | null;
  worlds: WorldCandidateRead[];
  selectedWorldId: string | null;
  selectedWorldRationale: string;
  activeSelection: WorldSelectionRead | null;
  isSelectingWorld: boolean;
  isExtracting: boolean;
  extractionStep: string;
  isGeneratingWorlds: boolean;
  worldBranchingStep: string;
  inspectorOpen: boolean;
  inspectorTab: 'dna' | 'provenance' | 'worlds';
  health: SystemHealthData | null;
  isSyncing: boolean;

  // Actions
  setActiveStage: (stage: StageType) => void;
  unlockStage: (stage: StageType) => void;
  setSeedText: (seed: string) => void;
  setActiveProject: (project: Project | null) => void;
  setSeedDNA: (seedDNA: SeedDNARead | null) => void;
  setWorlds: (worlds: WorldCandidateRead[]) => void;
  setSelectedWorldId: (id: string | null) => void;
  setSelectedWorldRationale: (rationale: string) => void;
  confirmWorldSelection: (candidateId: string, rationale?: string) => Promise<boolean>;
  fetchActiveSelection: () => Promise<void>;
  setExtracting: (isExtracting: boolean, step?: string) => void;
  extractSeedDNA: (customSeed?: string) => Promise<boolean>;
  generateWorlds: () => Promise<boolean>;
  toggleInspector: (open?: boolean) => void;
  setInspectorTab: (tab: 'dna' | 'provenance' | 'worlds') => void;
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
      worlds: [],
      selectedWorldId: null,
      selectedWorldRationale: '',
      activeSelection: null,
      isSelectingWorld: false,
      isExtracting: false,
      extractionStep: '',
      isGeneratingWorlds: false,
      worldBranchingStep: '',
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
      setWorlds: (worlds) => set({ worlds }),
      setSelectedWorldId: (selectedWorldId) => set({ selectedWorldId }),
      setSelectedWorldRationale: (selectedWorldRationale) => set({ selectedWorldRationale }),

      confirmWorldSelection: async (candidateId: string, rationale?: string) => {
        const state = get();
        const project = state.activeProject;
        if (!project) return false;

        set({ isSelectingWorld: true });
        try {
          const res = await apiClient.selectWorld(project.id, candidateId, rationale);
          if (!res.success || !res.data) {
            throw new Error(res.error?.message || 'Failed to select world candidate');
          }

          const selectionData = res.data;
          set((s) => ({
            selectedWorldId: selectionData.world_candidate_id,
            selectedWorldRationale: selectionData.user_rationale || '',
            activeSelection: selectionData,
            isSelectingWorld: false,
            activeProject: s.activeProject
              ? {
                  ...s.activeProject,
                  status: 'world_selected',
                  selected_world_id: selectionData.world_candidate_id,
                }
              : null,
            unlockedStages: s.unlockedStages.includes('unfold')
              ? s.unlockedStages
              : [...s.unlockedStages, 'unfold'],
            activeStage: 'unfold',
            inspectorOpen: true,
            inspectorTab: 'provenance',
          }));
          return true;
        } catch (err) {
          console.error('Failed to select world candidate:', err);
          set({ isSelectingWorld: false });
          return false;
        }
      },

      fetchActiveSelection: async () => {
        const project = get().activeProject;
        if (!project) return;
        try {
          const res = await apiClient.getActiveSelection(project.id);
          if (res.success && res.data) {
            set({
              activeSelection: res.data,
              selectedWorldId: res.data.world_candidate_id,
              selectedWorldRationale: res.data.user_rationale || '',
            });
          }
        } catch (err) {
          console.error('Error fetching active selection:', err);
        }
      },

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

      generateWorlds: async () => {
        const state = get();
        const project = state.activeProject;
        if (!project) return false;

        set({
          isGeneratingWorlds: true,
          worldBranchingStep: 'Analyzing Seed DNA constraints & core themes...',
        });

        try {
          const stepTimer1 = setTimeout(() => {
            if (get().isGeneratingWorlds) {
              set({ worldBranchingStep: 'Formulating contrasting archetypes (Mythic, Ecological, Technological)...' });
            }
          }, 700);

          const stepTimer2 = setTimeout(() => {
            if (get().isGeneratingWorlds) {
              set({ worldBranchingStep: 'Synthesizing core tensions, aesthetics & cinematic visuals...' });
            }
          }, 1400);

          const res = await apiClient.generateWorlds(project.id);
          clearTimeout(stepTimer1);
          clearTimeout(stepTimer2);

          if (!res.success || !res.data) {
            throw new Error(res.error?.message || 'Failed to generate worlds');
          }

          set((s) => ({
            worlds: res.data || [],
            unlockedStages: s.unlockedStages.includes('worlds')
              ? s.unlockedStages
              : [...s.unlockedStages, 'worlds'],
            activeStage: 'worlds',
            isGeneratingWorlds: false,
            worldBranchingStep: '',
          }));
          return true;
        } catch (err) {
          console.error('Failed to generate worlds:', err);
          set({ isGeneratingWorlds: false, worldBranchingStep: '' });
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
          worlds: [],
          selectedWorldId: null,
          selectedWorldRationale: '',
          activeSelection: null,
          isSelectingWorld: false,
          isExtracting: false,
          extractionStep: '',
          isGeneratingWorlds: false,
          worldBranchingStep: '',
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
        worlds: state.worlds,
        selectedWorldId: state.selectedWorldId,
        selectedWorldRationale: state.selectedWorldRationale,
        activeSelection: state.activeSelection,
        inspectorTab: state.inspectorTab,
      }),
    }
  )
);
