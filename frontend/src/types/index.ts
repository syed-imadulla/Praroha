export interface APIErrorDetail {
  code: string;
  message: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: APIErrorDetail | null;
  fallback_used?: boolean;
  warning?: string | null;
}

export interface SystemHealthData {
  status: string;
  service: string;
  environment: string;
  ai_provider: {
    configured: string;
    resolved: string;
    status: string;
  };
  storage_provider: {
    configured: string;
    type: string;
    status: string;
  };
}

export interface Project {
  id: string;
  title: string;
  seed_text: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMetadata {
  id: string;
  project_id: string;
  asset_type: string;
  mime_type: string;
  storage_key: string;
  size_bytes: number;
  source_ref?: string | null;
  version: number;
  created_at: string;
}

export type StageType =
  | 'seed'
  | 'understand'
  | 'worlds'
  | 'choose'
  | 'unfold'
  | 'trace'
  | 'refine';

export interface StageDefinition {
  id: StageType;
  number: number;
  label: string;
  description: string;
}
