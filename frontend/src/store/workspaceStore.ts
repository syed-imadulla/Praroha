import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';
import {
  Project,
  SeedDNARead,
  StageType,
  SystemHealthData,
  WorldCandidateRead,
  WorldSelectionRead,
  UnfoldedUniverseRead,
  TraceGraphRead,
  BranchRead,
  CharacterRead,
  SceneRead,
  CharacterRefineRequest,
  SceneRefineRequest,
  EntityRevisionRead,
  SnapshotRead,
} from '../types';

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
  unfoldedUniverse: UnfoldedUniverseRead | null;
  isUnfolding: boolean;
  unfoldingStep: number;
  unfoldError: string | null;
  activeCodexTab: 'bible' | 'characters' | 'scenes';
  lineageGraph: TraceGraphRead | null;
  selectedNodeId: string | null;
  isLoadingLineage: boolean;
  lineageFilter: 'all' | 'characters' | 'scenes' | 'locations' | 'lore';
  isExtracting: boolean;
  extractionStep: string;
  isGeneratingWorlds: boolean;
  worldBranchingStep: string;
  inspectorOpen: boolean;
  inspectorTab: 'dna' | 'provenance' | 'worlds';
  health: SystemHealthData | null;
  isSyncing: boolean;
  projectBranches: BranchRead[];
  entityRevisions: EntityRevisionRead[];
  snapshots: SnapshotRead[];
  refiningEntity: { type: 'character' | 'scene'; data: CharacterRead | SceneRead } | null;
  isBranching: boolean;
  isSavingSnapshot: boolean;

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
  setActiveCodexTab: (tab: 'bible' | 'characters' | 'scenes') => void;
  unfoldUniverse: () => Promise<boolean>;
  fetchUnfoldedUniverse: () => Promise<void>;
  fetchLineage: () => Promise<void>;
  setSelectedNodeId: (nodeId: string | null) => void;
  setLineageFilter: (filter: 'all' | 'characters' | 'scenes' | 'locations' | 'lore') => void;
  jumpToTraceNode: (nodeId: string) => void;
  fetchBranches: () => Promise<void>;
  switchBranch: (targetProjectId: string) => Promise<boolean>;
  forkBranch: (branchName: string, stage?: number, rationale?: string) => Promise<boolean>;
  refineCharacterAction: (charId: string, updates: CharacterRefineRequest) => Promise<boolean>;
  refineSceneAction: (sceneId: string, updates: SceneRefineRequest) => Promise<boolean>;
  fetchEntityRevisions: () => Promise<void>;
  fetchSnapshots: () => Promise<void>;
  createSnapshotAction: () => Promise<boolean>;
  setRefiningEntity: (entity: { type: 'character' | 'scene'; data: CharacterRead | SceneRead } | null) => void;
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
      unfoldedUniverse: null,
      isUnfolding: false,
      unfoldingStep: 0,
      unfoldError: null,
      activeCodexTab: 'bible',
      lineageGraph: null,
      selectedNodeId: null,
      isLoadingLineage: false,
      lineageFilter: 'all',
      isExtracting: false,
      extractionStep: '',
      isGeneratingWorlds: false,
      worldBranchingStep: '',
      inspectorOpen: false,
      inspectorTab: 'dna',
      health: null,
      isSyncing: false,
      projectBranches: [],
      entityRevisions: [],
      snapshots: [],
      refiningEntity: null,
      isBranching: false,
      isSavingSnapshot: false,

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

      setActiveCodexTab: (activeCodexTab) => set({ activeCodexTab }),

      unfoldUniverse: async () => {
        const state = get();
        const project = state.activeProject;
        if (!project || state.isUnfolding) return false;

        set({
          isUnfolding: true,
          unfoldError: null,
          unfoldingStep: 1,
        });

        // Step progression timers for responsive feedback
        const timer1 = setTimeout(() => {
          if (get().isUnfolding) set({ unfoldingStep: 2 });
        }, 500);
        const timer2 = setTimeout(() => {
          if (get().isUnfolding) set({ unfoldingStep: 3 });
        }, 1000);
        const timer3 = setTimeout(() => {
          if (get().isUnfolding) set({ unfoldingStep: 4 });
        }, 1500);

        try {
          const res = await apiClient.unfoldUniverse(project.id);
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);

          if (!res.success || !res.data) {
            throw new Error(res.error?.message || 'Failed to unfold universe');
          }

          const unfoldedData = res.data;
          set((s) => ({
            unfoldedUniverse: unfoldedData,
            isUnfolding: false,
            unfoldingStep: 4,
            unfoldError: null,
            activeProject: s.activeProject
              ? { ...s.activeProject, status: 'universe_unfolded' }
              : null,
            unlockedStages: Array.from(new Set([...s.unlockedStages, 'unfold', 'trace', 'refine'])),
          }));
          return true;
        } catch (err: unknown) {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
          const errorMsg =
            err instanceof Error ? err.message : 'Universe unfolding failed. Please try again.';
          console.error('Failed to unfold universe:', err);
          set((s) => ({
            isUnfolding: false,
            unfoldingStep: 0,
            unfoldError: errorMsg,
            activeProject: s.activeProject
              ? { ...s.activeProject, status: 'world_selected' }
              : null,
          }));
          return false;
        }
      },

      fetchUnfoldedUniverse: async () => {
        const state = get();
        const project = state.activeProject;
        if (!project) return;

        try {
          const res = await apiClient.getUnfoldedUniverse(project.id);
          if (res.success && res.data) {
            set((s) => ({
              unfoldedUniverse: res.data,
              unlockedStages: Array.from(new Set([...s.unlockedStages, 'unfold', 'trace', 'refine'])),
            }));
          }
        } catch (err) {
          console.debug('No existing unfolded universe to fetch:', err);
        }
      },

      fetchLineage: async () => {
        const state = get();
        const project = state.activeProject;
        if (!project) return;

        set({ isLoadingLineage: true });
        try {
          const res = await apiClient.getProjectLineage(project.id);
          if (res.success && res.data) {
            set({ lineageGraph: res.data, isLoadingLineage: false });
          } else {
            set({ isLoadingLineage: false });
          }
        } catch (err) {
          console.error('Failed to fetch project lineage:', err);
          set({ isLoadingLineage: false });
        }
      },

      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
      setLineageFilter: (lineageFilter) => set({ lineageFilter }),

      jumpToTraceNode: (nodeId: string) => {
        set((state) => ({
          activeStage: 'trace',
          selectedNodeId: nodeId,
          unlockedStages: Array.from(new Set([...state.unlockedStages, 'trace'])),
        }));
        const state = get();
        state.fetchLineage();
      },

      fetchBranches: async () => {
        const { activeProject } = get();
        if (!activeProject) return;
        try {
          const res = await apiClient.listBranches(activeProject.id);
          if (res.success && res.data) {
            set({ projectBranches: res.data });
          }
        } catch (err) {
          console.error('Failed to fetch branches:', err);
        }
      },

      switchBranch: async (targetProjectId: string) => {
        try {
          const projRes = await apiClient.getProject(targetProjectId);
          if (!projRes.success || !projRes.data) return false;
          const targetProject = projRes.data;
          set({
            activeProject: targetProject,
            seedDNA: null,
            worlds: [],
            selectedWorldId: targetProject.selected_world_id || null,
            activeSelection: null,
            unfoldedUniverse: null,
            lineageGraph: null,
            entityRevisions: [],
          });

          await get().fetchBranches();

          const dnaRes = await apiClient.getLatestDNA(targetProjectId);
          if (dnaRes.success && dnaRes.data) {
            set({ seedDNA: dnaRes.data });
          }

          const worldsRes = await apiClient.getLatestWorlds(targetProjectId);
          if (worldsRes.success && worldsRes.data && worldsRes.data.length > 0) {
            set({ worlds: worldsRes.data });
          }

          const selRes = await apiClient.getActiveSelection(targetProjectId);
          if (selRes.success && selRes.data) {
            set({ activeSelection: selRes.data, selectedWorldId: selRes.data.world_candidate_id });
          }

          const unfoldRes = await apiClient.getUnfoldedUniverse(targetProjectId);
          if (unfoldRes.success && unfoldRes.data) {
            set({
              unfoldedUniverse: unfoldRes.data,
              unlockedStages: ['seed', 'understand', 'worlds', 'choose', 'unfold', 'trace', 'refine'],
              activeStage: 'refine',
            });
            await get().fetchLineage();
            await get().fetchEntityRevisions();
            await get().fetchSnapshots();
          } else if (selRes.success && selRes.data) {
            set({
              unlockedStages: ['seed', 'understand', 'worlds', 'choose', 'unfold'],
              activeStage: 'unfold',
            });
          } else if (worldsRes.success && worldsRes.data && worldsRes.data.length > 0) {
            set({
              unlockedStages: ['seed', 'understand', 'worlds', 'choose'],
              activeStage: 'choose',
            });
          } else if (dnaRes.success && dnaRes.data) {
            set({
              unlockedStages: ['seed', 'understand', 'worlds'],
              activeStage: 'worlds',
            });
          }
          return true;
        } catch (err) {
          console.error('Failed to switch branch:', err);
          return false;
        }
      },

      forkBranch: async (branchName: string, stage: number = 5, rationale?: string) => {
        const { activeProject } = get();
        if (!activeProject) return false;
        set({ isBranching: true });
        try {
          const res = await apiClient.branchProject(activeProject.id, branchName, stage, rationale);
          if (res.success && res.data) {
            await get().switchBranch(res.data.id);
            set({ isBranching: false });
            return true;
          }
          set({ isBranching: false });
          return false;
        } catch (err) {
          console.error('Failed to fork branch:', err);
          set({ isBranching: false });
          return false;
        }
      },

      refineCharacterAction: async (charId: string, updates: CharacterRefineRequest) => {
        const { activeProject, unfoldedUniverse } = get();
        if (!activeProject) return false;
        try {
          const res = await apiClient.refineCharacter(activeProject.id, charId, updates);
          if (res.success && res.data && unfoldedUniverse) {
            const updatedChars = unfoldedUniverse.characters.map((c) =>
              c.id === charId ? res.data! : c
            );
            set({
              unfoldedUniverse: {
                ...unfoldedUniverse,
                characters: updatedChars,
              },
              refiningEntity: null,
            });
            await get().fetchEntityRevisions();
            await get().fetchLineage();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to refine character:', err);
          return false;
        }
      },

      refineSceneAction: async (sceneId: string, updates: SceneRefineRequest) => {
        const { activeProject, unfoldedUniverse } = get();
        if (!activeProject) return false;
        try {
          const res = await apiClient.refineScene(activeProject.id, sceneId, updates);
          if (res.success && res.data && unfoldedUniverse) {
            const updatedScenes = unfoldedUniverse.scenes.map((s) =>
              s.id === sceneId ? res.data! : s
            );
            set({
              unfoldedUniverse: {
                ...unfoldedUniverse,
                scenes: updatedScenes,
              },
              refiningEntity: null,
            });
            await get().fetchEntityRevisions();
            await get().fetchLineage();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to refine scene:', err);
          return false;
        }
      },

      fetchEntityRevisions: async () => {
        const { activeProject } = get();
        if (!activeProject) return;
        try {
          const res = await apiClient.listRevisions(activeProject.id);
          if (res.success && res.data) {
            set({ entityRevisions: res.data });
          }
        } catch (err) {
          console.error('Failed to fetch entity revisions:', err);
        }
      },

      fetchSnapshots: async () => {
        const { activeProject } = get();
        if (!activeProject) return;
        try {
          const res = await apiClient.listSnapshots(activeProject.id);
          if (res.success && res.data) {
            set({ snapshots: res.data });
          }
        } catch (err) {
          console.error('Failed to fetch snapshots:', err);
        }
      },

      createSnapshotAction: async () => {
        const { activeProject } = get();
        if (!activeProject) return false;
        set({ isSavingSnapshot: true });
        try {
          const res = await apiClient.createSnapshot(activeProject.id);
          if (res.success && res.data) {
            set((s) => ({
              snapshots: [res.data!, ...s.snapshots],
              isSavingSnapshot: false,
            }));
            return true;
          }
          set({ isSavingSnapshot: false });
          return false;
        } catch (err) {
          console.error('Failed to create snapshot:', err);
          set({ isSavingSnapshot: false });
          return false;
        }
      },

      setRefiningEntity: (refiningEntity) => set({ refiningEntity }),

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
          unfoldedUniverse: null,
          isUnfolding: false,
          unfoldingStep: 0,
          unfoldError: null,
          activeCodexTab: 'bible',
          lineageGraph: null,
          selectedNodeId: null,
          isLoadingLineage: false,
          lineageFilter: 'all',
          projectBranches: [],
          entityRevisions: [],
          snapshots: [],
          refiningEntity: null,
          isBranching: false,
          isSavingSnapshot: false,
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
        unfoldedUniverse: state.unfoldedUniverse,
        activeCodexTab: state.activeCodexTab,
        inspectorTab: state.inspectorTab,
      }),
    }
  )
);

