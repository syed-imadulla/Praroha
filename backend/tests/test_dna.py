from unittest.mock import AsyncMock, patch
import httpx
import pytest
from pydantic import ValidationError

from backend.app.models.dna import SeedDNA
from backend.app.providers.gemini_provider import GeminiProvider


def test_seed_dna_schema_validation():
    # Valid data
    valid_data = {
        "premise": "A lone researcher stumbles upon a forgotten underwater library.",
        "themes": ["Discovery", "Solitude", "Ancient Lore"],
        "entities": ["Researcher", "Submarine", "The Library"],
        "constraints": ["No surface contact", "Limited oxygen"],
        "tone": "Mysterious, somber, atmospheric",
        "domain_keywords": ["abyss", "submerged", "parchment", "trench"],
    }
    dna = SeedDNA.model_validate(valid_data)
    assert dna.premise == valid_data["premise"]
    assert dna.themes == valid_data["themes"]
    assert dna.entities == valid_data["entities"]
    assert dna.constraints == valid_data["constraints"]
    assert dna.tone == valid_data["tone"]
    assert dna.domain_keywords == valid_data["domain_keywords"]

    # Missing required field 'premise'
    invalid_data = valid_data.copy()
    del invalid_data["premise"]
    with pytest.raises(ValidationError):
        SeedDNA.model_validate(invalid_data)

    # Missing required field 'tone'
    invalid_data_2 = valid_data.copy()
    del invalid_data_2["tone"]
    with pytest.raises(ValidationError):
        SeedDNA.model_validate(invalid_data_2)


@pytest.mark.asyncio
async def test_gemini_provider_mock_fallback():
    # When api_key is None, should immediately fallback
    provider_no_key = GeminiProvider(api_key=None, model="gemini-3.6-flash", allow_mock_fallback=True)
    result_no_key = await provider_no_key.extract_dna("A deep ocean expedition finds a bio-dome.")
    assert result_no_key["fallback_used"] is True
    assert "mock-fallback" in result_no_key["model_used"]
    assert "premise" in result_no_key["seed_dna"]
    assert len(result_no_key["seed_dna"]["themes"]) > 0

    # When api_key is provided but network call raises exception, fallback gracefully
    provider_with_key = GeminiProvider(api_key="fake-test-key", model="gemini-3.6-flash", allow_mock_fallback=True)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Connection refused")
        result_failed_call = await provider_with_key.extract_dna("A lost city underwater.")
        assert result_failed_call["fallback_used"] is True
        assert "mock-fallback" in result_failed_call["model_used"]
        assert result_failed_call["raw_seed"] == "A lost city underwater."
        assert "premise" in result_failed_call["seed_dna"]


@pytest.mark.asyncio
async def test_dna_extract_and_get_endpoint(client: httpx.AsyncClient):
    # 1. Create a project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Ocean Trench Civilization",
            "seed_text": "A diver finds an ancient bronze mechanism operating beneath the Mariana Trench.",
        },
    )
    assert create_res.status_code == 201
    project = create_res.json()["data"]
    project_id = project["id"]
    assert project["status"] == "draft"

    # 2. Before extraction, GET /api/projects/{id}/dna should return 404
    get_before = await client.get(f"/api/projects/{project_id}/dna")
    assert get_before.status_code == 404

    # 3. Extract DNA
    extract_res = await client.post(
        f"/api/projects/{project_id}/dna/extract",
        json={},
    )
    assert extract_res.status_code == 200
    extract_json = extract_res.json()
    assert extract_json["success"] is True

    dna_record = extract_json["data"]
    assert dna_record["project_id"] == project_id
    assert dna_record["raw_seed"] == "A diver finds an ancient bronze mechanism operating beneath the Mariana Trench."
    assert "dna" in dna_record
    dna = dna_record["dna"]
    assert "premise" in dna and len(dna["premise"]) > 0
    assert isinstance(dna["themes"], list) and len(dna["themes"]) > 0
    assert isinstance(dna["entities"], list) and len(dna["entities"]) > 0
    assert isinstance(dna["constraints"], list) and len(dna["constraints"]) > 0
    assert "tone" in dna and len(dna["tone"]) > 0
    assert isinstance(dna["domain_keywords"], list) and len(dna["domain_keywords"]) > 0

    # 4. Check project status transitioned to 'understood'
    proj_res = await client.get(f"/api/projects/{project_id}")
    assert proj_res.status_code == 200
    assert proj_res.json()["data"]["status"] == "understood"

    # 5. Retrieve via GET /api/projects/{id}/dna
    get_res = await client.get(f"/api/projects/{project_id}/dna")
    assert get_res.status_code == 200
    get_json = get_res.json()
    assert get_json["success"] is True
    assert get_json["data"]["id"] == dna_record["id"]
    assert get_json["data"]["dna"]["premise"] == dna["premise"]


@pytest.mark.asyncio
async def test_raw_seed_immutability(client: httpx.AsyncClient):
    custom_seed = "Exact user input that must be preserved permanently without alterations."
    create_res = await client.post(
        "/api/projects",
        json={"title": "Immutability Test", "seed_text": custom_seed},
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    extract_res = await client.post(
        f"/api/projects/{project_id}/dna/extract",
        json={"raw_seed": custom_seed},
    )
    assert extract_res.status_code == 200
    extracted_data = extract_res.json()["data"]

    # Verify immutable persistence
    assert extracted_data["raw_seed"] == custom_seed

    # Verify retrieval preserves exact raw seed
    get_res = await client.get(f"/api/projects/{project_id}/dna")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["raw_seed"] == custom_seed
