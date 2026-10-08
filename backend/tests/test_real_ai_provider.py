import os
from unittest.mock import AsyncMock, patch
import httpx
import pytest

from backend.app.core.errors import AIProviderError
from backend.app.providers.gemini_provider import GeminiProvider


@pytest.mark.asyncio
async def test_gemini_provider_raises_aiprovidererror_on_missing_or_invalid_key():
    """Verify GeminiProvider raises AIProviderError instead of silently falling back when mock fallback is disabled."""
    provider = GeminiProvider(api_key=None, model="gemini-3.6-flash", allow_mock_fallback=False)
    with pytest.raises(AIProviderError) as exc_info:
        await provider.extract_dna("A forgotten oasis in the center of a magnetic storm.")
    assert exc_info.value.status_code in [502, 503]
    assert exc_info.value.error_code in ["AI_API_KEY_MISSING", "AI_AUTH_FAILED", "AI_GENERATION_FAILED"]


@pytest.mark.asyncio
async def test_gemini_provider_raises_aiprovidererror_on_network_failure():
    """When allow_mock_fallback=False and network fails, provider must raise AIProviderError with retryable=True."""
    provider = GeminiProvider(api_key="fake-test-key", model="gemini-3.6-flash", allow_mock_fallback=False)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Network unreachable")
        with pytest.raises(AIProviderError) as exc_info:
            await provider.extract_dna("A subterranean laboratory harnessing volcanic crystal frequencies.")
        assert exc_info.value.status_code in [502, 503]
        assert exc_info.value.retryable is True


@pytest.mark.asyncio
async def test_gemini_provider_unfold_raises_aiprovidererror():
    """Verify unfold_universe raises AIProviderError on failure when allow_mock_fallback=False."""
    provider = GeminiProvider(api_key="fake-test-key", model="gemini-3.6-flash", allow_mock_fallback=False)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.HTTPStatusError("Service Unavailable", request=None, response=httpx.Response(503))
        with pytest.raises(AIProviderError) as exc_info:
            await provider.unfold_universe({"project_id": "test", "world": {"title": "Test World"}})
        assert exc_info.value.status_code in [502, 503]
        assert exc_info.value.retryable is True


@pytest.mark.asyncio
async def test_ai_provider_error_fastapi_response(client: httpx.AsyncClient):
    """Verify FastAPI exception handler returns standardized error envelope for AIProviderError."""
    # Create a project with seed_text
    create_res = await client.post("/api/projects", json={"title": "Error Handling Project", "seed_text": "A valid creative seed text."})
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # Patch get_ai_provider to raise AIProviderError
    failing_provider = GeminiProvider(api_key="fake-key", allow_mock_fallback=False)
    with patch("backend.app.routers.dna.get_ai_provider", return_value=failing_provider):
        with patch.object(failing_provider, "extract_dna", side_effect=AIProviderError(
            message="Google Gemini API quota exceeded or service unavailable.",
            error_code="AI_GENERATION_FAILED",
            status_code=502,
            retryable=True,
        )):
            dna_res = await client.post(f"/api/projects/{project_id}/dna/extract")
            assert dna_res.status_code == 500
            body = dna_res.json()
            assert body["success"] is False
            assert "Google Gemini API quota exceeded" in body["error"]["message"]


@pytest.mark.asyncio
@pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY") == "mock-key",
    reason="Live Gemini API key not configured in environment"
)
async def test_live_gemini_generation_seed_a_vs_seed_b():
    """Verify live Gemini API produces distinct, divergent outputs for distinct seeds."""
    api_key = os.environ.get("GEMINI_API_KEY")
    provider = GeminiProvider(api_key=api_key, model="gemini-3.6-flash", allow_mock_fallback=False)

    seed_a = "A nomadic clockmaker wandering a desert of calcified glass."
    seed_b = "A silent monastery orbiting a dying white dwarf star."

    res_a = await provider.extract_dna(seed_a)
    res_b = await provider.extract_dna(seed_b)

    dna_a = res_a["seed_dna"]
    dna_b = res_b["seed_dna"]

    # Verify material divergence between seeds
    assert dna_a["premise"] != dna_b["premise"]
    assert set(dna_a.get("themes", [])) != set(dna_b.get("themes", []))

    # Verify neither contains mock fallback strings
    assert "Sunken Ocean City" not in dna_a.get("premise", "")
    assert "Sunken Ocean City" not in dna_b.get("premise", "")
    assert "Aethelgard" not in str(dna_a)
    assert "Aethelgard" not in str(dna_b)
