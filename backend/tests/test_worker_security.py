import json
import os
import pytest
from backend.app.workers.cinematic_worker import (
    WorkerHTTPHandler,
    get_expected_auth_token,
    resolve_asset_to_local_path,
)
from backend.app.services.cinematic_preview import CinematicPreviewSpec


class DummyWFile:
    def __init__(self):
        self.data = bytearray()

    def write(self, b):
        self.data.extend(b)


class DummyRFile:
    def __init__(self, data: bytes):
        self.data = data
        self.offset = 0

    def read(self, n):
        chunk = self.data[self.offset : self.offset + n]
        self.offset += len(chunk)
        return chunk


class MockWorkerHandler:
    """Lightweight test harness for WorkerHTTPHandler request handling."""

    def __init__(self, method: str, path: str, headers: dict, body: dict = None):
        self.command = method
        self.path = path
        self.headers = headers
        raw_body = json.dumps(body).encode("utf-8") if body else b""
        if "Content-Length" not in self.headers:
            self.headers["Content-Length"] = str(len(raw_body))
        self.rfile = DummyRFile(raw_body)
        self.wfile = DummyWFile()
        self.status_code = None
        self.response_headers = {}

    def address_string(self):
        return "127.0.0.1"

    def send_response(self, code):
        self.status_code = code

    def send_header(self, key, value):
        self.response_headers[key] = value

    def end_headers(self):
        pass


@pytest.mark.asyncio
async def test_worker_unauthenticated_request_rejected():
    """Unauthenticated POST /render requests must be rejected with 401 Unauthorized."""
    handler = MockWorkerHandler(
        method="POST",
        path="/render",
        headers={"Content-Length": "10"},
        body={"spec": {"project_id": "p1", "entity_id": "w1"}},
    )
    WorkerHTTPHandler.do_POST(handler)
    assert handler.status_code == 401
    resp = json.loads(handler.wfile.data.decode("utf-8"))
    assert resp.get("status") == "unauthorized"


@pytest.mark.asyncio
async def test_worker_authenticated_request_valid_token():
    """Requests with valid Bearer token pass authentication."""
    token = get_expected_auth_token()
    handler = MockWorkerHandler(
        method="POST",
        path="/render",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Length": "2",
        },
        body={"spec": {"project_id": "test_proj", "entity_id": "test_ent"}},
    )
    # Payload has missing image so it will attempt run_worker and produce 0 or static_fallback
    WorkerHTTPHandler.do_POST(handler)
    # Auth passed (status is not 401)
    assert handler.status_code in (200, 500)


@pytest.mark.asyncio
async def test_worker_rejects_path_traversal():
    """Worker must reject payloads with path traversal in asset paths."""
    token = get_expected_auth_token()
    handler = MockWorkerHandler(
        method="POST",
        path="/render",
        headers={"Authorization": f"Bearer {token}"},
        body={
            "spec": {
                "project_id": "test_proj",
                "entity_id": "test_ent",
                "image_path": "../../../etc/passwd",
            }
        },
    )
    WorkerHTTPHandler.do_POST(handler)
    assert handler.status_code == 400
    resp = json.loads(handler.wfile.data.decode("utf-8"))
    assert "Path traversal rejected" in resp.get("error", "")


@pytest.mark.asyncio
async def test_worker_rejects_cloud_metadata_ssrf():
    """Worker must reject SSRF requests to cloud metadata endpoints."""
    token = get_expected_auth_token()
    handler = MockWorkerHandler(
        method="POST",
        path="/render",
        headers={"Authorization": f"Bearer {token}"},
        body={
            "spec": {
                "project_id": "test_proj",
                "entity_id": "test_ent",
                "image_path": "http://169.254.169.254/latest/meta-data/",
            }
        },
    )
    WorkerHTTPHandler.do_POST(handler)
    assert handler.status_code == 400
    resp = json.loads(handler.wfile.data.decode("utf-8"))
    assert "Metadata endpoint blocked" in resp.get("error", "")


@pytest.mark.asyncio
async def test_worker_rejects_invalid_project_id():
    """Worker must reject invalid project_id characters to prevent cross-project attacks."""
    token = get_expected_auth_token()
    handler = MockWorkerHandler(
        method="POST",
        path="/render",
        headers={"Authorization": f"Bearer {token}"},
        body={
            "spec": {
                "project_id": "proj/../../hack",
                "entity_id": "world_1",
            }
        },
    )
    WorkerHTTPHandler.do_POST(handler)
    assert handler.status_code == 400
    resp = json.loads(handler.wfile.data.decode("utf-8"))
    assert "Invalid project_id format" in resp.get("error", "")


def test_resolve_asset_blocks_ssrf_and_traversal(tmp_path):
    """resolve_asset_to_local_path rejects traversal and metadata IPs."""
    assert resolve_asset_to_local_path("../../etc/passwd", str(tmp_path), "img") is None
    assert resolve_asset_to_local_path("http://169.254.169.254/secret", str(tmp_path), "img") is None
    assert resolve_asset_to_local_path("path/with/\x00/null", str(tmp_path), "img") is None


def test_worker_ignores_payload_database_url(monkeypatch):
    """
    Security verification: Worker must strictly read database credentials from server-side
    environment secrets (DATABASE_URL) and ignore any payload-injected connection strings.
    """
    from unittest.mock import patch

    server_db = "postgresql+asyncpg://server_user:server_pass@server_host:5432/server_db"
    monkeypatch.setenv("DATABASE_URL", server_db)

    token = get_expected_auth_token()
    handler = MockWorkerHandler(
        method="POST",
        path="/render",
        headers={"Authorization": f"Bearer {token}"},
        body={
            "job_id": "job-test-sec",
            "spec": {
                "project_id": "test_proj",
                "entity_id": "test_ent",
            },
            "database_url": "postgresql+asyncpg://attacker:rogue_pass@attacker_host:5432/rogue_db",
            "storage_provider": "local",
        },
    )

    with patch("backend.app.workers.cinematic_worker.run_worker") as mock_run_worker, \
         patch("asyncio.run") as mock_asyncio_run:
        mock_run_worker.return_value = None
        mock_asyncio_run.return_value = 0
        WorkerHTTPHandler.do_POST(handler)
        assert handler.status_code == 200

        # Verify run_worker was called with server-side DATABASE_URL, NOT the payload's attacker DB
        assert mock_run_worker.called
        call_kwargs = mock_run_worker.call_args[1]
        assert call_kwargs.get("database_url") == server_db
        assert "attacker" not in str(call_kwargs.get("database_url"))
