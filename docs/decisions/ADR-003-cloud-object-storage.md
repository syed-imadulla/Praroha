# ADR-003: Cloud Object Storage and Asset Management

## Status
Accepted

## Context
PRAROHA supports both user-inputted assets (reference imagery, moodboards, user uploads) and AI-generated multimedia assets (concept art, audio cues, storyboards). Storing raw binary files directly inside PostgreSQL (e.g., as BYTEA columns) severely degrades database performance, bloats backups, complicates horizontal scaling, and violates clean separation of concerns.

Additionally, asset handling intersects three distinct architectural dimensions:
1. The raw binary payload itself.
2. The asset metadata and relational attachments.
3. The causal provenance explaining why and how the asset was generated.

## Decision
1. **Cloud Object Storage Direction**: **Supabase Storage** is selected as the primary cloud object-storage target, maintaining vendor harmony with the project's PostgreSQL / Supabase persistence direction.
2. **Provider Abstraction (`StorageProvider`)**: The storage layer is strictly decoupled behind an abstract interface (`StorageProvider`):
   ```python
   class StorageProvider(ABC):
       async def upload(self, file_data: bytes, key: str, mime_type: str) -> str: ...
       async def get_url(self, key: str) -> str: ...
       async def delete(self, key: str) -> bool: ...
   ```
   This ensures future migration to AWS S3, Google Cloud Storage, or Cloudflare R2 requires no changes to application business logic.
3. **Local Filesystem Fallback**: A local filesystem storage adapter (e.g., persisting to `./uploads/` or local mock server) is provided by default. Local development and offline hackathon demonstrations require zero cloud credentials.
4. **Relational Metadata in PostgreSQL**: PostgreSQL / Supabase stores only normalized asset metadata and foreign key relationships, including:
   - `asset_id` (UUID)
   - `project_id` (UUID)
   - `asset_type` (e.g., `image`, `audio`, `video`, `prompt_card`)
   - `mime_type` (e.g., `image/png`, `audio/mpeg`)
   - `storage_key` / path (URI in bucket or local path)
   - `size_bytes` (integer)
   - `source_or_provenance_ref` (indicates whether user-inputted or AI-generated)
   - `version` (integer)
   - `created_at` (timestamp)
   - Relational links: `world_id`, `scene_id`, `character_id`, `branch_id`
5. **Separation of Concerns**:
   - **Object Storage**: Stores the physical binary asset bytes.
   - **PostgreSQL**: Stores asset metadata, relational links, and access URLs.
   - **Traceability Engine**: Stores provenance lineage events (e.g., `generated_for`, `derived_from`), recording which decisions, canon rules, and parent nodes caused the asset to be created.

## Consequences
- **Positive**: High database performance, lean relational backups, provider swappability, zero-friction local development, and clean conceptual separation between binary data, entity metadata, and causal lineage.
- **Negative**: Asset operations require coordinating storage uploads with database transactions; deleting an asset requires cleaning both the database metadata record and the object storage blob.
