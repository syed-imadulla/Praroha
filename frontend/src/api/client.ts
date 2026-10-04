import {
  APIResponse,
  Project,
  SeedDNARead,
  SystemHealthData,
  WorldCandidateRead,
  WorldSelectionRead,
  UnfoldedUniverseRead,
  TraceGraphRead,
  AncestorPathRead,
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

      const data: APIResponse<T> = await response.json();
      return data;
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
    rationale?: string
  ): Promise<APIResponse<WorldSelectionRead>> {
    return this.request<WorldSelectionRead>(
      `/projects/${projectId}/worlds/${candidateId}/select`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_rationale: rationale || null,
        }),
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
}

export const apiClient = new ApiClient();


