# Phase 7: Refine, Branch & Save (Tattva 6: Parinamana & Dharana) - Research

## 1. Domain Overview & Requirements Mapping
Phase 7 implements **Tattva 6: Parinamana (Continuous Transformation & Mutation)** and **Dharana (Sustenance & Persistence)**.
- **PERS-01**: User can refine an individual component (Characters and Scenes) producing an auditable new version backed by immutable revision records.
- **PERS-02**: User can branch from any stage or world candidate, creating a new exploratory timeline with strict child entity ID remapping while preserving the original branch.
- **PERS-03**: User can save the full project state (including synthesized Trace DAG) as a portable JSON bundle and backend object storage snapshot, and reload it.

---

## 2. Technical Investigation & Corrected Patterns

### A. Immutable Revision History (`entity_revisions`) & Audit Diffs
- Overwriting entity records in-place without storing prior states prevents computing audit diffs.
- Solution: Generic `entity_revisions` table (`EntityRevisionRecord`):
  ```python
  class EntityRevisionRecord(SQLModel, table=True):
      __tablename__ = "entity_revisions"
      id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
      project_id: str = Field(index=True)
      entity_type: str = Field(index=True)  # 'character' | 'scene'
      entity_id: str = Field(index=True)
      version: int = Field(index=True)
      snapshot_json: str
      revision_notes: str
      created_at: datetime = Field(default_factory=get_utc_now)
  ```
- Before/while mutating a Character or Scene:
  1. Record current state snapshot as `version = current.version`.
  2. Apply user trait updates and user revision notes.
  3. Increment entity `version` (`current.version + 1`).
  4. Record new state snapshot in `entity_revisions`.
- Frontend reads `GET /api/projects/{id}/revisions` to render side-by-side field diffs (previous vs new traits) and timestamps in the Refinement Audit Log.

### B. Phase 6 Lineage Version Semantics (`refined_from`)
- In `backend/app/models/lineage.py`:
  `TraceRelationType = Literal["derived_from", "selected_by", "constrained_by", "appears_in", "generated_for", "refined_from"]`
- In `LineageService`:
  - When an entity has revisions in `entity_revisions`:
    - Synthesizes `node-char-{id}-v1` $\to$ `refined_from` $\to$ `node-char-{id}-v2`.
    - Downstream scene beats and relationships connect to the latest active version node.
  - Zero CoT leakage: Node explanations describe human creator refinement notes ("Revised in v2: Realigned motivation toward symbiotic bio-preservation") without exposing prompt tokens.

