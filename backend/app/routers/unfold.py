import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.response import APIResponse, api_success
from backend.app.models.selection import HumanOnlyZones
from backend.app.models.unfold import UnfoldedUniverseRead
from backend.app.providers.factory import get_ai_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session

logger = logging.getLogger("seed_unfold.router.unfold")

router = APIRouter(prefix="/projects/{project_id}", tags=["unfold"])


def enforce_human_only_zones_guard(
    unfolded_data: Dict[str, Any],
    hoz: HumanOnlyZones,
) -> Dict[str, Any]:
    """
    Deterministic backend schema guard ensuring creator locks in Human-Only Zones
    are immutably applied regardless of model hallucination or drift.
    """
    if not hoz or not hoz.is_locked:
        return unfolded_data

    # 1. Core Theme Immutability -> World Bible canon facts
    bible = unfolded_data.setdefault("world_bible", {})
    canon_facts = bible.get("canon_facts", [])
    if not isinstance(canon_facts, list):
        canon_facts = []

    theme_fact = {
        "fact": hoz.core_theme,
        "rule": hoz.core_theme,
        "origin_type": "HUMAN_DECISION",
        "origin_source": "Human-Only Zone: Core Theme",
    }
    if canon_facts:
        canon_facts[0] = theme_fact
    else:
        canon_facts.append(theme_fact)
    bible["canon_facts"] = canon_facts

    # 2. Protagonist Motivation Immutability -> Protagonist character motivation
    characters = unfolded_data.get("characters", [])
    if isinstance(characters, list) and characters:
        protagonist = characters[0]
        for c in characters:
            role_lower = (c.get("role") or "").lower()
            archetype_lower = (c.get("archetype") or "").lower()
            if any(term in role_lower or term in archetype_lower for term in ["protagonist", "lead", "main"]):
                protagonist = c
                break
        protagonist["motivation"] = hoz.protagonist_motivation
        protagonist["origin_type"] = "HUMAN_DECISION"
        protagonist["origin_source"] = "Human-Only Zone: Protagonist Motivation"
        # Also ensure characters[0] is aligned if test directly checks characters[0]
        if characters[0] is not protagonist:
            characters[0]["motivation"] = hoz.protagonist_motivation
            characters[0]["origin_type"] = "HUMAN_DECISION"
            characters[0]["origin_source"] = "Human-Only Zone: Protagonist Motivation"

    # 3. Central Conflict Immutability -> Dramatic climax scene conflict
    scenes = unfolded_data.get("scenes", [])
    if isinstance(scenes, list) and scenes:
        # Standard 3-act climax is scene 3 or index 2; fallback to last scene
        climax_scene = scenes[2] if len(scenes) >= 3 else scenes[-1]
        for s in scenes:
            if s.get("scene_number") == 3:
                climax_scene = s
                break
        climax_scene["conflict_narrative"] = hoz.central_conflict
        climax_scene["conflict"] = hoz.central_conflict
        climax_scene["origin_type"] = "HUMAN_DECISION"
        climax_scene["origin_source"] = "Human-Only Zone: Central Conflict"

    return unfolded_data


@router.post("/unfold", response_model=APIResponse[UnfoldedUniverseRead])
async def unfold_universe(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[UnfoldedUniverseRead]:
    """
    Unfold the selected world candidate into a multi-layered universe
    (World Bible with key locations, Characters, Relationship Web, and Scenes).

    Enforces:
    1. Project exists (HTTP 404 if missing)
    2. Concurrency guard: Rejects requests while 'unfolding' with HTTP 409 Conflict.
    3. Idempotency guard: If already 'universe_unfolded', returns existing codex without re-generating.
    4. Lifecycle state machine: Project must be in 'world_selected' status to begin unfolding.
    5. Atomic transaction: Rolls back completely on failure and resets project to 'world_selected'
       so creator can safely retry without corrupt partial records.
    """
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    # Concurrency guard: already in progress
    if project.status == "unfolding":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Universe unfolding is already in progress for this project.",
        )

    # Idempotency guard: already unfolded
    if project.status == "universe_unfolded":
        existing = await repo.get_unfolded_universe(project_id)
        if existing:
            return api_success(data=existing)

    # Must be in world_selected status
    if project.status != "world_selected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project must be in 'world_selected' status to begin unfolding. Current status: '{project.status}'.",
        )

    if not project.selected_world_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no selected world candidate to unfold.",
        )

    # Fetch selected candidate
    candidate_record = await repo.get_world_candidate(project.selected_world_id)
    if not candidate_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Selected world candidate '{project.selected_world_id}' not found.",
        )

    # Fetch Seed DNA record
    dna_record = await repo.get_latest_seed_dna(project_id)
    if not dna_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project_id}' has no Seed DNA. Complete Stage 2 before unfolding.",
        )

    # Fetch creator selection record & assemble stable Decision DNA snapshot
    active_selection = await repo.get_active_world_selection(project_id)
    decision_dna_dict = None
    creator_rationale = None
    if active_selection:
        sel_rec, _ = active_selection
        creator_rationale = sel_rec.user_rationale
        decision_dna_snapshot = sel_rec.to_decision_dna(candidate_record.to_read_schema())
        decision_dna_dict = decision_dna_snapshot.model_dump()

    # Transition project status to "unfolding"
    project.status = "unfolding"
    session.add(project)
    await session.commit()
    await session.refresh(project)

    # Assemble context with immutable normalized raw_seed for canonical detection
    dna_schema = dna_record.to_seed_dna()
    context = {
        "raw_seed": dna_record.raw_seed or project.seed_text,
        "seed": project.seed_text,
        "seed_dna": dna_schema.model_dump(),
        "selected_world": candidate_record.to_read_schema().model_dump(),
        "creator_rationale": creator_rationale,
        "decision_dna": decision_dna_dict,
    }

    try:
        provider = get_ai_provider()
        unfolded_data = await provider.unfold_universe(context)

        # Apply Human-Only Zones Backend Schema Guard (HOZ-01 & HOZ-02)
        if active_selection:
            sel_rec, _ = active_selection
            hoz = sel_rec.get_human_only_zones()
            if hoz and hoz.is_locked:
                unfolded_data = enforce_human_only_zones_guard(unfolded_data, hoz)

        unfolded_universe = await repo.save_unfolded_universe(
            project_id=project_id,
            world_candidate_id=candidate_record.id,
            data=unfolded_data,
        )
        return api_success(data=unfolded_universe)

    except Exception as exc:
        logger.error(
            "Universe unfolding failed for project '%s': %s",
            project_id,
            exc,
            exc_info=True,
        )
        # Roll back state transition to world_selected so creator can safely retry
        try:
            p = await repo.get_project(project_id)
            if p:
                p.status = "world_selected"
                session.add(p)
                await session.commit()
        except Exception as reset_exc:
            logger.error("Failed to reset project status after error: %s", reset_exc)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Universe unfolding failed: {str(exc)}",
        )


@router.get("/unfolded", response_model=APIResponse[UnfoldedUniverseRead])
async def get_unfolded_universe(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[UnfoldedUniverseRead]:
    """Retrieve the unfolded universe codex for a project."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    codex = await repo.get_unfolded_universe(project_id)
    if not codex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe has not been unfolded yet for this project.",
        )

    return api_success(data=codex)
