import {
  APIResponse,
  Project,
  SeedDNARead,
  SystemHealthData,
  WorldCandidateRead,
  WorldSelectionRead,
  WorldSelectionCreate,
  UnfoldedUniverseRead,
  TraceGraphRead,
  AncestorPathRead,
  BranchRead,
  CharacterRefineRequest,
  SceneRefineRequest,
  CharacterRead,
  SceneRead,
  EntityRevisionRead,
  ProjectBundle,
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
  MutationSimulationResponse,
  ForkMutationRequest,
  CounterfactualCandidate,
  CounterfactualDeltaResponse,
  ForkCounterfactualRequest,
} from '../types';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: {
            code: data?.error?.code || `HTTP_${response.status}`,
            message:
              data?.error?.message ||
              data?.detail ||
              `Request failed with status ${response.status}`,
          },
        };
      }

      return data as APIResponse<T>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: `Unable to reach backend API at ${endpoint}: ${message}`,
        },
      };
    }
  }

  async getHealth(): Promise<APIResponse<SystemHealthData>> {
    return this.request<SystemHealthData>('/health');
  }

  async listProjects(): Promise<APIResponse<Project[]>> {
    return this.request<Project[]>('/projects');
  }

  async createProject(title: string, seedText?: string): Promise<APIResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        title,
        seed_text: seedText || '',
      }),
    });
  }

  async createCanonicalDemoProject(): Promise<APIResponse<Project>> {
    return this.request<Project>('/projects/canonical-demo', {
      method: 'POST',
    });
  }

  async getProject(projectId: string): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${projectId}`);
  }

  async extractDNA(projectId: string, rawSeed?: string): Promise<APIResponse<SeedDNARead>> {
    return this.request<SeedDNARead>(`/projects/${projectId}/dna/extract`, {
      method: 'POST',
      body: JSON.stringify({
        raw_seed: rawSeed,
      }),
    });
  }

  async getLatestDNA(projectId: string): Promise<APIResponse<SeedDNARead>> {
    return this.request<SeedDNARead>(`/projects/${projectId}/dna`);
  }

  async generateWorlds(projectId: string): Promise<APIResponse<WorldCandidateRead[]>> {
    return this.request<WorldCandidateRead[]>(`/projects/${projectId}/worlds/generate`, {
      method: 'POST',
    });
  }

  async getLatestWorlds(projectId: string): Promise<APIResponse<WorldCandidateRead[]>> {
    return this.request<WorldCandidateRead[]>(`/projects/${projectId}/worlds`);
  }

  async selectWorld(
    projectId: string,
    candidateId: string,
    payload?: WorldSelectionCreate | string
  ): Promise<APIResponse<WorldSelectionRead>> {
    const bodyObj =
      typeof payload === 'string'
        ? { user_rationale: payload }
        : payload || {};
    return this.request<WorldSelectionRead>(
      `/projects/${projectId}/worlds/${candidateId}/select`,
      {
        method: 'POST',
        body: JSON.stringify(bodyObj),
      }
    );
  }

  async getActiveSelection(projectId: string): Promise<APIResponse<WorldSelectionRead>> {
    return this.request<WorldSelectionRead>(`/projects/${projectId}/selection`);
  }

  async unfoldUniverse(projectId: string): Promise<APIResponse<UnfoldedUniverseRead>> {
    return this.request<UnfoldedUniverseRead>(`/projects/${projectId}/unfold`, {
      method: 'POST',
    });
  }

  async getUnfoldedUniverse(projectId: string): Promise<APIResponse<UnfoldedUniverseRead>> {
    return this.request<UnfoldedUniverseRead>(`/projects/${projectId}/unfolded`);
  }

  async getProjectLineage(projectId: string): Promise<APIResponse<TraceGraphRead>> {
    return this.request<TraceGraphRead>(`/projects/${projectId}/lineage`);
  }

  async getNodeAncestors(projectId: string, nodeId: string): Promise<APIResponse<AncestorPathRead>> {
    return this.request<AncestorPathRead>(`/projects/${projectId}/lineage/node/${nodeId}/ancestors`);
  }

  async branchProject(
    projectId: string,
    branchName: string,
    stage: number = 5,
    rationale?: string
  ): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${projectId}/branch`, {
      method: 'POST',
      body: JSON.stringify({
        branch_name: branchName,
        branch_point_stage: stage,
        rationale: rationale || null,
      }),
    });
  }

  async listBranches(projectId: string): Promise<APIResponse<BranchRead[]>> {
    return this.request<BranchRead[]>(`/projects/${projectId}/branches`);
  }

  async refineCharacter(
    projectId: string,
    charId: string,
    req: CharacterRefineRequest
  ): Promise<APIResponse<CharacterRead>> {
    return this.request<CharacterRead>(`/projects/${projectId}/characters/${charId}/refine`, {
      method: 'PATCH',
      body: JSON.stringify(req),
    });
  }

  async refineScene(
    projectId: string,
    sceneId: string,
    req: SceneRefineRequest
  ): Promise<APIResponse<SceneRead>> {
    return this.request<SceneRead>(`/projects/${projectId}/scenes/${sceneId}/refine`, {
      method: 'PATCH',
      body: JSON.stringify(req),
    });
  }

  async listRevisions(
    projectId: string,
    entityId?: string
  ): Promise<APIResponse<EntityRevisionRead[]>> {
    const url = entityId
      ? `/projects/${projectId}/revisions?entity_id=${encodeURIComponent(entityId)}`
      : `/projects/${projectId}/revisions`;
    return this.request<EntityRevisionRead[]>(url);
  }

  async getProjectBundle(projectId: string): Promise<APIResponse<ProjectBundle>> {
    return this.request<ProjectBundle>(`/projects/${projectId}/bundle`);
  }

  async importProjectBundle(bundle: ProjectBundle): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/import`, {
      method: 'POST',
      body: JSON.stringify(bundle),
    });
  }

  async createSnapshot(projectId: string): Promise<APIResponse<SnapshotRead>> {
    return this.request<SnapshotRead>(`/projects/${projectId}/snapshots`, {
      method: 'POST',
    });
  }

  async listSnapshots(projectId: string): Promise<APIResponse<SnapshotRead[]>> {
    return this.request<SnapshotRead[]>(`/projects/${projectId}/snapshots`);
  }

  async extractPotential(projectId: string): Promise<APIResponse<SeedPotentialItem[]>> {
    return this.request<SeedPotentialItem[]>(`/projects/${projectId}/potential/extract`, {
      method: 'POST',
    });
  }

  async getPotential(projectId: string): Promise<APIResponse<SeedPotentialItem[]>> {
    return this.request<SeedPotentialItem[]>(`/projects/${projectId}/potential`);
  }

  async updatePotentialItem(
    projectId: string,
    itemId: string,
    status: PotentialItemStatus
  ): Promise<APIResponse<SeedPotentialItem>> {
    return this.request<SeedPotentialItem>(`/projects/${projectId}/potential/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ user_status: status }),
    });
  }

  async batchUpdatePotentialItems(
    projectId: string,
    items: { id: string; user_status: PotentialItemStatus }[]
  ): Promise<APIResponse<SeedPotentialItem[]>> {
    return this.request<SeedPotentialItem[]>(`/projects/${projectId}/potential/batch`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async generateMedia(
    projectId: string,
    payload: MediaGenerationRequest
  ): Promise<APIResponse<MediaJobResponse>> {
    return this.request<MediaJobResponse>(`/projects/${projectId}/media/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMediaJob(
    projectId: string,
    jobId: string
  ): Promise<APIResponse<MediaJobResponse>> {
    return this.request<MediaJobResponse>(`/projects/${projectId}/media/jobs/${jobId}`);
  }

  async getMediaAssets(
    projectId: string,
    entityId?: string,
    mediaType?: MediaType
  ): Promise<APIResponse<MediaAsset[]>> {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId);
    if (mediaType) params.append('media_type', mediaType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<MediaAsset[]>(`/projects/${projectId}/media/assets${query}`);
  }

  async getMediaProvidersHealth(): Promise<APIResponse<MediaProviderHealth>> {
    return this.request<MediaProviderHealth>('/media/providers/health');
  }

  async getPremiseVariables(projectId: string): Promise<APIResponse<PremiseVariable[]>> {
    return this.request<PremiseVariable[]>(`/projects/${projectId}/mutation/variables`);
  }

  async simulateMutation(
    projectId: string,
    payload: SeedMutationRequest
  ): Promise<APIResponse<MutationSimulationResponse>> {
    return this.request<MutationSimulationResponse>(`/projects/${projectId}/mutation/simulate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async forkMutatedUniverse(
    projectId: string,
    payload: ForkMutationRequest
  ): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${projectId}/mutation/fork`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCounterfactualCandidates(
    projectId: string
  ): Promise<APIResponse<CounterfactualCandidate[]>> {
    return this.request<CounterfactualCandidate[]>(
      `/projects/${projectId}/counterfactual/candidates`
    );
  }

  async getCounterfactualDelta(
    projectId: string,
    candidateId: string,
    useAi = true
  ): Promise<APIResponse<CounterfactualDeltaResponse>> {
    return this.request<CounterfactualDeltaResponse>(
      `/projects/${projectId}/counterfactual/delta/${candidateId}?use_ai=${useAi}`
    );
  }

  async forkCounterfactualBranch(
    projectId: string,
    payload: ForkCounterfactualRequest
  ): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${projectId}/counterfactual/fork`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}


export const apiClient = new ApiClient();