### C. Strict Branch Cloning ID Remapping (PERS-02)
- To prevent any child project record from referencing a parent project entity:
  ```python
  candidate_id_map: Dict[str, str] = {}
  char_id_map: Dict[str, str] = {}

  # 1. Clone World Candidates
  for parent_cand in parent_candidates:
      child_cand = WorldCandidateRecord(
          id=str(uuid.uuid4()),
          project_id=child_project.id,
          candidate_index=parent_cand.candidate_index,
          title=parent_cand.title,
          archetype=parent_cand.archetype,
          concept=parent_cand.concept,
          aesthetic=parent_cand.aesthetic,
          core_tension=parent_cand.core_tension,
          trade_offs=parent_cand.trade_offs,
          key_visual=parent_cand.key_visual,
      )
      candidate_id_map[parent_cand.id] = child_cand.id

  # 2. Clone World Selection
  if parent_selection:
      child_selection = WorldSelectionRecord(
          id=str(uuid.uuid4()),
          project_id=child_project.id,
          world_candidate_id=candidate_id_map[parent_selection.world_candidate_id],
          batch_id=str(uuid.uuid4()),
          user_rationale=parent_selection.user_rationale,
      )

  # 3. Clone World Bible
  if parent_bible:
      child_bible = WorldBibleRecord(
          id=str(uuid.uuid4()),
          project_id=child_project.id,
          world_candidate_id=candidate_id_map[parent_bible.world_candidate_id],
          geography=parent_bible.geography,
          physics_rules=parent_bible.physics_rules,
          history_timeline_json=parent_bible.history_timeline_json,
          factions_json=parent_bible.factions_json,
          canon_facts_json=parent_bible.canon_facts_json,
          key_locations_json=parent_bible.key_locations_json,
          visual_style_prompt=parent_bible.visual_style_prompt,
      )

  # 4. Clone Characters
  for parent_char in parent_characters:
      child_char = CharacterRecord(
          id=str(uuid.uuid4()),
          project_id=child_project.id,
          world_candidate_id=candidate_id_map[parent_char.world_candidate_id],
          name=parent_char.name,
          role=parent_char.role,
          archetype=parent_char.archetype,
          motivation=parent_char.motivation,
          core_conflict=parent_char.core_conflict,
          visual_prompt=parent_char.visual_prompt,
          version=parent_char.version,
          revision_notes=parent_char.revision_notes,
      )
      char_id_map[parent_char.id] = child_char.id

  # 5. Clone Relationships (remapping both source and target character IDs)
  for parent_rel in parent_relationships:
      child_rel = CharacterRelationshipRecord(
          id=str(uuid.uuid4()),
          project_id=child_project.id,
          world_candidate_id=candidate_id_map[parent_rel.world_candidate_id],
          source_character_id=char_id_map[parent_rel.source_character_id],
          target_character_id=char_id_map[parent_rel.target_character_id],
          relation_type=parent_rel.relation_type,
          dynamic_description=parent_rel.dynamic_description,
      )

  # 6. Clone Scenes
  for parent_scene in parent_scenes:
      child_scene = SceneRecord(
          id=str(uuid.uuid4()),
          project_id=child_project.id,
          world_candidate_id=candidate_id_map[parent_scene.world_candidate_id],
          scene_number=parent_scene.scene_number,
          title=parent_scene.title,
          location_setting=parent_scene.location_setting,
          characters_json=parent_scene.characters_json,
          dramatic_question=parent_scene.dramatic_question,
          conflict_narrative=parent_scene.conflict_narrative,
          pivotal_outcome=parent_scene.pivotal_outcome,
          visual_prompt=parent_scene.visual_prompt,
          version=parent_scene.version,
          revision_notes=parent_scene.revision_notes,
      )
  ```

### D. Complete ProjectBundle with Lineage DAG
- In `backend/app/models/persistence.py`:
  ```python
  class ProjectBundle(BaseModel):
      format_version: str = "1.0"
      exported_at: datetime
      project: ProjectRead
      seed_dna: Optional[SeedDNARead] = None
      worlds: List[WorldCandidateRead] = []
      selection: Optional[WorldSelectionRead] = None
      unfolded_universe: Optional[UnfoldedUniverseRead] = None
      lineage: Optional[TraceGraphRead] = None
  ```
- Export includes the full synthesized `TraceGraphRead`.
- Import unpacks all entities and recreates a clean working project with preserved history.

### E. StorageProvider Interface Verification
- Inspection of `backend/app/providers/storage.py` confirms:
  ```python
  class StorageProvider(ABC):
      @abstractmethod
      async def upload(self, file_data: bytes, key: str, mime_type: str) -> str: ...
      @abstractmethod
      async def get_url(self, key: str) -> str: ...
      @abstractmethod
      async def delete(self, key: str) -> bool: ...
  ```
- Method name is `upload(...)`, NOT `upload_asset(...)`.
- Snapshot service will call:
  `await self.storage.upload(file_data=bundle_bytes, key=f"snapshots/{project_id}/snapshot_{ts}.json", mime_type="application/json")`
- Accompanied by inserting an `Asset` record into the database.

### F. Refinement Scope Boundary
- **Characters and Scenes**: In scope for PERS-01.
- **World Bible / Key Locations**: Canon laws remain the immutable world foundation for Phase 7.
