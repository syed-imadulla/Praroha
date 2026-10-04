import pytest
from backend.app.providers.base import AIProvider
from backend.app.providers.factory import get_ai_provider, get_storage_provider
from backend.app.providers.mock_provider import CANONICAL_WORLDS, MockProvider
from backend.app.providers.storage import LocalStorageProvider


@pytest.mark.asyncio
async def test_mock_provider_health_check():
    provider: AIProvider = get_ai_provider()
    health = await provider.health_check()
    assert health["status"] == "healthy"
    assert health["provider"] == "mock"


@pytest.mark.asyncio
async def test_mock_provider_extract_dna():
    provider = MockProvider()
    seed = "A child discovers a forgotten city beneath the ocean."
    dna_result = await provider.extract_dna(seed)

    assert dna_result["raw_seed"] == seed
    dna = dna_result["seed_dna"]
    assert "premise" in dna
    assert len(dna["themes"]) >= 3
    assert len(dna["entities"]) >= 3
    assert len(dna["constraints"]) >= 1


@pytest.mark.asyncio
async def test_mock_provider_generate_worlds():
    provider = MockProvider()
    worlds = await provider.generate_worlds({})
    # Strictly exactly three worlds per product requirement
    assert len(worlds) == 3
    titles = [w["title"] for w in worlds]
    assert titles == ["Lost Civilization", "Bio-City", "Time Capsule"]
    for world in worlds:
        assert "id" in world
        assert "title" in world
        assert "concept" in world
        assert "aesthetic" in world
        assert "core_tension" in world


@pytest.mark.asyncio
async def test_mock_provider_unfold_stages():
    provider = MockProvider()

    # Unfold bible
    bible = await provider.unfold_stage("bible", {"world_id": "world-1"})
    assert bible["world_id"] == "world-1"
    assert "geography" in bible
    assert len(bible["factions"]) >= 1

    # Unfold characters
    chars = await provider.unfold_stage("characters", {"world_id": "world-1"})
    assert len(chars["characters"]) >= 2
    assert chars["characters"][0]["name"] == "Kiran (The Child)"

    # Unfold scenes
    scenes = await provider.unfold_stage("scenes", {"world_id": "world-1"})
    assert len(scenes["scenes"]) >= 2


@pytest.mark.asyncio
async def test_local_storage_provider(tmp_path):
    storage = LocalStorageProvider(upload_dir=str(tmp_path / "uploads"))
    test_data = b"Hello, Seed Unfold Asset Storage!"
    key = "projects/test-project/concept.txt"

    # Upload
    url = await storage.upload(test_data, key, "text/plain")
    assert "/uploads/" in url

    # Get URL
    retrieved_url = await storage.get_url(key)
    assert retrieved_url == url

    # Delete
    deleted = await storage.delete(key)
    assert deleted is True

    # Delete non-existent
    deleted_again = await storage.delete(key)
    assert deleted_again is False
