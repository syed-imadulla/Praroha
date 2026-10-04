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
  selected_world_id?: string | null;
  parent_project_id?: string | null;
  branch_name?: string;
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

export interface SeedDNA {
  premise: string;
  themes: string[];
  entities: string[];
  constraints: string[];
  tone: string;
  domain_keywords: string[];
}

export interface SeedDNARead {
  id: string;
  project_id: string;
  raw_seed: string;
  dna: SeedDNA;
  fallback_used: boolean;
  model_used: string;
  created_at: string;
}

export interface SeedPreset {
  id: string;
  title: string;
  genre: string;
  seed: string;
  tagline: string;
}

export interface WorldCandidate {
  id: string;
  index: number;
  title: string;
  archetype: string;
  concept: string;
  aesthetic: string;
  core_tension: string;
  trade_offs: string;
  key_visual: string;
}

export interface WorldCandidateRead {
  id: string;
  project_id: string;
  seed_dna_id: string;
  batch_id: string;
  candidate_index: number;
  title: string;
  archetype: string;
  concept: string;
  aesthetic: string;
  core_tension: string;
  trade_offs: string;
  key_visual: string;
  model_used: string;
  fallback_used: boolean;
  created_at: string;
}

export interface WorldSelectionRead {
  id: string;
  project_id: string;
  world_candidate_id: string;
  batch_id: string;
  user_rationale: string | null;
  selected_world: WorldCandidateRead;
  created_at: string;
}

export interface LocationItem {
  name: string;
  description: string;
  visual_prompt: string;
}

export interface FactionItem {
  name: string;
  role: string;
  agenda: string;
}

export interface TimelineEvent {
  era: string;
  event: string;
}

export interface WorldBibleRead {
  id: string;
  project_id: string;
  world_candidate_id: string;
  geography: string;
  physics_rules: string;
  history_timeline: TimelineEvent[];
  factions: FactionItem[];
  canon_facts: string[];
  key_locations: LocationItem[];
  visual_style_prompt: string;
  created_at: string;
}

export interface CharacterRead {
  id: string;
  project_id: string;
  world_candidate_id: string;
  name: string;
  role: string;
  archetype: string;
  motivation: string;
  core_conflict: string;
  visual_prompt: string;
  version: number;
  revision_notes?: string | null;
  created_at: string;
}

export interface CharacterRelationshipRead {
  id: string;
  project_id: string;
  world_candidate_id: string;
  source_character_id: string;
  target_character_id: string;
  source_character_name?: string | null;
  target_character_name?: string | null;
  relation_type: string;
  dynamic_description: string;
  created_at: string;
}

export interface SceneRead {
  id: string;
  project_id: string;
  world_candidate_id: string;
  scene_number: number;
  title: string;
  location_setting: string;
  characters_involved: string[];
  dramatic_question: string;
  conflict_narrative: string;
  pivotal_outcome: string;
  visual_prompt: string;
  version: number;
  revision_notes?: string | null;
  created_at: string;
}

export interface UnfoldedUniverseRead {
  world_bible: WorldBibleRead;
  characters: CharacterRead[];
  relationships: CharacterRelationshipRead[];
  scenes: SceneRead[];
}

export type TraceNodeType =
  | "root_seed"
  | "seed_dna"
  | "world_candidate"
  | "human_selection"
  | "world_bible"
  | "key_location"
  | "character"
  | "character_revision"
  | "relationship"
  | "scene"
  | "scene_revision";

export type TraceRelationType =
  | "derived_from"
  | "selected_by"
  | "constrained_by"
  | "appears_in"
  | "generated_for"
  | "refined_from";

export interface TraceNode {
  id: string;
  entity_id: string;
  entity_type: TraceNodeType;
  label: string;
  title: string;
  stage: number;
  summary: string;
  causal_explanation: string;
  parent_ids: string[];
  metadata?: Record<string, unknown>;
}

export interface TraceEdge {
  id: string;
  source: string;
  target: string;
  relation_type: TraceRelationType;
  label: string;
}

export interface TraceGraphRead {
  project_id: string;
  root_node_id: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
  selected_node_id?: string | null;
}

export interface AncestorPathRead {
  node_id: string;
  ancestor_nodes: TraceNode[];
  ancestor_edges: TraceEdge[];
  summary_explanation: string;
}

export interface EntityRevisionRead {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  snapshot_json: string;
  revision_notes: string;
  created_at: string;
}

export interface BranchRead {
  id: string;
  parent_project_id: string | null;
  branch_name: string;
  title: string;
  status: string;
  created_at: string;
}

export interface CharacterRefineRequest {
  motivation?: string;
  core_conflict?: string;
  role?: string;
  revision_notes: string;
}

export interface SceneRefineRequest {
  dramatic_question?: string;
  conflict_narrative?: string;
  pivotal_outcome?: string;
  revision_notes: string;
}

export interface ProjectBundle {
  format_version: string;
  exported_at: string;
  project: Project;
  seed_dna: SeedDNARead | null;
  worlds: WorldCandidateRead[];
  selection: WorldSelectionRead | null;
  unfolded_universe: UnfoldedUniverseRead | null;
  revisions: EntityRevisionRead[];
  lineage: TraceGraphRead | null;
}

export interface SnapshotRead {
  id: string;
  project_id: string;
  storage_key: string;
  size_bytes: number;
  version: number;
  created_at: string;
}


