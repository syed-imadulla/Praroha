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
  WorldSelectionCreate,
  UnfoldedUniverseRead,
  TraceGraphRead,
  BranchRead,
  CharacterRead,
  SceneRead,
  CharacterRefineRequest,
  SceneRefineRequest,
  EntityRevisionRead,
  SnapshotRead,
  SeedPotentialItem,
  PotentialItemStatus,
  MediaAsset,
  MediaJobResponse,
  MediaGenerationRequest,
  MediaProviderHealth,
  MediaType,
  PremiseVariable,
  SeedMutationRequest,
  EntityImpactItem,
  MutationSimulationResponse,
  ForkMutationRequest,
  CodexTab,
  CounterfactualCandidate,
  CounterfactualDeltaResponse,
  ForkCounterfactualRequest,
  HumanOnlyZones,
  ProjectBundle,
} from '../types';

export function deriveProjectTitle(seedText: string): string {
  const cleaned = (seedText || '').trim();
  if (!cleaned) return 'New Seed';
  const firstSentence = cleaned.split('.')[0].trim();
  const words = firstSentence.split(/\s+/).filter(Boolean);
  const snippet = (words.length <= 6 ? words.join(' ') : words.slice(0, 6).join(' ')).replace(/[,;:—"'\t\n]/g, '').trim();
  if (snippet.length > 40) return snippet.slice(0, 40).trim();
  return snippet ? snippet.charAt(0).toUpperCase() + snippet.slice(1) : 'New Seed';
}

interface WorkspaceState {
  activeNav: 'home' | 'creations' | 'graveyard' | 'profile';
  setActiveNav: (nav: 'home' | 'creations' | 'graveyard' | 'profile') => void;
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
  activeCodexTab: CodexTab;
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
  tourOpen: boolean;
  tourStep: number;
  shortcutsModalOpen: boolean;
  providerFallbackWarning: string | null;
  potentialItems: SeedPotentialItem[];
  isExtractingPotential: boolean;
  understandSubTab: 'dna' | 'potential';
  mediaAssets: Record<string, MediaAsset[]>;
  activeMediaJobs: Record<string, MediaJobResponse>;
  isGeneratingMedia: Record<string, boolean>;
  mediaProviderHealth: MediaProviderHealth | null;
  activeAtmosphereAsset: MediaAsset | null;
  isAtmospherePlaying: boolean;
  atmosphereMasterVolume: number;
  isAtmosphereMuted: boolean;
  activeMediaBlockers: Set<string>;
  premiseVariables: PremiseVariable[];
  selectedPremiseVariable: PremiseVariable | null;
  mutationHypothesisPrompt: string;
  mutationNewValue: string;
  customBranchName: string;
  mutationSimulation: MutationSimulationResponse | null;
  isSimulatingMutation: boolean;
  isForkingMutation: boolean;
  mutationSelectedNode: EntityImpactItem | null;
  counterfactualCandidates: CounterfactualCandidate[];
  selectedCounterfactualCandidateId: string | null;
  counterfactualDelta: CounterfactualDeltaResponse | null;
  isLoadingCounterfactual: boolean;
  isForkingCounterfactual: boolean;
  counterfactualBranchName: string;

  // Actions
  fetchPremiseVariables: (projectId: string) => Promise<void>;
  setSelectedPremiseVariable: (variable: PremiseVariable | null) => void;
  setMutationHypothesisPrompt: (prompt: string) => void;
  setMutationNewValue: (val: string) => void;
  setCustomBranchName: (name: string) => void;
  simulateMutation: (projectId: string, request: SeedMutationRequest) => Promise<void>;
  forkMutatedUniverse: (projectId: string, request: ForkMutationRequest) => Promise<string>;
  setMutationSelectedNode: (item: EntityImpactItem | null) => void;
  resetMutationLab: () => void;
  fetchCounterfactualCandidates: (projectId: string) => Promise<void>;
  selectCounterfactualCandidate: (candidateId: string) => Promise<void>;
  fetchCounterfactualDelta: (candidateId: string, useAi?: boolean) => Promise<void>;
  setCounterfactualBranchName: (name: string) => void;
  forkCounterfactualBranch: (projectId: string, request: ForkCounterfactualRequest) => Promise<string>;
  resetCounterfactualState: () => void;
  setAtmosphereTrack: (asset: MediaAsset) => void;
  playAtmosphere: () => void;
  pauseAtmosphere: () => void;
  toggleAtmospherePlay: () => void;
  setAtmosphereMasterVolume: (vol: number) => void;
  toggleAtmosphereMute: () => void;
  closeAtmosphereDeck: () => void;
  registerMediaBlocker: (category: string) => void;
  unregisterMediaBlocker: (category: string) => void;
  getEffectiveAtmosphereVolume: () => number;
  setActiveStage: (stage: StageType) => void;
  unlockStage: (stage: StageType) => void;
  setSeedText: (seed: string) => void;
  setActiveProject: (project: Project | null) => void;
  setSeedDNA: (seedDNA: SeedDNARead | null) => void;
  setWorlds: (worlds: WorldCandidateRead[]) => void;
  setSelectedWorldId: (id: string | null) => void;
  humanOnlyZones: HumanOnlyZones | null;
  setHumanOnlyZones: (zones: Partial<HumanOnlyZones>) => void;
  toggleZoneLock: () => void;
  setSelectedWorldRationale: (rationale: string) => void;
  confirmWorldSelection: (candidateId: string, payload?: WorldSelectionCreate | string) => Promise<boolean>;
  fetchActiveSelection: () => Promise<void>;
  setActiveCodexTab: (tab: CodexTab) => void;
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
  updateAIProviderAction: (provider: string, model?: string) => Promise<boolean>;
  setSyncing: (syncing: boolean) => void;
  setUnderstandSubTab: (tab: 'dna' | 'potential') => void;
  fetchPotentialItems: () => Promise<void>;
  extractPotentialItemsAction: () => Promise<boolean>;
  updatePotentialStatusAction: (itemId: string, status: PotentialItemStatus) => Promise<boolean>;
  batchUpdatePotentialStatusesAction: (items: { id: string; user_status: PotentialItemStatus }[]) => Promise<boolean>;
  fetchMediaHealth: () => Promise<void>;
  fetchEntityMedia: (entityId: string, mediaType?: MediaType) => Promise<void>;
  generateMediaAction: (req: MediaGenerationRequest) => Promise<string | null>;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  closeTour: () => void;
  toggleShortcutsModal: () => void;
  setProviderFallbackWarning: (warning: string | null) => void;
  loadCanonicalDemoUniverse: () => Promise<boolean>;
  resetWorkspace: () => void;
  recoverActiveJobs: () => Promise<void>;
  creations: Project[];
  isLoadingCreations: boolean;
  creationsError: string | null;
  graveyard: Project[];
  isLoadingGraveyard: boolean;
  graveyardError: string | null;
  fetchCreations: () => Promise<void>;
  fetchGraveyard: () => Promise<void>;
  deleteProjectAction: (projectId: string) => Promise<boolean>;
  restoreProjectAction: (projectId: string) => Promise<boolean>;
  permanentlyDeleteProjectAction: (projectId: string) => Promise<boolean>;
  hydrateProject: (bundle: ProjectBundle) => void;
}


const DEFAULT_STAGES: StageType[] = ['seed'];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeNav: 'home',
      setActiveNav: (nav) => set({ activeNav: nav }),
      creations: [],
      isLoadingCreations: false,
      creationsError: null,
      graveyard: [],
      isLoadingGraveyard: false,
      graveyardError: null,
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
      humanOnlyZones: {
        core_theme: '',
        protagonist_motivation: '',
        central_conflict: '',
        is_locked: false,
      },
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
      tourOpen: false,
      tourStep: 0,
      shortcutsModalOpen: false,
      providerFallbackWarning: null,
      potentialItems: [],
      isExtractingPotential: false,
      understandSubTab: 'dna',
      mediaAssets: {},
      activeMediaJobs: {},
      isGeneratingMedia: {},
      mediaProviderHealth: null,
      activeAtmosphereAsset: null,
      isAtmospherePlaying: false,
      atmosphereMasterVolume: 0.75,
      isAtmosphereMuted: false,
      activeMediaBlockers: new Set<string>(),
      premiseVariables: [],
      selectedPremiseVariable: null,
      mutationHypothesisPrompt: '',
      mutationNewValue: '',
      customBranchName: '',
      mutationSimulation: null,
      isSimulatingMutation: false,
      isForkingMutation: false,
      mutationSelectedNode: null,
      counterfactualCandidates: [],
      selectedCounterfactualCandidateId: null,
      counterfactualDelta: null,
      isLoadingCounterfactual: false,
      isForkingCounterfactual: false,
      counterfactualBranchName: '',

      fetchPremiseVariables: async (projectId: string) => {
        try {
          const res = await apiClient.getPremiseVariables(projectId);
          if (res.success && res.data) {
            const vars = res.data;
            set({
              premiseVariables: vars,
              selectedPremiseVariable: vars.length > 0 ? vars[0] : null,
              mutationNewValue: vars.length > 0 ? vars[0].original_value : '',
            });
          }
        } catch (err) {
          console.error('Failed to fetch premise variables:', err);
        }
      },

      setSelectedPremiseVariable: (variable: PremiseVariable | null) =>
        set({
          selectedPremiseVariable: variable,
          mutationNewValue: variable ? variable.original_value : '',
          mutationSimulation: null,
          mutationSelectedNode: null,
        }),

      setMutationHypothesisPrompt: (prompt: string) =>
        set({ mutationHypothesisPrompt: prompt }),

      setMutationNewValue: (val: string) =>
        set({ mutationNewValue: val }),

      setCustomBranchName: (name: string) =>
        set({ customBranchName: name }),

      simulateMutation: async (projectId: string, request: SeedMutationRequest) => {
        set({ isSimulatingMutation: true });
        try {
          const res = await apiClient.simulateMutation(projectId, request);
          if (res.success && res.data) {
            set({
              mutationSimulation: res.data,
              isSimulatingMutation: false,
              mutationSelectedNode: null,
            });
          } else {
            set({ isSimulatingMutation: false });
            throw new Error(res.error?.message || 'Failed to simulate mutation');
          }
        } catch (err) {
          console.error('Failed to simulate mutation:', err);
          set({ isSimulatingMutation: false });
          throw err;
        }
      },

      forkMutatedUniverse: async (projectId: string, request: ForkMutationRequest) => {
        set({ isForkingMutation: true });
        try {
          const res = await apiClient.forkMutatedUniverse(projectId, request);
          if (res.success && res.data) {
            const childProject = res.data;
            await get().switchBranch(childProject.id);
            set({ isForkingMutation: false });
            return childProject.id;
          }
          set({ isForkingMutation: false });
          throw new Error(res.error?.message || 'Failed to fork mutated universe');
        } catch (err: unknown) {
          console.error('Failed to fork mutated universe:', err);
          set({ isForkingMutation: false });
          const errorMsg = err instanceof Error ? err.message : 'Fork failed';
          throw new Error(errorMsg);
        }
      },

      setMutationSelectedNode: (item: EntityImpactItem | null) =>
        set({ mutationSelectedNode: item }),

      resetMutationLab: () =>
        set({
          mutationSimulation: null,
          mutationHypothesisPrompt: '',
          mutationNewValue: '',
          customBranchName: '',
          mutationSelectedNode: null,
        }),

      fetchCounterfactualCandidates: async (projectId: string) => {
        try {
          const res = await apiClient.getCounterfactualCandidates(projectId);
          if (res.success && res.data) {
            set({ counterfactualCandidates: res.data });
            if (res.data.length > 0 && !get().selectedCounterfactualCandidateId) {
              await get().selectCounterfactualCandidate(res.data[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to fetch counterfactual candidates:', err);
        }
      },

      selectCounterfactualCandidate: async (candidateId: string) => {
        set({ selectedCounterfactualCandidateId: candidateId });
        await get().fetchCounterfactualDelta(candidateId);
      },

      fetchCounterfactualDelta: async (candidateId: string, useAi = true) => {
        const { activeProject } = get();
        if (!activeProject) return;
        set({ isLoadingCounterfactual: true });
        try {
          const res = await apiClient.getCounterfactualDelta(activeProject.id, candidateId, useAi);
          if (res.success && res.data) {
            set({
              counterfactualDelta: res.data,
              counterfactualBranchName: res.data.suggested_branch_name,
              isLoadingCounterfactual: false,
            });
          } else {
            set({ isLoadingCounterfactual: false });
          }
        } catch (err) {
          console.error('Failed to fetch counterfactual delta:', err);
          set({ isLoadingCounterfactual: false });
        }
      },

      setCounterfactualBranchName: (name: string) => set({ counterfactualBranchName: name }),

      forkCounterfactualBranch: async (projectId: string, request: ForkCounterfactualRequest) => {
        set({ isForkingCounterfactual: true });
        try {
          const res = await apiClient.forkCounterfactualBranch(projectId, request);
          if (res.success && res.data) {
            const newBranch = res.data.branch_name || 'counterfactual/fork';
            await get().fetchBranches();
            await get().switchBranch(res.data.id);
            set({ isForkingCounterfactual: false });
            return newBranch;
          }
          set({ isForkingCounterfactual: false });
          throw new Error(res.error?.message || 'Failed to fork counterfactual branch');
        } catch (err) {
          set({ isForkingCounterfactual: false });
          const msg = err instanceof Error ? err.message : 'Counterfactual fork failed';
          throw new Error(msg);
        }
      },

      resetCounterfactualState: () =>
        set({
          counterfactualCandidates: [],
          selectedCounterfactualCandidateId: null,
          counterfactualDelta: null,
          isLoadingCounterfactual: false,
          isForkingCounterfactual: false,
          counterfactualBranchName: '',
        }),

      setAtmosphereTrack: (asset) =>
        set({
          activeAtmosphereAsset: asset,
          isAtmospherePlaying: true,
        }),

      playAtmosphere: () => set({ isAtmospherePlaying: true }),
      pauseAtmosphere: () => set({ isAtmospherePlaying: false }),
      toggleAtmospherePlay: () =>
        set((state) => ({ isAtmospherePlaying: !state.isAtmospherePlaying })),

      setAtmosphereMasterVolume: (vol) =>
        set({ atmosphereMasterVolume: Math.max(0, Math.min(1, vol)) }),

      toggleAtmosphereMute: () =>
        set((state) => ({ isAtmosphereMuted: !state.isAtmosphereMuted })),

      closeAtmosphereDeck: () =>
        set({
          activeAtmosphereAsset: null,
          isAtmospherePlaying: false,
        }),

      registerMediaBlocker: (category: string) =>
        set((state) => {
          const next = new Set(state.activeMediaBlockers);
          next.add(category);
          return { activeMediaBlockers: next };
        }),

      unregisterMediaBlocker: (category: string) =>
        set((state) => {
          const next = new Set(state.activeMediaBlockers);
          next.delete(category);
          return { activeMediaBlockers: next };
        }),

      getEffectiveAtmosphereVolume: () => {
        const { isAtmosphereMuted, atmosphereMasterVolume, activeMediaBlockers } = get();
        if (isAtmosphereMuted) {
          return 0;
        }
        if (activeMediaBlockers.size > 0) {
          return atmosphereMasterVolume * 0.2;
        }
        return atmosphereMasterVolume;
      },

      setUnderstandSubTab: (tab) => set({ understandSubTab: tab }),

      fetchPotentialItems: async () => {
        const { activeProject } = get();
        if (!activeProject) return;
        try {
          const res = await apiClient.getPotential(activeProject.id);
          if (res.success && res.data) {
            set({ potentialItems: res.data });
          }
        } catch (err) {
          console.error('Failed to fetch potential items:', err);
        }
      },

      extractPotentialItemsAction: async () => {
        const { activeProject } = get();
        if (!activeProject) return false;
        set({ isExtractingPotential: true });
        try {
          const jobRes = await apiClient.extractPotential(activeProject.id);
          if (!jobRes.success || !jobRes.data) {
            set({ isExtractingPotential: false });
            return false;
          }
          const items = await apiClient.pollJob<SeedPotentialItem[]>(jobRes.data.id);
          set({ potentialItems: items, isExtractingPotential: false });
          return true;
        } catch (err) {
          console.error('Failed to extract potential items:', err);
          set({ isExtractingPotential: false });
          return false;
        }
      },

      updatePotentialStatusAction: async (itemId: string, status: PotentialItemStatus) => {
        const { activeProject, potentialItems } = get();
        if (!activeProject) return false;

        // Optimistic UI update
        const prevItems = [...potentialItems];
        set({
          potentialItems: potentialItems.map((item) =>
            item.id === itemId ? { ...item, user_status: status } : item
          ),
        });

        try {
          const res = await apiClient.updatePotentialItem(activeProject.id, itemId, status);
          if (res.success && res.data) {
            set({
              potentialItems: get().potentialItems.map((item) =>
                item.id === itemId ? res.data! : item
              ),
            });
            return true;
          }
          set({ potentialItems: prevItems });
          return false;
        } catch (err) {
          console.error('Failed to update potential item status:', err);
          set({ potentialItems: prevItems });
          return false;
        }
      },

      batchUpdatePotentialStatusesAction: async (items: { id: string; user_status: PotentialItemStatus }[]) => {
        const { activeProject, potentialItems } = get();
        if (!activeProject) return false;

        const updateMap = new Map(items.map((i) => [i.id, i.user_status]));
        const prevItems = [...potentialItems];
        set({
          potentialItems: potentialItems.map((item) => {
            const nextStatus = updateMap.get(item.id);
            return nextStatus ? { ...item, user_status: nextStatus } : item;
          }),
        });

        try {
          const res = await apiClient.batchUpdatePotentialItems(activeProject.id, items);
          if (res.success && res.data) {
            set({ potentialItems: res.data });
            return true;
          }
          set({ potentialItems: prevItems });
          return false;
        } catch (err) {
          console.error('Failed to batch update potential statuses:', err);
          set({ potentialItems: prevItems });
          return false;
        }
      },

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
      setHumanOnlyZones: (zones) =>
        set((state) => ({
          humanOnlyZones: {
            ...(state.humanOnlyZones || {
              core_theme: '',
              protagonist_motivation: '',
              central_conflict: '',
              is_locked: false,
            }),
            ...zones,
          },
        })),
      toggleZoneLock: () =>
        set((state) => ({
          humanOnlyZones: {
            ...(state.humanOnlyZones || {
              core_theme: '',
              protagonist_motivation: '',
              central_conflict: '',
              is_locked: false,
            }),
            is_locked: !state.humanOnlyZones?.is_locked,
          },
        })),

      confirmWorldSelection: async (
        candidateId: string,
        payload?: WorldSelectionCreate | string
      ) => {
        const state = get();
        const project = state.activeProject;
        if (!project) return false;

        let finalPayload: WorldSelectionCreate;
        if (typeof payload === 'string') {
          finalPayload = { user_rationale: payload };
        } else if (payload) {
          finalPayload = { ...payload };
        } else {
          finalPayload = {};
        }

        const hoz = state.humanOnlyZones;
        if (hoz && hoz.is_locked && !finalPayload.human_only_zones) {
          finalPayload.human_only_zones = hoz;
        }

        // Sanity check: Ensure the selected candidate belongs to the active project
        const candidateInStore = state.worlds.find((w) => w.id === candidateId);
        if (candidateInStore && candidateInStore.project_id && candidateInStore.project_id !== project.id) {
          console.warn('Candidate belongs to a different project than activeProject! Aborting stale selection.');
          return false;
        }

        set({ isSelectingWorld: true });
        try {
          const res = await apiClient.selectWorld(project.id, candidateId, finalPayload);
          if (!res.success || !res.data) {
            throw new Error(res.error?.message || 'Failed to select world candidate');
          }

          const selectionData = res.data;
          set((s) => ({
            selectedWorldId: selectionData.world_candidate_id,
            selectedWorldRationale: selectionData.user_rationale || '',
            activeSelection: selectionData,
            humanOnlyZones: selectionData.human_only_zones || s.humanOnlyZones,
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
              humanOnlyZones: res.data.human_only_zones || get().humanOnlyZones,
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

        try {
          const jobRes = await apiClient.unfoldUniverse(project.id);
          if (!jobRes.success || !jobRes.data) {
            throw new Error(jobRes.error?.message || 'Failed to start unfolding job');
          }

          // In case the project was already unfolded, the job might be completed and return UnfoldedUniverseRead directly inside result_json.
          const unfoldedData = await apiClient.pollJob<UnfoldedUniverseRead>(jobRes.data.id, 1500, (job) => {
            if (job.status === 'queued') set({ unfoldingStep: 1 });
            else if (job.status === 'processing') set({ unfoldingStep: 2 });
            else if (job.status === 'completed') set({ unfoldingStep: 4 });
          });

          let finalData = unfoldedData;
          if (!finalData || !finalData.world_bible) {
            const freshRes = await apiClient.getUnfoldedUniverse(project.id);
            if (freshRes.success && freshRes.data) {
              finalData = freshRes.data;
            }
          }

          set((s) => ({
            unfoldedUniverse: finalData,
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
            mutationSimulation: null,
            mutationHypothesisPrompt: '',
            mutationNewValue: '',
            customBranchName: '',
            mutationSelectedNode: null,
          });

          await get().fetchBranches();
          await get().fetchPremiseVariables(targetProjectId);
          await get().fetchCounterfactualCandidates(targetProjectId);

          const dnaRes = await apiClient.getLatestDNA(targetProjectId);
          if (dnaRes.success && dnaRes.data) {
            set({ seedDNA: dnaRes.data });
          }

          const potRes = await apiClient.getPotential(targetProjectId);
          if (potRes.success && potRes.data) {
            set({ potentialItems: potRes.data });
          }

          const worldsRes = await apiClient.getLatestWorlds(targetProjectId);
          if (worldsRes.success && worldsRes.data && worldsRes.data.length > 0) {
            set({ worlds: worldsRes.data });
          } else {
            set({ worlds: [] });
          }

          const selRes = await apiClient.getActiveSelection(targetProjectId);
          if (selRes.success && selRes.data) {
            set({
              activeSelection: selRes.data,
              selectedWorldId: selRes.data.world_candidate_id,
              humanOnlyZones: selRes.data.human_only_zones || null,
            });
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
          // If no project exists or existing project is not a fresh draft or has a different seed text, create a new project
          if (!project || (project.status !== 'draft' && project.seed_text !== seedToUse)) {
            const derivedTitle = deriveProjectTitle(seedToUse);
            const createRes = await apiClient.createProject(derivedTitle, seedToUse);
            if (!createRes.success || !createRes.data) {
              throw new Error(createRes.error?.message || 'Failed to initialize project');
            }
            project = createRes.data;
            set({
              activeProject: project,
              worlds: [],
              selectedWorldId: null,
              selectedWorldRationale: '',
              activeSelection: null,
              unfoldedUniverse: null,
              lineageGraph: null,
              entityRevisions: [],
              mutationSimulation: null,
              potentialItems: [],
            });
          }

          const jobRes = await apiClient.extractDNA(project.id, seedToUse);
          if (!jobRes.success || !jobRes.data) {
            throw new Error(jobRes.error?.message || 'Extraction failed');
          }

          const dnaData = await apiClient.pollJob<SeedDNARead>(jobRes.data.id, 1500, (job) => {
             if (job.status === 'queued') set({ extractionStep: 'Queued...' });
             else if (job.status === 'processing') set({ extractionStep: 'Processing Seed DNA...' });
             else if (job.status === 'completed') set({ extractionStep: 'Completed' });
          });

          set((s) => ({
            seedDNA: dnaData,
            seedText: seedToUse,
            worlds: s.worlds.filter((w) => w.project_id === project!.id),
            unlockedStages: s.unlockedStages.includes('understand')
              ? s.unlockedStages
              : [...s.unlockedStages, 'understand'],
            activeStage: 'understand',
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
        if (state.isGeneratingWorlds) return false;
        const project = state.activeProject;
        if (!project) return false;

        set({
          isGeneratingWorlds: true,
          worldBranchingStep: 'Analyzing Seed DNA constraints & core themes...',
        });

        try {
          const jobRes = await apiClient.generateWorlds(project.id);
          if (!jobRes.success || !jobRes.data) {
            throw new Error(jobRes.error?.message || 'Failed to start world generation job');
          }

          const worldsData = await apiClient.pollJob<WorldCandidateRead[]>(jobRes.data.id, 1500, (job) => {
            if (job.status === 'queued') set({ worldBranchingStep: 'Queued...' });
            else if (job.status === 'processing') set({ worldBranchingStep: 'Generating Worlds...' });
            else if (job.status === 'completed') set({ worldBranchingStep: 'Completed' });
          });

          set((s) => ({
            worlds: worldsData || [],
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
      setInspectorTab: (tab) => set({ inspectorTab: tab }),
      setHealth: (health) => set({ health }),
      updateAIProviderAction: async (provider: string, model?: string) => {
        try {
          const res = await apiClient.updateAIProvider(provider, model);
          if (res.success && res.data) {
            set({ health: res.data });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      setSyncing: (isSyncing) => set({ isSyncing }),
      startTour: () => {
        const currentUnlocked = get().unlockedStages;
        set({
          tourOpen: true,
          tourStep: 0,
          unlockedStages: currentUnlocked.includes('seed') ? currentUnlocked : ['seed', ...currentUnlocked],
          activeStage: 'seed',
        });
      },

      nextTourStep: () => {
        const next = Math.min(get().tourStep + 1, 6);
        const stages: StageType[] = ['seed', 'understand', 'worlds', 'choose', 'unfold', 'trace', 'refine'];
        const targetStage = stages[next];
        const currentUnlocked = get().unlockedStages;
        set({
          tourStep: next,
          unlockedStages: currentUnlocked.includes(targetStage) ? currentUnlocked : [...currentUnlocked, targetStage],
          activeStage: targetStage,
        });
      },

      prevTourStep: () => {
        const prev = Math.max(get().tourStep - 1, 0);
        const stages: StageType[] = ['seed', 'understand', 'worlds', 'choose', 'unfold', 'trace', 'refine'];
        set({ tourStep: prev, activeStage: stages[prev] });
      },

      closeTour: () => set({ tourOpen: false }),

      toggleShortcutsModal: () => set((s) => ({ shortcutsModalOpen: !s.shortcutsModalOpen })),

      setProviderFallbackWarning: (warning) => set({ providerFallbackWarning: warning }),

      fetchMediaHealth: async () => {
        try {
          const res = await apiClient.getMediaProvidersHealth();
          if (res.success && res.data) {
            set({ mediaProviderHealth: res.data });
          }
        } catch (err) {
          console.error('Failed to fetch media provider health:', err);
        }
      },

      fetchEntityMedia: async (entityId: string, mediaType?: MediaType) => {
        const { activeProject } = get();
        if (!activeProject) return;
        try {
          const res = await apiClient.getMediaAssets(activeProject.id, entityId, mediaType);
          if (res.success && res.data) {
            set((state) => {
              const currentList = state.mediaAssets[entityId] || [];
              const merged = [...currentList];
              for (const asset of res.data!) {
                const idx = merged.findIndex(a => a.id === asset.id);
                if (idx >= 0) {
                  merged[idx] = asset;
                } else {
                  merged.push(asset);
                }
              }
              return {
                mediaAssets: {
                  ...state.mediaAssets,
                  [entityId]: merged,
                },
              };
            });
          }
        } catch (err) {
          console.error('Failed to fetch entity media:', err);
        }
      },

      generateMediaAction: async (req: MediaGenerationRequest) => {
        const { activeProject } = get();
        if (!activeProject) return null;
        const key = `${req.entity_id}_${req.media_type}`;
        set((state) => ({
          isGeneratingMedia: { ...state.isGeneratingMedia, [key]: true },
        }));

        try {
          const res = await apiClient.generateMedia(activeProject.id, req);
          if (res.success && res.data) {
            const job = res.data;
            set((state) => ({
              activeMediaJobs: { ...state.activeMediaJobs, [job.job_id]: job },
            }));
            return job.job_id;
          }
        } catch (err) {
          console.error('Failed to generate media asset:', err);
        }
        set((state) => ({
          isGeneratingMedia: { ...state.isGeneratingMedia, [key]: false },
        }));
        return null;
      },

      loadCanonicalDemoUniverse: async () => {
        try {
          set({ isSyncing: true });
          const res = await apiClient.createCanonicalDemoProject();
          if (res.success && res.data) {
            const success = await get().switchBranch(res.data.id);
            if (success) {
              set({
                activeStage: 'unfold',
                seedText: res.data.seed_text || 'A child discovers a forgotten city beneath the ocean.',
                unlockedStages: ['seed', 'understand', 'worlds', 'choose', 'unfold', 'trace', 'refine'],
                isSyncing: false,
              });
              return true;
            }
          }
          set({ isSyncing: false });
          return false;
        } catch (err) {
          console.error('Failed to load canonical demo universe:', err);
          set({ isSyncing: false });
          return false;
        }
      },

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
          tourOpen: false,
          tourStep: 0,
          shortcutsModalOpen: false,
          providerFallbackWarning: null,
          potentialItems: [],
          isExtractingPotential: false,
          understandSubTab: 'dna',
          mediaAssets: {},
          activeMediaJobs: {},
          isGeneratingMedia: {},
          activeAtmosphereAsset: null,
          isAtmospherePlaying: false,
          atmosphereMasterVolume: 0.75,
          isAtmosphereMuted: false,
          activeMediaBlockers: new Set<string>(),
          premiseVariables: [],
          selectedPremiseVariable: null,
          mutationHypothesisPrompt: '',
          mutationNewValue: '',
          customBranchName: '',
          mutationSimulation: null,
          isSimulatingMutation: false,
          isForkingMutation: false,
          mutationSelectedNode: null,
          counterfactualCandidates: [],
          selectedCounterfactualCandidateId: null,
          counterfactualDelta: null,
          isLoadingCounterfactual: false,
          isForkingCounterfactual: false,
          counterfactualBranchName: '',
          creations: [],
          isLoadingCreations: false,
          creationsError: null,
          graveyard: [],
          isLoadingGraveyard: false,
          graveyardError: null,
        }),

      recoverActiveJobs: async () => {
        const { activeProject } = get();
        if (!activeProject) return;
        try {
          // Poll for any job in processing state to recover
          const processingRes = await apiClient.listJobs(activeProject.id, 'processing');
          const queuedRes = await apiClient.listJobs(activeProject.id, 'queued');
          const activeJobs = [...(processingRes.data || []), ...(queuedRes.data || [])];
          
          for (const job of activeJobs) {
            if (job.job_type === 'dna_extraction' && !get().isExtracting) {
              set({ isExtracting: true, extractionStep: job.status === 'queued' ? 'Queued...' : 'Processing Seed DNA...' });
              apiClient.pollJob<SeedDNARead>(job.id, 1500, (j) => {
                 if (j.status === 'queued') set({ extractionStep: 'Queued...' });
                 else if (j.status === 'processing') set({ extractionStep: 'Processing Seed DNA...' });
                 else if (j.status === 'completed') set({ extractionStep: 'Completed' });
              }).then(dnaData => {
                 set((s) => ({
                   seedDNA: dnaData,
                   unlockedStages: s.unlockedStages.includes('understand') ? s.unlockedStages : [...s.unlockedStages, 'understand'],
                   activeStage: 'understand',
                   isExtracting: false,
                   extractionStep: '',
                 }));
              }).catch(() => set({ isExtracting: false, extractionStep: '' }));
            }
            if (job.job_type === 'world_generation' && !get().isGeneratingWorlds) {
              set({ isGeneratingWorlds: true, worldBranchingStep: job.status === 'queued' ? 'Queued...' : 'Generating Worlds...' });
              apiClient.pollJob<WorldCandidateRead[]>(job.id, 1500, (j) => {
                 if (j.status === 'queued') set({ worldBranchingStep: 'Queued...' });
                 else if (j.status === 'processing') set({ worldBranchingStep: 'Generating Worlds...' });
                 else if (j.status === 'completed') set({ worldBranchingStep: 'Completed' });
              }).then(worldsData => {
                 set((s) => ({
                   worlds: worldsData || [],
                   unlockedStages: s.unlockedStages.includes('worlds') ? s.unlockedStages : [...s.unlockedStages, 'worlds'],
                   activeStage: 'worlds',
                   isGeneratingWorlds: false,
                   worldBranchingStep: '',
                 }));
              }).catch(() => set({ isGeneratingWorlds: false, worldBranchingStep: '' }));
            }
            if (job.job_type === 'universe_unfold' && !get().isUnfolding) {
              set({ isUnfolding: true, unfoldingStep: job.status === 'queued' ? 1 : 2, unfoldError: null });
              apiClient.pollJob<UnfoldedUniverseRead>(job.id, 1500, (j) => {
                 if (j.status === 'queued') set({ unfoldingStep: 1 });
                 else if (j.status === 'processing') set({ unfoldingStep: 2 });
                 else if (j.status === 'completed') set({ unfoldingStep: 4 });
              }).then(unfoldedData => {
                 set((s) => ({
                   unfoldedUniverse: unfoldedData,
                   isUnfolding: false,
                   unfoldingStep: 4,
                   unfoldError: null,
                   activeProject: s.activeProject ? { ...s.activeProject, status: 'universe_unfolded' } : null,
                   unlockedStages: Array.from(new Set([...s.unlockedStages, 'unfold', 'trace', 'refine'])),
                 }));
              }).catch((err) => set((s) => ({ 
                 isUnfolding: false, 
                 unfoldingStep: 0, 
                 unfoldError: err instanceof Error ? err.message : 'Unfold failed',
                 activeProject: s.activeProject ? { ...s.activeProject, status: 'world_selected' } : null,
              })));
            }
          }
        } catch (err) {
          console.error('Failed to recover active jobs:', err);
        }
      },

      hydrateProject: (bundle) => {
        const {
          project,
          seed_dna,
          seed_potential_items,
          world_candidates,
          world_selection,
          unfolded_universe,
          media_assets,
          revisions,
          lineage
        } = bundle;
        
        let newStage: StageType = 'seed';
        const unlocked: StageType[] = ['seed'];
        
        if (seed_dna) {
          newStage = 'understand';
          unlocked.push('understand');
        }
        if (world_candidates && world_candidates.length > 0) {
          newStage = 'worlds';
          unlocked.push('worlds');
        }
        if (world_selection) {
          newStage = 'unfold';
          unlocked.push('choose', 'unfold');
        }
        if (unfolded_universe) {
          newStage = 'unfold';
          unlocked.push('trace', 'refine');
        }
        
        const mediaAssetsMap: Record<string, MediaAsset[]> = {};
        if (media_assets) {
          for (const asset of media_assets) {
            if (!mediaAssetsMap[asset.entity_id]) {
              mediaAssetsMap[asset.entity_id] = [];
            }
            if (!mediaAssetsMap[asset.entity_id].some((a) => a.id === asset.id)) {
              mediaAssetsMap[asset.entity_id].push(asset);
            }
          }
        }

        set({
          activeProject: project,
          seedText: project.seed_text || '',
          seedDNA: seed_dna,
          potentialItems: seed_potential_items || [],
          worlds: world_candidates || [],
          activeSelection: world_selection,
          selectedWorldId: world_selection ? world_selection.world_candidate_id : null,
          unfoldedUniverse: unfolded_universe,
          entityRevisions: revisions || [],
          lineageGraph: lineage || null,
          mediaAssets: mediaAssetsMap,
          activeStage: newStage,
          unlockedStages: Array.from(new Set(unlocked))
        });
        
        get().recoverActiveJobs();
      },

      fetchCreations: async () => {
        set({ isLoadingCreations: true, creationsError: null });
        try {
          const res = await apiClient.listProjects(false, false);
          if (res.success && res.data) {
            set({ creations: res.data, isLoadingCreations: false });
          } else {
            set({
              isLoadingCreations: false,
              creationsError: res.error?.message || 'Could not load your creations.',
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Could not load your creations.';
          set({ isLoadingCreations: false, creationsError: msg });
        }
      },

      fetchGraveyard: async () => {
        set({ isLoadingGraveyard: true, graveyardError: null });
        try {
          const res = await apiClient.listGraveyardProjects();
          if (res.success && res.data) {
            set({ graveyard: res.data, isLoadingGraveyard: false });
          } else {
            set({
              isLoadingGraveyard: false,
              graveyardError: res.error?.message || 'Could not load your graveyard.',
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Could not load your graveyard.';
          set({ isLoadingGraveyard: false, graveyardError: msg });
        }
      },

      deleteProjectAction: async (projectId: string) => {
        try {
          const res = await apiClient.deleteProject(projectId);
          if (res.success && res.data) {
            const deletedProj = res.data;
            set((s) => ({
              creations: s.creations.filter((p) => p.id !== projectId),
              graveyard: [deletedProj, ...s.graveyard.filter((p) => p.id !== projectId)],
              activeProject: s.activeProject?.id === projectId ? null : s.activeProject,
            }));
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to move project to graveyard:', err);
          return false;
        }
      },

      restoreProjectAction: async (projectId: string) => {
        try {
          const res = await apiClient.restoreProject(projectId);
          if (res.success && res.data) {
            const restoredProj = res.data;
            set((s) => ({
              graveyard: s.graveyard.filter((p) => p.id !== projectId),
              creations: [restoredProj, ...s.creations.filter((p) => p.id !== projectId)],
            }));
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to restore project:', err);
          return false;
        }
      },

      permanentlyDeleteProjectAction: async (projectId: string) => {
        try {
          const res = await apiClient.deleteProjectPermanently(projectId);
          if (res.success) {
            set((s) => ({
              graveyard: s.graveyard.filter((p) => p.id !== projectId),
              creations: s.creations.filter((p) => p.id !== projectId),
              activeProject: s.activeProject?.id === projectId ? null : s.activeProject,
            }));
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to permanently delete project:', err);
          return false;
        }
      },
    }),
    {
      name: 'seed-unfold-workspace',
      partialize: (state) => ({
        activeStage: state.activeStage,
        unlockedStages: state.unlockedStages,
        seedText: state.seedText,
        activeProject: state.activeProject,
        seedDNA: state.seedDNA,
        potentialItems: state.potentialItems,
        worlds: state.worlds,
        selectedWorldId: state.selectedWorldId,
        selectedWorldRationale: state.selectedWorldRationale,
        activeSelection: state.activeSelection,
        unfoldedUniverse: state.unfoldedUniverse,
        activeCodexTab: state.activeCodexTab,
        inspectorTab: state.inspectorTab,
        mediaAssets: state.mediaAssets,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__workspaceStore = useWorkspaceStore;
}

if (typeof window !== 'undefined') { (window as any).useWorkspaceStore = useWorkspaceStore; }
